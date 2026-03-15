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

    const result = await pool.query(`
      SELECT t.*, 
             COUNT(tm.id) as member_count,
             COUNT(d.id) as design_count,
             COALESCE(SUM(f.size), 0) as storage_used
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN designs d ON t.id = d.team_id
      LEFT JOIN files f ON f.user_id = tm.user_id AND f.parent_id IS NULL
      WHERE tm.user_id = $1 OR t.owner_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [decoded.userId])

    return NextResponse.json({
      teams: result.rows.map(team => ({
        ...team,
        member_count: parseInt(team.member_count),
        design_count: parseInt(team.design_count),
        storage_used: parseInt(team.storage_used) || 0,
        storage_limit: team.subscription_tier === 'free' ? 1024 * 1024 * 1024 : // 1GB
                     team.subscription_tier === 'pro' ? 10 * 1024 * 1024 * 1024 : // 10GB
                     100 * 1024 * 1024 * 1024 // 100GB
      }))
    })

  } catch (error) {
    console.error('GET teams error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
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

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    const result = await pool.query(`
      INSERT INTO teams (name, description, owner_id, subscription_tier, created_at, updated_at)
      VALUES ($1, $2, $3, 'free', NOW(), NOW())
      RETURNING *
    `, [name, description || null, decoded.userId])

    // Add owner as team member
    await pool.query(`
      INSERT INTO team_members (team_id, user_id, role, status, permissions, invited_at, created_at, updated_at)
      VALUES ($1, $2, 'owner', 'active', $3, NOW(), NOW(), NOW())
    `, [result.rows[0].id, decoded.userId, JSON.stringify({
      can_create_designs: true,
      can_edit_designs: true,
      can_delete_designs: true,
      can_manage_team: true,
      can_view_analytics: true,
      can_export_designs: true
    })])

    return NextResponse.json({
      message: 'Team created successfully',
      team: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('POST teams error:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
