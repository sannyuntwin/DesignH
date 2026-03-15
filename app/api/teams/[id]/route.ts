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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is member of this team
    const memberCheck = await pool.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [params.id, decoded.userId]
    )

    if (memberCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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
      WHERE t.id = $1
      GROUP BY t.id
    `, [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    const team = result.rows[0]

    return NextResponse.json({
      team: {
        ...team,
        member_count: parseInt(team.member_count),
        design_count: parseInt(team.design_count),
        storage_used: parseInt(team.storage_used) || 0,
        storage_limit: team.subscription_tier === 'free' ? 1024 * 1024 * 1024 :
                     team.subscription_tier === 'pro' ? 10 * 1024 * 1024 * 1024 :
                     100 * 1024 * 1024 * 1024
      }
    })

  } catch (error) {
    console.error('GET team error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

    // Check if user is owner or admin
    const permissionCheck = await pool.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role IN ($3, $4)',
      [params.id, decoded.userId, 'owner', 'admin']
    )

    if (permissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const result = await pool.query(`
      UPDATE teams 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [name, description, params.id])

    return NextResponse.json({
      message: 'Team updated successfully',
      team: result.rows[0]
    })

  } catch (error) {
    console.error('PUT team error:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}
