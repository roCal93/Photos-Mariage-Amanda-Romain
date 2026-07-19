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

/**
 * Fetches all public photo slugs in gallery order for prev/next navigation.
 * Paginates in chunks of 100 (Strapi's maxLimit) so the full list is always
 * complete regardless of the total number of photos.
 */
export async function getPhotoNavSlugs() {
  const client = getPublicClient()
  const allSlugs: string[] = []
  let page = 1
  const pageSize = 100 // matches Strapi maxLimit in config/api.ts

  while (true) {
    const response = await client.findMany<PhotoRecord>('photos', {
      fields: ['slug'],
      filters: {
        visibility: { $eq: 'public' },
        moderationStatus: { $eq: 'approved' },
      },
      sort: ['takenAt:desc', 'createdAt:desc'],
      pagination: { page, pageSize },
      publicationState: 'live',
      next: { revalidate: 60 },
    })

    allSlugs.push(...response.data.map((p) => p.slug))

    const meta = response.meta.pagination
    if (!meta || page >= meta.pageCount) break
    page++
  }

  return allSlugs
}

export type PhotoListResponse = StrapiCollectionResponse<PhotoRecord>
