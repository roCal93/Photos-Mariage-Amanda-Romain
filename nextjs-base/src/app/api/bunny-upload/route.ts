import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL

export async function POST(request: NextRequest) {
  const clientIp = getClientIpFromHeaders(request.headers)
  const rateLimit = await checkRateLimit({
    key: `bunny-upload:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Reessaie dans quelques minutes.' },
      { status: 429 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const authorName = (formData.get('authorName') as string)?.trim()

  if (!file || !authorName) {
    return NextResponse.json(
      { error: 'Fichier ou nom manquant.' },
      { status: 400 }
    )
  }

  if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY || !BUNNY_CDN_URL) {
    return NextResponse.json(
      { error: 'Configuration Bunny.net manquante.' },
      { status: 500 }
    )
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const folder = file.type.startsWith('video/') ? 'videos' : 'images'
  const path = `${folder}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()

  const response = await fetch(
    `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`,
    {
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_API_KEY,
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    }
  )

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Echec upload Bunny.net.' },
      { status: 502 }
    )
  }

  const url = `${BUNNY_CDN_URL}/${path}`

  return NextResponse.json({ url, mime: file.type }, { status: 200 })
}
