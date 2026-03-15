import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Direct PostgreSQL connection
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
      SELECT * FROM brand_kits 
      WHERE user_id = $1
    `
        const result = await pool.query(query, [userId])

        // Return empty brand kit if none exists
        const brandKit = result.rows[0] || { colors: [], fonts: [] }

        return NextResponse.json({ brandKit })
    } catch (error) {
        console.error('GET brand-kit error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch brand kit' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { user_id, colors, fonts } = body

        if (!user_id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Check if brand kit already exists
        const checkQuery = `SELECT id FROM brand_kits WHERE user_id = $1`
        const checkResult = await pool.query(checkQuery, [user_id])

        let query;
        let values;

        if (checkResult.rows.length > 0) {
            // Update existing
            query = `
        UPDATE brand_kits 
        SET colors = COALESCE($1, colors), fonts = COALESCE($2, fonts)
        WHERE user_id = $3
        RETURNING *
      `
            values = [
                colors ? JSON.stringify(colors) : null,
                fonts ? JSON.stringify(fonts) : null,
                user_id
            ]
        } else {
            // Create new
            query = `
        INSERT INTO brand_kits (user_id, colors, fonts)
        VALUES ($1, $2, $3)
        RETURNING *
      `
            values = [
                user_id,
                colors ? JSON.stringify(colors) : '[]',
                fonts ? JSON.stringify(fonts) : '[]'
            ]
        }

        const result = await pool.query(query, values)

        return NextResponse.json({ brandKit: result.rows[0] }, { status: 200 })
    } catch (error) {
        console.error('POST brand-kit error:', error)
        return NextResponse.json(
            { error: 'Failed to update brand kit' },
            { status: 500 }
        )
    }
}
