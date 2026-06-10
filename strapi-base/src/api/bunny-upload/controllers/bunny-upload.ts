import { readFile } from 'node:fs/promises'

type MultipartFile = {
  filepath: string
  originalFilename?: string | null
  mimetype?: string | null
}

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL

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
    const file = getUploadedFile(ctx.request.files)
    const authorName = String(ctx.request.body?.authorName || '').trim()

    if (!file || !authorName) {
      return ctx.badRequest('Fichier ou nom manquant.')
    }

    if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY || !BUNNY_CDN_URL) {
      return ctx.internalServerError('Configuration Bunny.net manquante.')
    }

    const originalFileName = file.originalFilename || 'media'
    const fileTitle = originalFileName.replace(/\.[^.]+$/, '').trim() || 'media'
    const ext = originalFileName.split('.').pop() || 'jpg'
    const mimeType = file.mimetype || 'application/octet-stream'
    const folder = mimeType.startsWith('video/') ? 'videos' : 'images'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const fileBuffer = await readFile(file.filepath)
    const response = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: BUNNY_API_KEY,
          'Content-Type': mimeType,
        },
        body: fileBuffer,
      }
    )

    if (!response.ok) {
      strapi.log.error('Bunny upload failed', {
        status: response.status,
        statusText: response.statusText,
      })
      return ctx.internalServerError('Echec upload Bunny.net.')
    }

    ctx.body = {
      url: `${BUNNY_CDN_URL}/${path}`,
      mime: mimeType,
      title: fileTitle,
    }
  },
}