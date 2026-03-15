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

    // Get original design
    const originalResult = await pool.query(
      'SELECT * FROM designs WHERE id = $1 AND user_id = $2',
      [params.id, decoded.userId]
    )

    if (originalResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      )
    }

    const original = originalResult.rows[0]

    // Create duplicate
    const duplicateResult = await pool.query(
      `INSERT INTO designs (name, description, canvas_data, user_id, width, height, thumbnail, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        `${original.name} (Copy)`,
        original.description,
        original.canvas_data,
        decoded.userId,
        original.width,
        original.height,
        original.thumbnail,
        original.tags
      ]
    )

    const duplicate = duplicateResult.rows[0]

    return NextResponse.json({
      message: 'Design duplicated successfully',
      design: {
        ...duplicate,
        tags: duplicate.tags || []
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Duplicate design error:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate design' },
      { status: 500 }
    )
  }
}
