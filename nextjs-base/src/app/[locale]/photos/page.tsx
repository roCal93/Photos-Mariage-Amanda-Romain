import Image from 'next/image'
import Link from 'next/link'
import { Layout } from '@/components/layout'
import { getPublicPhotos } from '@/lib/photo-share'

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

function getCardSpanClass(width?: number, height?: number) {
  if (!width || !height) {
    return 'sm:col-span-1 xl:col-span-1'
  }

  return width > height
    ? 'sm:col-span-2 xl:col-span-2'
    : 'sm:col-span-1 xl:col-span-1'
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return {
    title: 'Galerie media',
    description:
      'Collection publique des photos et videos partagees sur le site.',
    alternates: {
      canonical: `/${locale}/photos`,
    },
  }
}

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const response = await getPublicPhotos()

  return (
    <Layout locale={locale}>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <Link
          href={`/${locale}`}
          className="mb-6 inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
        >
          Retour a l&apos;accueil
        </Link>
        <h1 className="mb-8 text-4xl font-semibold tracking-tight text-stone-950 md:mb-10 md:text-6xl">
          Gallerie
        </h1>

        {response.data.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-600">
            Aucun media publie pour le moment.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {response.data.map((photo) => (
              <div
                key={photo.documentId}
                className={getCardSpanClass(
                  photo.mediaType === 'video'
                    ? (photo.externalWidth ?? undefined)
                    : (photo.image?.width ?? undefined),
                  photo.mediaType === 'video'
                    ? (photo.externalHeight ?? undefined)
                    : (photo.image?.height ?? undefined)
                )}
              >
                <Link
                  href={`/fr/photos/${photo.slug}`}
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
                        <span className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
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

                <div className="px-1 pt-3">
                  <p className="text-sm italic text-stone-500">
                    {photo.authorName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
