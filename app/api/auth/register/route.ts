import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
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

    // Check password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const userId = uuidv4()
    const userResult = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, subscription_tier, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'free', NOW(), NOW())
       RETURNING id, name, email, subscription_tier, created_at`,
      [userId, name, email, passwordHash]
    )

    const user = userResult.rows[0]

    // Create default brand kit for new user
    await pool.query(
      'INSERT INTO brand_kits (user_id, colors, fonts, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, '[]', '[]']
    )

    // Generate JWT token
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscription_tier: user.subscription_tier,
        created_at: user.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
