import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; format: string } }
) {
  try {
    const { format } = params
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate format
    const validFormats = ['png', 'pdf', 'svg']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      )
    }

    // Get the design
    const designResult = await pool.query(
      'SELECT * FROM designs WHERE id = $1',
      [params.id]
    )

    if (designResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }

    const design = designResult.rows[0]

    // Create export job
    const jobResult = await pool.query(
      'INSERT INTO export_jobs (design_id, user_id, export_type, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [params.id, user_id, format, 'processing']
    )

    const job = jobResult.rows[0]

    // Process export asynchronously (in a real app, you'd use a queue)
    processExportAsync(job.id, design, format)

    return NextResponse.json({ 
      message: 'Export job started',
      job_id: job.id,
      status: 'processing'
    }, { status: 202 })
  } catch (error) {
    console.error('POST export error:', error)
    return NextResponse.json(
      { error: 'Failed to start export' },
      { status: 500 }
    )
  }
}

async function processExportAsync(jobId: string, design: any, format: string) {
  try {
    // Create export directory
    const exportDir = join(process.cwd(), 'public', 'exports')
    if (!existsSync(exportDir)) {
      await mkdir(exportDir, { recursive: true })
    }

    // Generate filename
    const filename = `${design.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${format}`
    const filePath = join(exportDir, filename)

    // Mock export process (in a real app, you'd use actual export libraries)
    let fileContent = ''
    let mimeType = ''

    switch (format) {
      case 'png':
        // In a real app, you'd use html2canvas or similar
        fileContent = 'mock-png-data'
        mimeType = 'image/png'
        break
      case 'pdf':
        // In a real app, you'd use jsPDF
        fileContent = 'mock-pdf-data'
        mimeType = 'application/pdf'
        break
      case 'svg':
        // Convert canvas data to SVG
        fileContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
          <rect width="800" height="600" fill="white"/>
          <text x="50" y="50" font-family="Arial" font-size="16">Exported Design: ${design.name}</text>
        </svg>`
        mimeType = 'image/svg+xml'
        break
    }

    // Write file
    await writeFile(filePath, fileContent)

    // Update job status
    const fileUrl = `/exports/${filename}`
    await pool.query(
      'UPDATE export_jobs SET status = $1, file_url = $2, completed_at = NOW() WHERE id = $3',
      ['completed', fileUrl, jobId]
    )

    console.log(`Export completed: ${fileUrl}`)
  } catch (error) {
    console.error('Export processing error:', error)
    
    // Update job with error
    await pool.query(
      'UPDATE export_jobs SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error instanceof Error ? error.message : 'Unknown error', jobId]
    )
  }
}
