import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
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
    const folderId = searchParams.get('folder_id')
    const sort = searchParams.get('sort') || 'name'
    const type = searchParams.get('type') || 'all'

    let query = `
      SELECT f.*, 
             CASE WHEN f.type = 'folder' THEN (
               SELECT COUNT(*) FROM files WHERE parent_id = f.id
             ) ELSE 0 END as child_count
      FROM files f
      WHERE f.user_id = $1 AND f.parent_id ${folderId ? '= $2' : 'IS NULL'}
    `
    const queryParams: any[] = [decoded.userId]
    if (folderId) {
      queryParams.push(folderId)
    }

    // Filter by type
    if (type !== 'all') {
      if (type === 'image') {
        query += ` AND f.mime_type LIKE 'image%'`
      } else if (type === 'document') {
        query += ` AND (f.mime_type LIKE 'application/pdf' OR f.mime_type LIKE 'text%' OR f.mime_type LIKE 'application/msword%' OR f.mime_type LIKE 'application/vnd.openxmlformats%')`
      } else if (type === 'video') {
        query += ` AND f.mime_type LIKE 'video%'`
      } else if (type === 'audio') {
        query += ` AND f.mime_type LIKE 'audio%'`
      }
    }

    // Sort
    switch (sort) {
      case 'name':
        query += ` ORDER BY f.name ASC`
        break
      case 'size':
        query += ` ORDER BY f.size DESC`
        break
      case 'modified':
        query += ` ORDER BY f.updated_at DESC`
        break
      case 'created':
        query += ` ORDER BY f.created_at DESC`
        break
      default:
        query += ` ORDER BY f.type ASC, f.name ASC`
    }

    const result = await pool.query(query, queryParams)

    // Build breadcrumb
    let breadcrumb: any[] = []
    if (folderId) {
      const breadcrumbQuery = `
        WITH RECURSIVE folder_path AS (
          SELECT id, name, parent_id, 0 as level
          FROM files WHERE id = $1 AND type = 'folder'
          UNION ALL
          SELECT f.id, f.name, f.parent_id, fp.level + 1
          FROM files f
          JOIN folder_path fp ON f.id = fp.parent_id
          WHERE f.type = 'folder'
        )
        SELECT id, name, parent_id FROM folder_path ORDER BY level DESC
      `
      const breadcrumbResult = await pool.query(breadcrumbQuery, [folderId])
      breadcrumb = breadcrumbResult.rows
    }

    return NextResponse.json({
      files: result.rows.map(file => ({
        ...file,
        tags: file.tags || []
      })),
      breadcrumb
    })

  } catch (error) {
    console.error('GET files error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
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

    const { name, type, parent_id, is_public = false, is_encrypted = false } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    if (type === 'folder') {
      // Create folder
      const result = await pool.query(
        `INSERT INTO files (name, type, user_id, parent_id, is_public, is_encrypted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [name, 'folder', decoded.userId, parent_id || null, is_public, is_encrypted]
      )

      return NextResponse.json({
        message: 'Folder created successfully',
        file: result.rows[0]
      }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Use /upload endpoint for file uploads' },
      { status: 400 }
    )

  } catch (error) {
    console.error('POST files error:', error)
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}
