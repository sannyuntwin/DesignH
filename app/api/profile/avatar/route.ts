import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    // Create avatars directory
    const avatarsDir = join(process.cwd(), 'public', 'avatars')
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_avatar.${fileExt}`
    const filePath = join(avatarsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return public URL
    const avatarUrl = `/avatars/${fileName}`

    return NextResponse.json({
      avatar_url: avatarUrl,
      size: file.size,
      type: file.type,
      name: file.name,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
