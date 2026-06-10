import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/layout'
import { WeddingRsvpBackground } from '@/components/photo-share/WeddingRsvpBackground'
import { getPublicPhotoBySlug, getPublicPhotos } from '@/lib/photo-share'

function isVideo(mime?: string) {
  return typeof mime === 'string' && mime.startsWith('video/')
}

function getMediaMime(photo: {
  mediaType?: 'image' | 'video'
  externalMime?: string | null
  image?: { mime?: string | null } | null
}) {
  if (photo.mediaType === 'video') return photo.externalMime || 'video/mp4'
  return photo.image?.mime || photo.externalMime || undefined
}

function getMediaUrl(photo: {
  mediaType?: 'image' | 'video'
  externalUrl?: string | null
  image?: { url?: string | null } | null
}) {
  if (photo.mediaType === 'video') return photo.externalUrl || ''
  return photo.image?.url || photo.externalUrl || ''
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const photo = await getPublicPhotoBySlug(slug)

  if (!photo) {
    return {}
  }

  return {
    title: photo.title,
    description: `Média partagé par ${photo.authorName}`,
    openGraph: {
      images:
        getMediaUrl(photo) && !isVideo(getMediaMime(photo))
          ? [getMediaUrl(photo)]
          : [],
    },
  }
}

export default async function PhotoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [photo, allMedia] = await Promise.all([
    getPublicPhotoBySlug(slug),
    getPublicPhotos(1, 200),
  ])

  if (!photo) {
    notFound()
  }

  const currentIndex = allMedia.data.findIndex((item) => item.slug === slug)
  const previousItem = currentIndex > 0 ? allMedia.data[currentIndex - 1] : null
  const nextItem =
    currentIndex >= 0 && currentIndex < allMedia.data.length - 1
      ? allMedia.data[currentIndex + 1]
      : null

  return (
    <Layout locale={locale}>
      <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#374151_0%,#111827_32%,#020617_100%)] px-4 py-4 md:px-8 md:py-6">
        <WeddingRsvpBackground desktopColorClassName="bg-slate-950" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            href={`/${locale}/photos`}
            className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition hover:border-white/40 hover:bg-white/15"
          >
            Retour à la galerie
          </Link>
        </div>

        <div className="relative z-10 mx-auto mt-4 max-w-7xl overflow-hidden bg-transparent shadow-none">
          <div className="relative h-[82vh] min-h-[420px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_58%)]">
            {previousItem ? (
              <Link
                href={`/${locale}/photos/${previousItem.slug}`}
                className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-3xl font-light text-white backdrop-blur transition hover:scale-105 hover:border-white/60 hover:bg-black/40 md:left-8"
                aria-label="Média précédent"
              >
                ‹
              </Link>
            ) : null}

            {nextItem ? (
              <Link
                href={`/${locale}/photos/${nextItem.slug}`}
                className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-3xl font-light text-white backdrop-blur transition hover:scale-105 hover:border-white/60 hover:bg-black/40 md:right-8"
                aria-label="Média suivant"
              >
                ›
              </Link>
            ) : null}

            {isVideo(getMediaMime(photo)) ? (
              <video
                src={getMediaUrl(photo)}
                className="h-full w-full object-contain"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <Image
                src={getMediaUrl(photo)}
                alt={photo.image?.alternativeText || photo.title}
                fill
                priority
                className="object-contain"
                style={{ ['imageOrientation' as never]: 'from-image' }}
                sizes="100vw"
              />
            )}

            <div className="absolute bottom-4 left-4 z-10 md:bottom-6 md:left-6">
              <p className="text-xs italic text-white/85">{photo.authorName}</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
