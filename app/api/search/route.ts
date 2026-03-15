import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
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
    const q = searchParams.get('q')
    const type = searchParams.get('type') || 'designs' // designs, templates, public
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    let query = ''
    let params: any[] = []
    let paramIndex = 1

    switch (type) {
      case 'designs':
        if (userId) {
          query = `
            SELECT d.*, u.name as user_name, u.email
            FROM designs d
            JOIN users u ON d.user_id = u.id
            WHERE d.user_id = $${paramIndex++}
            AND (
              to_tsvector('english', d.name || ' ' || COALESCE(d.description, '') || ' ' || COALESCE(array_to_string(d.tags, ' '), ''))
              @@ to_tsquery('english', $${paramIndex++})
            )
          `
          params.push(userId, q)
        } else {
          return NextResponse.json(
            { error: 'User ID required for design search' },
            { status: 400 }
          )
        }
        break

      case 'templates':
        query = `
          SELECT t.*, u.name as created_by_name
          FROM templates t
          LEFT JOIN users u ON t.created_by = u.id
          WHERE t.is_public = true
          AND (
            to_tsvector('english', t.name || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(array_to_string(t.tags, ' '), ''))
            @@ to_tsquery('english', $${paramIndex++})
          )
        `
        params.push(q)
        break

      case 'public':
        query = `
          SELECT d.*, u.name as user_name, u.email
          FROM designs d
          JOIN users u ON d.user_id = u.id
          WHERE d.is_public = true
          AND (
            to_tsvector('english', d.name || ' ' || COALESCE(d.description, '') || ' ' || COALESCE(array_to_string(d.tags, ' '), ''))
            @@ to_tsquery('english', $${paramIndex++})
          )
        `
        params.push(q)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        )
    }

    // Add category filter
    if (category) {
      query += ` AND category = $${paramIndex++}`
      params.push(category)
    }

    // Add tags filter
    if (tags && tags.length > 0) {
      query += ` AND tags && $${paramIndex++}`
      params.push(tags)
    }

    // Add ordering and pagination
    query += ` ORDER BY updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Get total count for pagination
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '')
    const countResult = await pool.query(countQuery, params.slice(0, -2))

    return NextResponse.json({
      results: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
      has_more: offset + limit < parseInt(countResult.rows[0].count)
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
