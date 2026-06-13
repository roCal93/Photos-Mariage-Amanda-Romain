import { NextRequest, NextResponse } from 'next/server'

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL

export async function POST(request: NextRequest) {
  if (!STRAPI_URL) {
    return NextResponse.json(
      { error: 'Configuration serveur incomplète pour bunny-upload.' },
      { status: 500 }
    )
  }

  const incomingFormData = await request.formData()
  const file = incomingFormData.get('file')
  const authorName = incomingFormData.get('authorName')

  if (
    !(file instanceof File) ||
    typeof authorName !== 'string' ||
    !authorName.trim()
  ) {
    return NextResponse.json(
      { error: 'Fichier ou nom manquant.' },
      { status: 400 }
    )
  }

  const upstreamFormData = new FormData()
  upstreamFormData.append('file', file)
  upstreamFormData.append('authorName', authorName.trim())

  const response = await fetch(
    `${STRAPI_URL.replace(/\/$/, '')}/api/bunny-upload`,
    {
      method: 'POST',
      body: upstreamFormData,
      cache: 'no-store',
    }
  )

  const payload = (await response.json().catch(() => null)) as {
    url?: string
    mime?: string
    title?: string
    width?: number
    height?: number
    error?: string | { message?: string }
  } | null

  if (!response.ok) {
    return NextResponse.json(
      {
        error: payload?.error || `Échec upload Bunny.net (${response.status}).`,
      },
      { status: response.status }
    )
  }

  if (
    !payload ||
    typeof payload.url !== 'string' ||
    typeof payload.mime !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Réponse bunny-upload invalide.' },
      { status: 502 }
    )
  }

  return NextResponse.json(payload, { status: 200 })
}
