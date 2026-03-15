import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')

    let query = `
      SELECT c.*, u.email, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.design_id = $1
    `
    const queryParams = [params.id]

    if (resolved !== null) {
      query += ` AND c.resolved = $2`
      queryParams.push(resolved === 'true' ? 'true' : 'false')
    }

    query += ` ORDER BY c.created_at ASC`

    const result = await pool.query(query, queryParams)

    return NextResponse.json({ comments: result.rows })
  } catch (error) {
    console.error('GET comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { user_id, content, x_coordinate, y_coordinate, parent_id } = body

    if (!user_id || !content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      )
    }

    const query = `
      INSERT INTO comments (design_id, user_id, content, x_coordinate, y_coordinate, parent_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const values = [
      params.id,
      user_id,
      content,
      x_coordinate || null,
      y_coordinate || null,
      parent_id || null
    ]

    const result = await pool.query(query, values)

    return NextResponse.json({ comment: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('POST comment error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
