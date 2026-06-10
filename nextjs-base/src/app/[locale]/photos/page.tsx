import Link from 'next/link'
import { Layout } from '@/components/layout'
import { PhotoGalleryGrid } from '@/components/photo-share/PhotoGalleryGrid'
import { getPublicPhotos } from '@/lib/photo-share'

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
          Retour à l&apos;accueil
        </Link>
        <h1 className="mb-8 text-4xl font-semibold tracking-tight text-stone-950 md:mb-10 md:text-6xl">
          Galerie
        </h1>

        {response.data.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-600">
            Aucun média publié pour le moment.
          </div>
        ) : (
          <PhotoGalleryGrid locale={locale} photos={response.data} />
        )}
      </section>
    </Layout>
  )
}
