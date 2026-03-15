import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sort_by') || 'date'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = `
      SELECT a.*, 
             COUNT(*) OVER() as total_count
      FROM assets a
      WHERE a.user_id = $1
    `
    const params: any[] = [decoded.userId]
    let paramIndex = 2

    if (category && category !== 'all') {
      query += ` AND a.type = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (search) {
      query += ` AND (a.name ILIKE $${paramIndex} OR a.tags::text ILIKE $${paramIndex + 1})`
      params.push(`%${search}%`, `%${search}%`)
      paramIndex += 2
    }

    // Add sorting
    const sortColumn = sortBy === 'name' ? 'a.name' : 
                     sortBy === 'size' ? 'a.size' : 
                     'a.created_at'
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'
    
    query += ` ORDER BY ${sortColumn} ${sortDirection}`

    // Add pagination
    const offset = (page - 1) * limit
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    const assets = result.rows.map(asset => ({
      ...asset,
      tags: asset.tags || [],
      metadata: asset.metadata || {}
    }))

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total: result.rows[0]?.total_count || 0,
        totalPages: Math.ceil((result.rows[0]?.total_count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('GET assets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
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

    const { name, type, url, size, tags, category, metadata } = await request.json()

    if (!name || !type || !url) {
      return NextResponse.json(
        { error: 'Name, type, and url are required' },
        { status: 400 }
      )
    }

    const result = await pool.query(`
      INSERT INTO assets (name, type, url, size, tags, category, metadata, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      name,
      type,
      url,
      size || 0,
      JSON.stringify(tags || []),
      category || 'other',
      JSON.stringify(metadata || {}),
      decoded.userId
    ])

    return NextResponse.json({
      message: 'Asset created successfully',
      asset: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('POST assets error:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
