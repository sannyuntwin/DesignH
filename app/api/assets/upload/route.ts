import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets', decoded.userId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = path.extname(file.name)
    const filename = `${timestamp}_${randomString}${fileExtension}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    const buffer = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(buffer))

    // Determine asset type
    let assetType: 'image' | 'video' | 'audio' | 'document' | 'archive' = 'document'
    if (file.type.startsWith('image/')) assetType = 'image'
    else if (file.type.startsWith('video/')) assetType = 'video'
    else if (file.type.startsWith('audio/')) assetType = 'audio'
    else if (file.type === 'application/pdf') assetType = 'document'

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (assetType === 'image') {
      // For now, use the same file as thumbnail
      // In production, you'd want to generate actual thumbnails
      thumbnailUrl = `/uploads/assets/${decoded.userId}/${filename}`
    }

    // Save to database
    const result = await pool.query(`
      INSERT INTO assets (name, type, url, size, thumbnail, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      file.name,
      assetType,
      `/uploads/assets/${decoded.userId}/${filename}`,
      file.size,
      thumbnailUrl,
      decoded.userId
    ])

    return NextResponse.json({
      message: 'Asset uploaded successfully',
      asset: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Asset upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    )
  }
}
