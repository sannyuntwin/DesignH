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
  { params }: { params: { jobId: string } }
) {
  try {
    const result = await pool.query(
      'SELECT * FROM export_jobs WHERE id = $1',
      [params.jobId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      )
    }

    const job = result.rows[0]

    return NextResponse.json({ 
      job: {
        id: job.id,
        status: job.status,
        file_url: job.file_url,
        error_message: job.error_message,
        created_at: job.created_at,
        completed_at: job.completed_at
      }
    })
  } catch (error) {
    console.error('GET export job error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export job' },
      { status: 500 }
    )
  }
}
