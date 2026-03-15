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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const query = `
      SELECT up.*, u.email, u.name as user_name, u.created_at as user_created_at
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = $1
    `

    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      // Return basic user info if profile doesn't exist
      const basicUserResult = await pool.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [userId]
      )

      if (basicUserResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ 
        profile: {
          user_id: basicUserResult.rows[0].id,
          email: basicUserResult.rows[0].email,
          display_name: basicUserResult.rows[0].name,
          bio: null,
          avatar_url: null,
          website: null,
          location: null,
          company: null,
          preferences: {},
          user_name: basicUserResult.rows[0].name,
          user_created_at: basicUserResult.rows[0].created_at
        }
      })
    }

    return NextResponse.json({ profile: result.rows[0] })
  } catch (error) {
    console.error('GET profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, display_name, bio, avatar_url, website, location, company, preferences } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const query = `
      INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, website, location, company, preferences)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        website = EXCLUDED.website,
        location = EXCLUDED.location,
        company = EXCLUDED.company,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
      RETURNING *
    `

    const values = [
      userId,
      display_name || null,
      bio || null,
      avatar_url || null,
      website || null,
      location || null,
      company || null,
      preferences ? JSON.stringify(preferences) : '{}'
    ]

    const result = await pool.query(query, values)

    return NextResponse.json({ profile: result.rows[0] })
  } catch (error) {
    console.error('PUT profile error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
