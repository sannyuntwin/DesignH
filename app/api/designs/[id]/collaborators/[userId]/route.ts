import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const result = await pool.query(
      'DELETE FROM collaborations WHERE design_id = $1 AND user_id = $2 RETURNING *',
      [params.id, params.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Collaborator removed successfully' })
  } catch (error) {
    console.error('DELETE collaborator error:', error)
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    )
  }
}
