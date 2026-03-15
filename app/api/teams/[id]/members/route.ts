import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

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
      SELECT tm.*, u.name, u.email, u.avatar,
             CASE WHEN tm.last_active IS NOT NULL THEN 
               EXTRACT(EPOCH FROM (NOW() - tm.last_active)) / 86400
             ELSE NULL END as days_since_active
      FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.role = 'owner' DESC, tm.role = 'admin' DESC, tm.created_at ASC
    `, [params.id])

    return NextResponse.json({
      members: result.rows.map(member => ({
        ...member,
        permissions: member.permissions || {},
        days_since_active: member.days_since_active ? Math.floor(member.days_since_active) : null
      }))
    })

  } catch (error) {
    console.error('GET team members error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Check if user has permission to invite members
    const permissionCheck = await pool.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2 AND role IN ($3, $4)',
      [params.id, decoded.userId, 'owner', 'admin']
    )

    if (permissionCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [params.id, user.id]
    )

    if (existingMember.rows.length > 0) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 409 }
      )
    }

    // Set default permissions based on role
    const defaultPermissions = {
      owner: {
        can_create_designs: true,
        can_edit_designs: true,
        can_delete_designs: true,
        can_manage_team: true,
        can_view_analytics: true,
        can_export_designs: true
      },
      admin: {
        can_create_designs: true,
        can_edit_designs: true,
        can_delete_designs: true,
        can_manage_team: false,
        can_view_analytics: true,
        can_export_designs: true
      },
      member: {
        can_create_designs: true,
        can_edit_designs: true,
        can_delete_designs: false,
        can_manage_team: false,
        can_view_analytics: false,
        can_export_designs: true
      },
      viewer: {
        can_create_designs: false,
        can_edit_designs: false,
        can_delete_designs: false,
        can_manage_team: false,
        can_view_analytics: false,
        can_export_designs: false
      }
    }

    const result = await pool.query(`
      INSERT INTO team_members (id, team_id, user_id, role, status, permissions, invited_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', $5, NOW(), NOW(), NOW())
      RETURNING *
    `, [uuidv4(), params.id, user.id, role, JSON.stringify(defaultPermissions[role as keyof typeof defaultPermissions])])

    return NextResponse.json({
      message: 'Member invited successfully',
      member: {
        ...result.rows[0],
        name: user.name,
        email: user.email
      }
    }, { status: 201 })

  } catch (error) {
    console.error('POST team members error:', error)
    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 }
    )
  }
}
