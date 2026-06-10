import { createHash } from 'node:crypto'
import { cleanImageUrl } from '@/lib/strapi'
import { createStrapiClient } from '@/lib/strapi-client'
import type {
  StrapiCollectionResponse,
  StrapiEntity,
  StrapiMedia,
} from '@/types/strapi'

function normalizeOptionalToken(token: string | undefined) {
  if (!token) return undefined

  const normalized = token.trim()

  if (
    normalized.length === 0 ||
    normalized === 'votre-token-de-dev' ||
    normalized === 'votre-token-strapi-ecriture' ||
    normalized === 'votre-preview-token' ||
    normalized === 'changeme'
  ) {
    return undefined
  }

  return normalized
}

export type PhotoRecord = {
  title: string
  slug: string
  mediaType?: 'image' | 'video'
  externalUrl?: string | null
  externalMime?: string | null
  externalWidth?: number | null
  externalHeight?: number | null
  caption?: string | null
  authorName: string
  takenAt?: string | null
  tags?: string[] | null
  visibility: 'public' | 'hidden'
  moderationStatus: 'pending' | 'approved' | 'rejected'
  image?: StrapiMedia | null
  createdAt?: string
}

export type UploadTokenRecord = {
  label: string
  tokenHash?: string
  isActive: boolean
  expiresAt?: string | null
  maxUploads?: number | null
  uploadCount?: number | null
  requireModeration: boolean
}

function getPublicClient() {
  return createStrapiClient({
    apiUrl: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
    apiToken: normalizeOptionalToken(process.env.STRAPI_API_TOKEN),
  })
}

export function hasPhotoServiceTokenConfigured() {
  return Boolean(
    normalizeOptionalToken(process.env.STRAPI_WRITE_API_TOKEN) ||
    normalizeOptionalToken(process.env.STRAPI_API_TOKEN)
  )
}

function getServiceClient() {
  const apiToken =
    normalizeOptionalToken(process.env.STRAPI_WRITE_API_TOKEN) ||
    normalizeOptionalToken(process.env.STRAPI_API_TOKEN)

  if (!apiToken) {
    throw new Error(
      'STRAPI_WRITE_API_TOKEN ou STRAPI_API_TOKEN doit etre configure pour le flux photo.'
    )
  }

  return createStrapiClient({
    apiUrl: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
    apiToken,
  })
}

function normalizePhoto<T extends PhotoRecord & StrapiEntity>(photo: T): T {
  return {
    ...photo,
    externalUrl:
      cleanImageUrl(photo.externalUrl || undefined) || photo.externalUrl,
    image: photo.image
      ? {
          ...photo.image,
          url: cleanImageUrl(photo.image.url) || photo.image.url,
        }
      : photo.image,
  }
}

export async function getPublicPhotos(page = 1, pageSize = 24) {
  const client = getPublicClient()
  const response = await client.findMany<PhotoRecord>('photos', {
    fields: [
      'title',
      'slug',
      'mediaType',
      'externalUrl',
      'externalMime',
      'externalWidth',
      'externalHeight',
      'caption',
      'authorName',
      'takenAt',
      'tags',
      'visibility',
      'moderationStatus',
      'createdAt',
    ],
    populate: {
      image: {
        fields: [
          'url',
          'alternativeText',
          'width',
          'height',
          'formats',
          'mime',
          'ext',
        ],
      },
    },
    filters: {
      visibility: { $eq: 'public' },
      moderationStatus: { $eq: 'approved' },
    },
    sort: ['takenAt:desc', 'createdAt:desc'],
    pagination: { page, pageSize },
    publicationState: 'live',
    next: { revalidate: 60 },
  })

  return {
    ...response,
    data: response.data.map(normalizePhoto),
  }
}

export async function getPublicPhotoBySlug(slug: string) {
  const client = getPublicClient()
  const response = await client.findMany<PhotoRecord>('photos', {
    fields: [
      'title',
      'slug',
      'mediaType',
      'externalUrl',
      'externalMime',
      'externalWidth',
      'externalHeight',
      'caption',
      'authorName',
      'takenAt',
      'tags',
      'visibility',
      'moderationStatus',
      'createdAt',
    ],
    populate: {
      image: {
        fields: [
          'url',
          'alternativeText',
          'width',
          'height',
          'formats',
          'mime',
          'ext',
        ],
      },
    },
    filters: {
      slug: { $eq: slug },
      visibility: { $eq: 'public' },
      moderationStatus: { $eq: 'approved' },
    },
    pagination: { pageSize: 1 },
    publicationState: 'live',
    next: { revalidate: 60 },
  })

  const photo = response.data[0]
  return photo ? normalizePhoto(photo) : null
}

export function hashUploadToken(token: string) {
  return createHash('sha256').update(token.trim()).digest('hex')
}

export function isUploadTokenOpen(
  token: (UploadTokenRecord & StrapiEntity) | null
) {
  if (!token || !token.isActive) return false
  if (token.expiresAt && new Date(token.expiresAt).getTime() < Date.now()) {
    return false
  }

  return true
}

export async function getUploadTokenRecord(token: string) {
  const service = getServiceClient()
  const response = await service.findMany<UploadTokenRecord>('upload-tokens', {
    fields: [
      'label',
      'isActive',
      'expiresAt',
      'maxUploads',
      'uploadCount',
      'requireModeration',
      'tokenHash',
    ],
    filters: {
      tokenHash: { $eq: hashUploadToken(token) },
    },
    pagination: { pageSize: 1 },
    next: { revalidate: 0 },
  })

  return response.data[0] ?? null
}

export async function getUploadTokenSummary(token: string) {
  const record = await getUploadTokenRecord(token)
  if (!record) return null

  return {
    id: record.id,
    documentId: record.documentId,
    label: record.label,
    isActive: record.isActive,
    expiresAt: record.expiresAt,
    maxUploads: record.maxUploads ?? null,
    uploadCount: record.uploadCount ?? 0,
    requireModeration: record.requireModeration,
    isOpen: isUploadTokenOpen(record),
  }
}

export type PhotoListResponse = StrapiCollectionResponse<PhotoRecord>
