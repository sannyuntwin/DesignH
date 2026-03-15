import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content, resolved } = body

    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`)
      values.push(content)
    }
    if (resolved !== undefined) {
      updateFields.push(`resolved = $${paramIndex++}`)
      values.push(resolved)
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(params.id)

    const query = `
      UPDATE comments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comment: result.rows[0] })
  } catch (error) {
    console.error('PUT comment error:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
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
      'DELETE FROM comments WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('DELETE comment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
