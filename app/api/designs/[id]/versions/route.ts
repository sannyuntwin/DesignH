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
    const query = `
      SELECT dv.*, u.name as created_by_name
      FROM design_versions dv
      JOIN users u ON dv.created_by = u.id
      WHERE dv.design_id = $1
      ORDER BY dv.version_number DESC
    `

    const result = await pool.query(query, [params.id])

    return NextResponse.json({ versions: result.rows })
  } catch (error) {
    console.error('GET versions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
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
    const { canvas_data, created_by, change_description } = body

    if (!canvas_data || !created_by) {
      return NextResponse.json(
        { error: 'Canvas data and created_by are required' },
        { status: 400 }
      )
    }

    // Get the next version number
    const versionResult = await pool.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM design_versions WHERE design_id = $1',
      [params.id]
    )

    const nextVersion = versionResult.rows[0].next_version

    const query = `
      INSERT INTO design_versions (design_id, version_number, canvas_data, created_by, change_description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const values = [
      params.id,
      nextVersion,
      JSON.stringify(canvas_data),
      created_by,
      change_description || null
    ]

    const result = await pool.query(query, values)

    return NextResponse.json({ version: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('POST version error:', error)
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    )
  }
}
