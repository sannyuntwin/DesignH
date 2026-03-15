import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  database: 'designh',
  user: 'postgres',
  password: 'postgres',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const sort = searchParams.get('sort') || 'popular'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `
      SELECT t.*, u.name as author_name, u.avatar as author_avatar
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_public = true
    `
    const queryParams: any[] = []

    // Filter by category
    if (category !== 'all') {
      query += ` AND t.category = $${queryParams.length + 1}`
      queryParams.push(category)
    }

    // Sort
    switch (sort) {
      case 'popular':
        query += ` ORDER BY t.downloads DESC`
        break
      case 'newest':
        query += ` ORDER BY t.created_at DESC`
        break
      case 'rating':
        query += ` ORDER BY t.rating DESC, t.rating_count DESC`
        break
      default:
        query += ` ORDER BY t.downloads DESC`
    }

    // Pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit, offset)

    const result = await pool.query(query, queryParams)

    return NextResponse.json({
      templates: result.rows.map(template => ({
        ...template,
        tags: template.tags || [],
        author: {
          id: template.created_by,
          name: template.author_name,
          avatar: template.author_avatar
        }
      }))
    })

  } catch (error) {
    console.error('GET templates error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, canvas_data, thumbnail, category, tags, created_by } = body

    if (!name || !canvas_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const query = `
      INSERT INTO templates (name, description, canvas_data, thumbnail, category, tags, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    
    const values = [
      name,
      description || '',
      JSON.stringify(canvas_data),
      thumbnail || null,
      category || null,
      tags || [],
      created_by
    ]

    const result = await pool.query(query, values)

    return NextResponse.json({ template: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('POST templates error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
