import { NextRequest, NextResponse } from 'next/server'

const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL

export async function POST(request: NextRequest) {
  const { fileName, mimeType } = await request.json()

  if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE || !BUNNY_CDN_URL) {
    return NextResponse.json({ error: 'Config manquante.' }, { status: 500 })
  }

  const ext = fileName.split('.').pop() || 'jpg'
  const folder = mimeType.startsWith('video/') ? 'videos' : 'images'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const cdnUrl = `${BUNNY_CDN_URL}/${path}`
  const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`

  return NextResponse.json({
    uploadUrl,
    cdnUrl,
    apiKey: BUNNY_API_KEY,
  })
}