import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

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

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user security settings
    const userResult = await pool.query(
      'SELECT two_factor_enabled, email_notifications, session_timeout, login_alerts FROM users WHERE id = $1',
      [decoded.userId]
    )

    // Get active sessions
    const sessionsResult = await pool.query(`
      SELECT * FROM user_sessions 
      WHERE user_id = $1 AND expires_at > NOW() 
      ORDER BY last_active DESC
    `, [decoded.userId])

    // Get API keys
    const apiKeysResult = await pool.query(`
      SELECT * FROM api_keys 
      WHERE user_id = $1 AND is_active = true 
      ORDER BY created_at DESC
    `, [decoded.userId])

    // Get recent security logs
    const logsResult = await pool.query(`
      SELECT * FROM security_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [decoded.userId])

    const securitySettings = {
      twoFactorEnabled: userResult.rows[0]?.two_factor_enabled || false,
      emailNotifications: userResult.rows[0]?.email_notifications || false,
      sessionTimeout: userResult.rows[0]?.session_timeout || 60,
      loginAlerts: userResult.rows[0]?.login_alerts || false,
      activeSessions: sessionsResult.rows,
      apiKeys: apiKeysResult.rows,
      securityLogs: logsResult.rows
    }

    return NextResponse.json(securitySettings)

  } catch (error) {
    console.error('GET security error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    )
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

    const { setting, value } = await request.json()

    let updateQuery = ''
    let updateValue: any = null

    switch (setting) {
      case 'two_factor_enabled':
        updateQuery = 'UPDATE users SET two_factor_enabled = $1, updated_at = NOW() WHERE id = $2'
        updateValue = Boolean(value)
        break
      case 'email_notifications':
        updateQuery = 'UPDATE users SET email_notifications = $1, updated_at = NOW() WHERE id = $2'
        updateValue = Boolean(value)
        break
      case 'session_timeout':
        updateQuery = 'UPDATE users SET session_timeout = $1, updated_at = NOW() WHERE id = $2'
        updateValue = Number(value)
        break
      case 'login_alerts':
        updateQuery = 'UPDATE users SET login_alerts = $1, updated_at = NOW() WHERE id = $2'
        updateValue = Boolean(value)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid setting' },
          { status: 400 }
        )
    }

    await pool.query(updateQuery, [updateValue, decoded.userId])

    // Log security setting change
    await pool.query(`
      INSERT INTO security_logs (user_id, type, description, ip_address, user_agent, success, created_at)
      VALUES ($1, 'security_event', $2, $3, $4, true, NOW())
    `, [
      decoded.userId,
      `Security setting changed: ${setting}`,
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    ])

    return NextResponse.json({
      message: 'Security setting updated successfully'
    })

  } catch (error) {
    console.error('POST security error:', error)
    return NextResponse.json(
      { error: 'Failed to update security setting' },
      { status: 500 }
    )
  }
}
