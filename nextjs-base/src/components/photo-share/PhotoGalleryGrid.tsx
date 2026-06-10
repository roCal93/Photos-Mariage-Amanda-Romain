'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { WeddingRsvpCardBackground } from '@/components/photo-share/WeddingRsvpBackground'

type GalleryPhoto = {
  documentId?: string
  title: string
  slug: string
  authorName: string
  mediaType?: 'image' | 'video'
  externalUrl?: string | null
  externalMime?: string | null
  externalWidth?: number | null
  externalHeight?: number | null
  image?: {
    url?: string | null
    alternativeText?: string | null
    width?: number | null
    height?: number | null
    mime?: string | null
    ext?: string | null
  } | null
}

type PhotoGalleryGridProps = {
  locale: string
  photos: GalleryPhoto[]
}

function isVideo(mime?: string) {
  return typeof mime === 'string' && mime.startsWith('video/')
}

function getMediaMime(photo: GalleryPhoto) {
  if (photo.mediaType === 'video') return photo.externalMime || 'video/mp4'
  return photo.image?.mime || photo.externalMime || undefined
}

function getMediaUrl(photo: GalleryPhoto) {
  if (photo.mediaType === 'video') return photo.externalUrl || ''
  return photo.image?.url || photo.externalUrl || ''
}

function getCardSpanClass(width?: number, height?: number) {
  if (!width || !height) {
    return 'sm:col-span-1 xl:col-span-1'
  }

  return width > height
    ? 'sm:col-span-2 xl:col-span-2'
    : 'sm:col-span-1 xl:col-span-1'
}

function getSelectionKey(photo: GalleryPhoto) {
  return photo.documentId || photo.slug
}

function getDownloadName(photo: GalleryPhoto, index: number) {
  const fallbackBaseName =
    photo.title
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-') || `media-${index + 1}`

  const mediaUrl = getMediaUrl(photo)
  const pathname = (() => {
    try {
      return new URL(mediaUrl).pathname
    } catch {
      return ''
    }
  })()

  const extFromUrl = pathname.split('.').pop()
  const extFromImage = photo.image?.ext?.replace(/^\./, '')
  const extFromMime = getMediaMime(photo)?.split('/').pop()
  const extension = extFromUrl || extFromImage || extFromMime || 'bin'

  return `${fallbackBaseName}.${extension}`
}

async function triggerDownload(url: string, fileName: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`DOWNLOAD_${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(blobUrl)
    return
  } catch {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.target = '_blank'
    anchor.rel = 'noreferrer'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }
}

export function PhotoGalleryGrid({ locale, photos }: PhotoGalleryGridProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [downloading, setDownloading] = useState(false)

  const selectedPhotos = useMemo(
    () =>
      photos.filter((photo) => selectedKeys.includes(getSelectionKey(photo))),
    [photos, selectedKeys]
  )

  function toggleSelection(key: string) {
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    )
  }

  function selectAll() {
    setSelectedKeys(photos.map(getSelectionKey))
  }

  function clearSelection() {
    setSelectedKeys([])
  }

  async function downloadPhotos(photosToDownload: GalleryPhoto[]) {
    if (photosToDownload.length === 0) return

    setDownloading(true)
    try {
      for (const [index, photo] of photosToDownload.entries()) {
        const mediaUrl = getMediaUrl(photo)
        if (!mediaUrl) continue
        await triggerDownload(mediaUrl, getDownloadName(photo, index))
      }
    } finally {
      setDownloading(false)
    }
  }

  async function downloadSelection() {
    await downloadPhotos(selectedPhotos)
  }

  async function downloadAll() {
    await downloadPhotos(photos)
  }

  return (
    <>
      <div className="relative mb-6 flex flex-wrap items-center gap-3 overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.25)]">
        <WeddingRsvpCardBackground />
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-stone-700">
            {selectedKeys.length} fichier(s) selectionne(s) sur {photos.length}
          </span>
          <button
            type="button"
            onClick={selectAll}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            Tout selectionner
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedKeys.length === 0}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={downloadAll}
            disabled={photos.length === 0 || downloading}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading
              ? 'Telechargement...'
              : `Telecharger tout (${photos.length})`}
          </button>
          <button
            type="button"
            onClick={downloadSelection}
            disabled={selectedKeys.length === 0 || downloading}
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading
              ? 'Telechargement...'
              : `Telecharger la selection${selectedKeys.length > 0 ? ` (${selectedKeys.length})` : ''}`}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {photos.map((photo) => {
          const key = getSelectionKey(photo)
          const selected = selectedKeys.includes(key)

          return (
            <div
              key={key}
              className={getCardSpanClass(
                photo.mediaType === 'video'
                  ? (photo.externalWidth ?? undefined)
                  : (photo.image?.width ?? undefined),
                photo.mediaType === 'video'
                  ? (photo.externalHeight ?? undefined)
                  : (photo.image?.height ?? undefined)
              )}
            >
              <div className="relative">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSelection(key)}
                  className={`absolute left-4 top-4 z-20 inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold backdrop-blur transition ${
                    selected
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-white/60 bg-white/85 text-stone-800 hover:bg-white'
                  }`}
                >
                  {selected ? '✓' : '+'}
                </button>

                <Link
                  href={`/${locale}/photos/${photo.slug}`}
                  className="group block overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:shadow-[0_32px_90px_-44px_rgba(15,23,42,0.5)]"
                >
                  <div className="relative h-80 bg-stone-100 md:h-[26rem] xl:h-[30rem]">
                    {isVideo(getMediaMime(photo)) ? (
                      <>
                        <video
                          src={getMediaUrl(photo)}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/40 text-2xl text-white backdrop-blur-sm">
                            ▶
                          </span>
                        </span>
                      </>
                    ) : (
                      <Image
                        src={getMediaUrl(photo)}
                        alt={photo.image?.alternativeText || photo.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        style={{ ['imageOrientation' as never]: 'from-image' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    )}
                  </div>
                </Link>
              </div>

              <div className="px-1 pt-3">
                <p className="text-sm italic text-stone-500">
                  {photo.authorName}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
