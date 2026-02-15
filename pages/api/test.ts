import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('designs')
      .select('count')
      .limit(1)

    if (error) {
      return res.status(500).json({ 
        error: 'Supabase connection failed', 
        details: error.message 
      })
    }

    // Test data insertion
    const testData = {
      id: 'test-design-' + Date.now(),
      content: {
        version: '1.0',
        canvas: { width: 800, height: 600 },
        elements: [],
        timestamp: new Date().toISOString()
      }
    }

    const { error: insertError } = await supabase
      .from('designs')
      .insert(testData)

    if (insertError) {
      return res.status(500).json({ 
        error: 'Data insertion failed', 
        details: insertError.message 
      })
    }

    // Clean up test data
    await supabase
      .from('designs')
      .delete()
      .eq('id', testData.id)

    res.status(200).json({ 
      success: true,
      message: 'Backend connection test successful',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
