import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' })
  }

  // Verify the token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get user's designs
        const { data: designs, error } = await supabase
          .from('designs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) {
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json(designs)

      case 'POST':
        // Create new design
        const { content } = req.body
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' })
        }

        const { data: newDesign, error: insertError } = await supabase
          .from('designs')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            content
          })
          .select()
          .single()

        if (insertError) {
          return res.status(500).json({ error: insertError.message })
        }

        return res.status(201).json(newDesign)

      case 'PUT':
        // Update design
        const { id, content: updateContent } = req.body
        
        if (!id || !updateContent) {
          return res.status(400).json({ error: 'ID and content are required' })
        }

        const { data: updatedDesign, error: updateError } = await supabase
          .from('designs')
          .update({ content: updateContent })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateError) {
          return res.status(500).json({ error: updateError.message })
        }

        return res.status(200).json(updatedDesign)

      case 'DELETE':
        // Delete design
        const { id: deleteId } = req.query
        
        if (!deleteId || typeof deleteId !== 'string') {
          return res.status(400).json({ error: 'Design ID is required' })
        }

        const { error: deleteError } = await supabase
          .from('designs')
          .delete()
          .eq('id', deleteId)
          .eq('user_id', user.id)

        if (deleteError) {
          return res.status(500).json({ error: deleteError.message })
        }

        return res.status(204).end()

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
