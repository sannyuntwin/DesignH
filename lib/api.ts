// API utility functions for interacting with Next.js API routes

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface Design {
  id: string
  name: string
  description?: string
  canvas_data: any
  user_id: string
  thumbnail?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Designs API
export const designsApi = {
  // Get all designs (with optional filtering)
  async getDesigns(params?: {
    userId?: string
    page?: number
    limit?: number
  }): Promise<{ designs: Design[] } | { error: string }> {
    const searchParams = new URLSearchParams()
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const response = await fetch(
      `${API_BASE_URL}/api/designs?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Get single design
  async getDesign(id: string): Promise<{ design: Design } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Create new design
  async createDesign(design: {
    name: string
    description?: string
    canvas_data: any
    user_id: string
    thumbnail?: string
  }): Promise<{ design: Design } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(design),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Update design
  async updateDesign(
    id: string,
    updates: Partial<{
      name: string
      description: string
      canvas_data: any
      thumbnail: string
    }>
  ): Promise<{ design: Design } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Delete design
  async deleteDesign(id: string): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Templates API
export const templatesApi = {
  // Get all templates
  async getTemplates(params?: {
    category?: string
    tags?: string[]
    limit?: number
  }): Promise<{ templates: any[] } | { error: string }> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.append('category', params.category)
    if (params?.tags) searchParams.append('tags', params.tags.join(','))
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const response = await fetch(
      `${API_BASE_URL}/api/templates?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Get single template
  async getTemplate(id: string): Promise<{ template: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Create template
  async createTemplate(template: {
    name: string
    description?: string
    canvas_data: any
    thumbnail?: string
    category?: string
    tags?: string[]
    created_by: string
  }): Promise<{ template: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Update template
  async updateTemplate(
    id: string,
    updates: Partial<{
      name: string
      description: string
      canvas_data: any
      thumbnail: string
      category: string
      tags: string[]
      is_public: boolean
    }>
  ): Promise<{ template: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Delete template
  async deleteTemplate(id: string): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Collaboration API
export const collaborationApi = {
  // Share design
  async shareDesign(
    designId: string,
    userId: string,
    permission: 'view' | 'edit' | 'admin' = 'view',
    invitedBy?: string
  ): Promise<{ collaboration: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        permission,
        invited_by: invitedBy
      }),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Get collaborators
  async getCollaborators(designId: string): Promise<{ collaborators: any[] } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/share`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Remove collaborator
  async removeCollaborator(
    designId: string,
    userId: string
  ): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/collaborators/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Comments API
export const commentsApi = {
  // Get comments
  async getComments(
    designId: string,
    resolved?: boolean
  ): Promise<{ comments: any[] } | { error: string }> {
    const searchParams = new URLSearchParams()
    if (resolved !== undefined) searchParams.append('resolved', resolved.toString())

    const response = await fetch(
      `${API_BASE_URL}/api/designs/${designId}/comments?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Add comment
  async addComment(
    designId: string,
    comment: {
      user_id: string
      content: string
      x_coordinate?: number
      y_coordinate?: number
      parent_id?: string
    }
  ): Promise<{ comment: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Update comment
  async updateComment(
    id: string,
    updates: {
      content?: string
      resolved?: boolean
    }
  ): Promise<{ comment: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Delete comment
  async deleteComment(id: string): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Version History API
export const versionsApi = {
  // Get versions
  async getVersions(designId: string): Promise<{ versions: any[] } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/versions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Create version
  async createVersion(
    designId: string,
    version: {
      canvas_data: any
      created_by: string
      change_description?: string
    }
  ): Promise<{ version: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(version),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Restore version
  async restoreVersion(
    designId: string,
    versionId: string
  ): Promise<{ 
    message: string
    design: any
    restored_from: any
  } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/versions/${versionId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Export API
export const exportApi = {
  // Start export
  async startExport(
    designId: string,
    format: 'png' | 'pdf' | 'svg',
    userId: string
  ): Promise<{
    message: string
    job_id: string
    status: string
  } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/designs/${designId}/export/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Get export status
  async getExportStatus(jobId: string): Promise<{ job: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/export/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Profile API
export const profileApi = {
  // Get profile
  async getProfile(userId: string): Promise<{ profile: any } | { error: string }> {
    const response = await fetch(
      `${API_BASE_URL}/api/profile?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Update profile
  async updateProfile(
    profile: {
      userId: string
      display_name?: string
      bio?: string
      avatar_url?: string
      website?: string
      location?: string
      company?: string
      preferences?: any
    }
  ): Promise<{ profile: any } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },

  // Upload avatar
  async uploadAvatar(
    file: File,
    userId: string
  ): Promise<{
    avatar_url: string
    size: number
    type: string
    name: string
  } | { error: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)

    const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Search API
export const searchApi = {
  // Search
  async search(params: {
    q: string
    type?: 'designs' | 'templates' | 'public'
    userId?: string
    category?: string
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<{
    results: any[]
    total: number
    limit: number
    offset: number
    has_more: boolean
  } | { error: string }> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', params.q)
    if (params.type) searchParams.append('type', params.type)
    if (params.userId) searchParams.append('userId', params.userId)
    if (params.category) searchParams.append('category', params.category)
    if (params.tags) searchParams.append('tags', params.tags.join(','))
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())

    const response = await fetch(
      `${API_BASE_URL}/api/search?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return response.ok ? data : { error: data.error }
  },
}

// Auth API
export const authApi = {
  // Sign up
  async signup(data: {
    email: string
    password: string
    name?: string
  }): Promise<{
    user: any
    session: any
    message: string
  } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'signup', ...data }),
    })

    const result = await response.json()
    return response.ok ? result : { error: result.error }
  },

  // Login
  async login(data: {
    email: string
    password: string
  }): Promise<{
    user: any
    session: any
  } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'login', ...data }),
    })

    const result = await response.json()
    return response.ok ? result : { error: result.error }
  },

  // Logout
  async logout(token: string): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'logout', token }),
    })

    const result = await response.json()
    return response.ok ? result : { error: result.error }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'reset-password', email }),
    })

    const result = await response.json()
    return response.ok ? result : { error: result.error }
  },

  // Update password
  async updatePassword(
    token: string,
    password: string
  ): Promise<{ message: string } | { error: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'update-password', token, password }),
    })

    const result = await response.json()
    return response.ok ? result : { error: result.error }
  },
}
