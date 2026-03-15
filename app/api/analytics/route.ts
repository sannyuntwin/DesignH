import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

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
    const timeRange = searchParams.get('time_range') || '30d'
    const teamId = searchParams.get('team_id')

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Overview metrics
    const overviewQuery = teamId
      ? `
        SELECT 
          COUNT(DISTINCT d.id) as total_designs,
          COALESCE(SUM(dv.views), 0) as total_views,
          COALESCE(SUM(dv.downloads), 0) as total_downloads,
          COALESCE(SUM(dv.shares), 0) as total_shares,
          COUNT(DISTINCT CASE WHEN d.updated_at >= $2 THEN d.user_id END) as active_users,
          COALESCE(SUM(f.size), 0) as storage_used,
          10737418240 as storage_limit
        FROM designs d
        LEFT JOIN design_views dv ON d.id = dv.design_id
        LEFT JOIN export_jobs ej ON d.id = ej.design_id AND ej.status = 'completed'
        LEFT JOIN files f ON f.user_id = d.user_id AND f.parent_id IS NULL
        WHERE d.team_id = $1 AND d.created_at >= $2
      `
      : `
        SELECT 
          COUNT(DISTINCT d.id) as total_designs,
          COALESCE(SUM(dv.views), 0) as total_views,
          COALESCE(SUM(dv.downloads), 0) as total_downloads,
          COALESCE(SUM(dv.shares), 0) as total_shares,
          COUNT(DISTINCT CASE WHEN d.updated_at >= $2 THEN d.user_id END) as active_users,
          COALESCE(SUM(f.size), 0) as storage_used,
          10737418240 as storage_limit
        FROM designs d
        LEFT JOIN design_views dv ON d.id = dv.design_id
        LEFT JOIN export_jobs ej ON d.id = ej.design_id AND ej.status = 'completed'
        LEFT JOIN files f ON f.user_id = d.user_id AND f.parent_id IS NULL
        WHERE d.user_id = $1 AND d.created_at >= $2
      `

    const overviewResult = await pool.query(overviewQuery, [teamId || decoded.userId, startDate])

    // Trends data
    const trendsQuery = teamId
      ? `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as designs_created
        FROM designs
        WHERE team_id = $1 AND created_at >= $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `
      : `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as designs_created
        FROM designs
        WHERE user_id = $1 AND created_at >= $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `

    const trendsResult = await pool.query(trendsQuery, [teamId || decoded.userId, startDate])

    const topDesignsQuery = teamId
      ? `
        SELECT 
          d.id,
          d.name,
          d.thumbnail,
          d.created_at,
          COALESCE(dv.views, 0) as views,
          COALESCE(dv.downloads, 0) as downloads,
          COALESCE(dv.shares, 0) as shares
        FROM designs d
        LEFT JOIN (
          SELECT 
            design_id,
            COUNT(*) as views,
            0 as downloads,
            0 as shares
          FROM design_views
          WHERE created_at >= $2
          GROUP BY design_id
        ) dv ON d.id = dv.design_id
        LEFT JOIN (
          SELECT 
            design_id,
            0 as views,
            COUNT(*) as downloads,
            0 as shares
          FROM export_jobs
          WHERE status = 'completed' AND created_at >= $2
          GROUP BY design_id
        ) ej ON d.id = ej.design_id
        WHERE d.team_id = $1
        GROUP BY d.id, d.name, d.thumbnail, d.created_at, dv.views, ej.downloads
        ORDER BY (dv.views + ej.downloads) DESC
        LIMIT 10
      `
      : `
        SELECT 
          d.id,
          d.name,
          d.thumbnail,
          d.created_at,
          COALESCE(dv.views, 0) as views,
          COALESCE(dv.downloads, 0) as downloads,
          COALESCE(dv.shares, 0) as shares
        FROM designs d
        LEFT JOIN (
          SELECT 
            design_id,
            COUNT(*) as views,
            0 as downloads,
            0 as shares
          FROM design_views
          WHERE created_at >= $2
          GROUP BY design_id
        ) dv ON d.id = dv.design_id
        LEFT JOIN (
          SELECT 
            design_id,
            0 as views,
            COUNT(*) as downloads,
            0 as shares
          FROM export_jobs
          WHERE status = 'completed' AND created_at >= $2
          GROUP BY design_id
        ) ej ON d.id = ej.design_id
        WHERE d.user_id = $1
        GROUP BY d.id, d.name, d.thumbnail, d.created_at, dv.views, ej.downloads
        ORDER BY (dv.views + ej.downloads) DESC
        LIMIT 10
      `

    const topDesignsResult = await pool.query(topDesignsQuery, [teamId || decoded.userId, startDate])

    // User activity
    const userActivityQuery = teamId
      ? `
        SELECT 
          u.id as user_id,
          u.name,
          u.email,
          COUNT(DISTINCT d.id) as designs_created,
          MAX(d.updated_at) as last_active,
          (COUNT(DISTINCT d.id) * 0.1 + 
           COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(d.updated_at))) / 7 * 0.05) as activity_score
        FROM users u
        LEFT JOIN designs d ON u.id = d.user_id AND d.team_id = $1
        WHERE u.id IN (
          SELECT DISTINCT user_id FROM team_members WHERE team_id = $1
        )
        GROUP BY u.id, u.name, u.email
        ORDER BY activity_score DESC
        LIMIT 20
      `
      : `
        SELECT 
          u.id as user_id,
          u.name,
          u.email,
          COUNT(DISTINCT d.id) as designs_created,
          MAX(d.updated_at) as last_active,
          (COUNT(DISTINCT d.id) * 0.1 + 
           COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(d.updated_at))) / 7 * 0.05) as activity_score
        FROM users u
        LEFT JOIN designs d ON u.id = d.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email
        ORDER BY activity_score DESC
        LIMIT 20
      `

    const userActivityResult = await pool.query(userActivityQuery, [teamId || decoded.userId])

    // Performance metrics (mock data for now)
    const performanceMetrics = {
      avg_load_time: 850,
      avg_render_time: 120,
      error_rate: 0.2,
      uptime: 99.9
    }

    return NextResponse.json({
      overview: overviewResult.rows[0] || {
        total_designs: 0,
        total_views: 0,
        total_downloads: 0,
        total_shares: 0,
        active_users: 0,
        storage_used: 0,
        storage_limit: 10737418240
      },
      trends: {
        designs_created: trendsResult.rows,
        views: trendsResult.rows,
        downloads: trendsResult.rows,
        shares: trendsResult.rows
      },
      top_designs: topDesignsResult.rows,
      user_activity: userActivityResult.rows,
      performance_metrics: performanceMetrics
    })

  } catch (error) {
    console.error('GET analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
