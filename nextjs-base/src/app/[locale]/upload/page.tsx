import Link from 'next/link'
import { Layout } from '@/components/layout'
import { UploadPhotoForm } from '@/components/photo-share/UploadPhotoForm'
import { hasPhotoServiceTokenConfigured } from '@/lib/photo-share'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Upload',
    description: 'Formulaire public pour envoyer une ou plusieurs photos.',
  }
}

export default async function UploadPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const hasServiceToken = hasPhotoServiceTokenConfigured()

  return (
    <Layout locale={locale}>
      <section className="bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_36%),linear-gradient(180deg,#fafaf9_0%,#f5f5f4_100%)]">
        <div className="mx-auto max-w-3xl px-6 py-14 md:px-10 md:py-20">
          <div className="rounded-[2.25rem] border border-stone-200 bg-white/90 p-8 shadow-[0_24px_90px_-54px_rgba(15,23,42,0.45)] backdrop-blur md:p-10">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
            >
              Retour à l&apos;accueil
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              Formulaire de téléchargement
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
              Envoyer une ou plusieurs médias.
            </h1>

            {!hasServiceToken ? (
              <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
                <p className="text-lg font-semibold">Service non configuré</p>
                <p className="mt-2 text-sm leading-6">
                  Le formulaire ne peut pas fonctionner tant que
                  STRAPI_WRITE_API_TOKEN ou STRAPI_API_TOKEN reste en valeur
                  d&apos;exemple dans le fichier d&apos;environnement de
                  Next.js.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <UploadPhotoForm requireModeration={false} />
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}
