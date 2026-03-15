import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { user_id, permission = 'view', invited_by } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if design exists
    const designResult = await pool.query(
      'SELECT id FROM designs WHERE id = $1',
      [params.id]
    )

    if (designResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    // Add collaboration
    const query = `
      INSERT INTO collaborations (design_id, user_id, permission, invited_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (design_id, user_id) 
      DO UPDATE SET permission = $3, updated_at = NOW()
      RETURNING *
    `

    const result = await pool.query(query, [params.id, user_id, permission, invited_by])

    return NextResponse.json({ collaboration: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('POST share error:', error)
    return NextResponse.json(
      { error: 'Failed to share design' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const query = `
      SELECT c.*, u.email, u.name as user_name
      FROM collaborations c
      JOIN users u ON c.user_id = u.id
      WHERE c.design_id = $1
      ORDER BY c.created_at DESC
    `

    const result = await pool.query(query, [params.id])

    return NextResponse.json({ collaborators: result.rows })
  } catch (error) {
    console.error('GET collaborators error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    )
  }
}
