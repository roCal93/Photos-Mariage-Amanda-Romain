import Link from 'next/link'
import { Layout } from '@/components/layout'
import { UploadPhotoForm } from '@/components/photo-share/UploadPhotoForm'
import {
  WeddingRsvpBackground,
  WeddingRsvpCardBackground,
} from '@/components/photo-share/WeddingRsvpBackground'
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
      <section className="relative overflow-hidden">
        <WeddingRsvpBackground />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          <h1 className="mb-8 text-4xl font-semibold tracking-tight text-stone-950 md:mb-10 md:text-6xl">
            Donne nous tes photos !
          </h1>

          <div className="relative overflow-hidden rounded-[2.25rem] border border-stone-200 bg-white/90 p-8 shadow-[0_24px_90px_-54px_rgba(15,23,42,0.45)] backdrop-blur md:p-10">
            <WeddingRsvpCardBackground />
            <div className="relative z-10">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
              >
                Retour à l&apos;accueil
              </Link>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
                Formulaire de téléchargement
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
                Envoyer un ou plusieurs médias.
              </h2>

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
                  <UploadPhotoForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
