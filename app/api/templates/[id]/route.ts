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
    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template: result.rows[0] })
  } catch (error) {
    console.error('GET template error:', error)
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
    const body = await request.json()
    const { name, description, canvas_data, thumbnail, category, tags, is_public } = body

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
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`)
      values.push(category)
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`)
      values.push(tags)
    }
    if (is_public !== undefined) {
      updateFields.push(`is_public = $${paramIndex++}`)
      values.push(is_public)
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(params.id)

    const query = `
      UPDATE templates 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template: result.rows[0] })
  } catch (error) {
    console.error('PUT template error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      'DELETE FROM templates WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('DELETE template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
