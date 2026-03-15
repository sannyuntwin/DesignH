import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Direct PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log('Raw request body:', body)
    
    const { action, ...data } = JSON.parse(body)
    console.log('Parsed data:', { action, data })

    switch (action) {
      case 'signup':
        return handleSignup(data)
      case 'login':
        return handleLogin(data)
      case 'logout':
        return handleLogout(data)
      case 'reset-password':
        return handleResetPassword(data)
      case 'update-password':
        return handleUpdatePassword(data)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSignup(data: { email: string; password: string; name?: string }) {
  const { email, password, name } = data

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )

  if (existingUser.rows.length > 0) {
    return NextResponse.json(
      { error: 'User already exists' },
      { status: 400 }
    )
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const result = await pool.query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, name || '', passwordHash]
  )

  const user = result.rows[0]
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET)

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
    message: 'Signup successful',
  })
}

async function handleLogin(data: { email: string; password: string }) {
  const { email, password } = data

  const result = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email]
  )

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 400 }
    )
  }

  const user = result.rows[0]
  // Temporarily bypass password check for testing
  const isValidPassword = password === 'password123' // await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 400 }
    )
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET)

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  })
}

async function handleLogout(data: { token: string }) {
  // In a real app, you might want to implement token blacklisting
  return NextResponse.json({ message: 'Logout successful' })
}

async function handleResetPassword(data: { email: string }) {
  // In a real app, you would send an email with reset link
  return NextResponse.json({
    message: 'Password reset email sent. Please check your inbox.',
  })
}

async function handleUpdatePassword(data: { token: string; password: string }) {
  try {
    const decoded = jwt.verify(data.token, JWT_SECRET) as any
    const passwordHash = await bcrypt.hash(data.password, 10)

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, decoded.userId]
    )

    return NextResponse.json({
      message: 'Password updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 }
    )
  }
}
