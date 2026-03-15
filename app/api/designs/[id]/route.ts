import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

// Direct PostgreSQL connection
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

    const result = await pool.query(
      'SELECT * FROM designs WHERE id = $1 AND user_id = $2',
      [params.id, decoded.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      design: {
        ...result.rows[0],
        tags: result.rows[0].tags || []
      }
    })
  } catch (error) {
    console.error('GET design error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const body = await request.json()
    const { name, description, canvas_data, thumbnail, tags } = body

    // Check if design belongs to user
    const designResult = await pool.query(
      'SELECT id FROM designs WHERE id = $1 AND user_id = $2',
      [params.id, decoded.userId]
    )

    if (designResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      )
    }

    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`)
      values.push(description)
    }
    if (canvas_data !== undefined) {
      updateFields.push(`canvas_data = $${paramIndex++}`)
      values.push(JSON.stringify(canvas_data))
    }
    if (thumbnail !== undefined) {
      updateFields.push(`thumbnail = $${paramIndex++}`)
      values.push(thumbnail)
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`)
      values.push(JSON.stringify(tags))
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(params.id)

    const query = `
      UPDATE designs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)

    return NextResponse.json({ 
      design: {
        ...result.rows[0],
        tags: result.rows[0].tags || []
      }
    })
  } catch (error) {
    console.error('PUT design error:', error)
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if design belongs to user
    const designResult = await pool.query(
      'SELECT id FROM designs WHERE id = $1 AND user_id = $2',
      [params.id, decoded.userId]
    )

    if (designResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      )
    }

    // Delete related records first
    await pool.query('DELETE FROM collaborations WHERE design_id = $1', [params.id])
    await pool.query('DELETE FROM design_views WHERE design_id = $1', [params.id])
    await pool.query('DELETE FROM export_jobs WHERE design_id = $1', [params.id])
    await pool.query('DELETE FROM comments WHERE design_id = $1', [params.id])

    // Delete the design
    await pool.query('DELETE FROM designs WHERE id = $1', [params.id])

    return NextResponse.json({ message: 'Design deleted successfully' })
  } catch (error) {
    console.error('DELETE design error:', error)
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    )
  }
}
