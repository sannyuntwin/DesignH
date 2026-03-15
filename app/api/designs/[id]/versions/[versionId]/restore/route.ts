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
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    // Get the version to restore
    const versionResult = await pool.query(
      'SELECT * FROM design_versions WHERE design_id = $1 AND id = $2',
      [params.id, params.versionId]
    )

    if (versionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    const version = versionResult.rows[0]

    // Update the main design with the version's canvas data
    const updateResult = await pool.query(
      'UPDATE designs SET canvas_data = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [version.canvas_data, params.id]
    )

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'Design restored successfully',
      design: updateResult.rows[0],
      restored_from: version
    })
  } catch (error) {
    console.error('POST restore version error:', error)
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    )
  }
}
