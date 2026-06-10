import { readFile } from 'node:fs/promises'

type MultipartFile = {
  filepath: string
  originalFilename?: string | null
  mimetype?: string | null
}

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL
const BUNNY_STORAGE_ENDPOINT =
  process.env.BUNNY_STORAGE_ENDPOINT || 'https://storage.bunnycdn.com'

function getUploadedFile(files: unknown): MultipartFile | null {
  if (!files || typeof files !== 'object') return null

  const maybeFile = (files as Record<string, unknown>).file
  if (Array.isArray(maybeFile)) {
    return (maybeFile[0] as MultipartFile | undefined) ?? null
  }

  return (maybeFile as MultipartFile | null) ?? null
}

export default {
  async upload(ctx: any) {
    try {
      const file = getUploadedFile(ctx.request.files)
      const authorName = String(ctx.request.body?.authorName || '').trim()

      if (!file || !authorName) {
        ctx.status = 400
        ctx.body = { error: 'Fichier ou nom manquant.' }
        return
      }

      if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY || !BUNNY_CDN_URL) {
        ctx.status = 500
        ctx.body = { error: 'Configuration Bunny.net manquante.' }
        return
      }

      const originalFileName = file.originalFilename || 'media'
      const fileTitle = originalFileName.replace(/\.[^.]+$/, '').trim() || 'media'
      const ext = originalFileName.split('.').pop() || 'jpg'
      const mimeType = file.mimetype || 'application/octet-stream'
      const folder = mimeType.startsWith('video/') ? 'videos' : 'images'
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const fileBuffer = await readFile(file.filepath)
      const uploadUrl = `${BUNNY_STORAGE_ENDPOINT.replace(/\/$/, '')}/${BUNNY_STORAGE_ZONE}/${path}`
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          AccessKey: BUNNY_API_KEY,
          'Content-Type': mimeType,
        },
        body: fileBuffer,
      })

      if (!response.ok) {
        const upstreamBody = await response.text().catch(() => '')
        const errorMessage = `Echec upload Bunny.net (${response.status} ${response.statusText})${upstreamBody ? `: ${upstreamBody.slice(0, 300)}` : ''}`

        strapi.log.error(errorMessage, {
          uploadUrl,
          storageZone: BUNNY_STORAGE_ZONE,
        })

        ctx.status = 502
        ctx.body = { error: errorMessage }
        return
      }

      ctx.body = {
        url: `${BUNNY_CDN_URL}/${path}`,
        mime: mimeType,
        title: fileTitle,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erreur inattendue pendant l\'upload Bunny.net.'

      strapi.log.error(message)
      ctx.status = 500
      ctx.body = { error: message }
    }
  },
}