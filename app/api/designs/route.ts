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

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = `
      SELECT d.*, u.name as user_name,
             COUNT(DISTINCT c.id) as collaborators_count,
             COUNT(DISTINCT v.id) as views_count
      FROM designs d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN collaborations c ON d.id = c.design_id
      LEFT JOIN design_views v ON d.id = v.design_id
      WHERE d.user_id = $1
    `

    let queryParams = [decoded.userId]

    // Apply filters
    switch (filter) {
      case 'recent':
        query += ` AND d.updated_at >= NOW() - INTERVAL '7 days'`
        break
      case 'templates':
        query += ` AND d.is_template = true`
        break
      case 'shared':
        query += ` AND d.is_public = true`
        break
    }

    // Apply search
    if (search) {
      query += ` AND (d.name ILIKE $2 OR d.tags::text ILIKE $2)`
      queryParams.push(`%${search}%`)
    }

    query += ` GROUP BY d.id, u.name ORDER BY d.updated_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit.toString(), offset.toString())

    const result = await pool.query(query, queryParams)

    return NextResponse.json({
      designs: result.rows.map(design => ({
        ...design,
        tags: design.tags || []
      }))
    })

  } catch (error) {
    console.error('GET designs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, canvas_data, width, height, template_id } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Design name is required' },
        { status: 400 }
      )
    }

    // Create new design
    const query = `
      INSERT INTO designs (name, description, canvas_data, user_id, width, height, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `
    
    const values = [
      name,
      description || '',
      JSON.stringify(canvas_data || { elements: [], version: '1.0' }),
      decoded.userId,
      width || 800,
      height || 600
    ]
    
    const result = await pool.query(query, values)
    const design = result.rows[0]

    // If created from template, copy template data
    if (template_id) {
      const templateResult = await pool.query(
        'SELECT canvas_data FROM designs WHERE id = $1 AND is_template = true',
        [template_id]
      )

      if (templateResult.rows.length > 0) {
        await pool.query(
          'UPDATE designs SET canvas_data = $1 WHERE id = $2',
          [templateResult.rows[0].canvas_data, design.id]
        )
        design.canvas_data = templateResult.rows[0].canvas_data
      }
    }

    return NextResponse.json({ 
      message: 'Design created successfully',
      design: {
        ...design,
        tags: design.tags || []
      }
    }, { status: 201 })
  } catch (error) {
    console.error('POST designs error:', error)
    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    )
  }
}
