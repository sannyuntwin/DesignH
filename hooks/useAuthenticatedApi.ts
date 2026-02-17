import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

export function useAuthenticatedApi() {
  const { session } = useAuth()

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  const getDesigns = () => authenticatedFetch('/api/designs')
  
  const createDesign = (content: any) => 
    authenticatedFetch('/api/designs', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })

  const updateDesign = (id: string, content: any) => 
    authenticatedFetch('/api/designs', {
      method: 'PUT',
      body: JSON.stringify({ id, content }),
    })

  const deleteDesign = (id: string) => 
    authenticatedFetch(`/api/designs?id=${id}`, {
      method: 'DELETE',
    })

  return {
    getDesigns,
    createDesign,
    updateDesign,
    deleteDesign,
    isAuthenticated: !!session,
  }
}
