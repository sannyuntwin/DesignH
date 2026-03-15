import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Middleware to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile with additional stats
    const userResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.subscription_tier, u.created_at, u.updated_at,
              COUNT(DISTINCT d.id) as designs_count,
              COALESCE(SUM(d.file_size), 0) as storage_used
       FROM users u
       LEFT JOIN designs d ON u.id = d.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.name, u.email, u.subscription_tier, u.created_at, u.updated_at`,
      [decoded.userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Set storage limits based on subscription tier
    const storageLimits = {
      free: 100 * 1024 * 1024, // 100MB
      pro: 1024 * 1024 * 1024,  // 1GB
      enterprise: 10 * 1024 * 1024 * 1024 // 10GB
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at,
      updated_at: user.updated_at,
      designs_count: parseInt(user.designs_count) || 0,
      storage_used: parseInt(user.storage_used) || 0,
      storage_limit: storageLimits[user.subscription_tier as keyof typeof storageLimits] || storageLimits.free
    }

    return NextResponse.json({ user: userProfile })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('content-type')
    let name: string
    let email: string
    let avatar: string | null = null

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data (including avatar upload)
      const formData = await request.formData()
      name = formData.get('name') as string
      email = formData.get('email') as string
      const avatarFile = formData.get('avatar') as File

      if (avatarFile && avatarFile.size > 0) {
        // Upload avatar file
        const { writeFile, mkdir } = require('fs/promises')
        const { join } = require('path')
        const { existsSync } = require('fs')

        const uploadDir = join(process.cwd(), 'public', 'avatars')
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true })
        }

        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${decoded.userId}_${Date.now()}.${fileExt}`
        const filePath = join(uploadDir, fileName)

        const bytes = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        avatar = `/avatars/${fileName}`
      }
    } else {
      // Handle JSON data
      const body = await request.json()
      name = body.name
      email = body.email
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const emailCheckResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, decoded.userId]
    )

    if (emailCheckResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 409 }
      )
    }

    // Update user profile
    const updateQuery = avatar
      ? 'UPDATE users SET name = $1, email = $2, avatar = $3, updated_at = NOW() WHERE id = $4 RETURNING *'
      : 'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING *'

    const updateValues = avatar
      ? [name, email, avatar, decoded.userId]
      : [name, email, decoded.userId]

    const userResult = await pool.query(updateQuery, updateValues)

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = userResult.rows[0]

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        subscription_tier: updatedUser.subscription_tier,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
