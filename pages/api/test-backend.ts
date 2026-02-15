import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const tests = []

  // Test 1: Connection Test
  try {
    const { data, error } = await supabase
      .from('designs')
      .select('count')
      .limit(1)

    tests.push({
      name: 'Supabase Connection',
      status: error ? 'failed' : 'passed',
      details: error ? error.message : 'Connected successfully'
    })
  } catch (error) {
    tests.push({
      name: 'Supabase Connection',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Insert Design
  try {
    const testDesign = {
      id: 'test-backend-' + Date.now(),
      content: {
        version: '1.0',
        canvas: { width: 800, height: 600 },
        elements: [
          {
            id: 'test-element',
            type: 'rect',
            x: 100,
            y: 100,
            width: 50,
            height: 50,
            fill: '#ff0000'
          }
        ],
        timestamp: new Date().toISOString()
      }
    }

    const { error: insertError } = await supabase
      .from('designs')
      .insert(testDesign)

    tests.push({
      name: 'Insert Design',
      status: insertError ? 'failed' : 'passed',
      details: insertError ? insertError.message : 'Design inserted successfully',
      data: insertError ? null : testDesign
    })

    // Test 3: Retrieve Design
    if (!insertError) {
      const { data: retrievedData, error: retrieveError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', testDesign.id)
        .single()

      tests.push({
        name: 'Retrieve Design',
        status: retrieveError ? 'failed' : 'passed',
        details: retrieveError ? retrieveError.message : 'Design retrieved successfully',
        data: retrieveError ? null : retrievedData
      })

      // Test 4: Update Design
      if (!retrieveError) {
        const updatedContent = {
          ...retrievedData.content,
          elements: [
            ...retrievedData.content.elements,
            {
              id: 'test-element-2',
              type: 'circle',
              x: 200,
              y: 200,
              radius: 25,
              fill: '#00ff00'
            }
          ]
        }

        const { error: updateError } = await supabase
          .from('designs')
          .update({ content: updatedContent })
          .eq('id', testDesign.id)

        tests.push({
          name: 'Update Design',
          status: updateError ? 'failed' : 'passed',
          details: updateError ? updateError.message : 'Design updated successfully'
        })
      }

      // Test 5: Delete Design
      const { error: deleteError } = await supabase
        .from('designs')
        .delete()
        .eq('id', testDesign.id)

      tests.push({
        name: 'Delete Design',
        status: deleteError ? 'failed' : 'passed',
        details: deleteError ? deleteError.message : 'Design deleted successfully'
      })
    }
  } catch (error) {
    tests.push({
      name: 'CRUD Operations',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 6: List All Designs
  try {
    const { data, error } = await supabase
      .from('designs')
      .select('id, created_at, updated_at')
      .order('updated_at', { ascending: false })

    tests.push({
      name: 'List Designs',
      status: error ? 'failed' : 'passed',
      details: error ? error.message : `Found ${data?.length || 0} designs`,
      data: data
    })
  } catch (error) {
    tests.push({
      name: 'List Designs',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  const passedTests = tests.filter(t => t.status === 'passed').length
  const totalTests = tests.length

  res.status(200).json({
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      success: passedTests === totalTests
    },
    tests,
    supabaseConfig: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    timestamp: new Date().toISOString()
  })
}
