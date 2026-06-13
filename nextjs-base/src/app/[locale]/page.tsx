import { createStrapiClient } from '@/lib/strapi-client'
import { getPageSEO } from '@/lib/seo'
import { getHreflangAlternates } from '@/lib/hreflang'
import { Layout } from '@/components/layout'
import { Hero } from '@/components/sections/Hero'
import { SectionGeneric } from '@/components/sections/SectionGeneric'
import { WeddingRsvpBackground } from '@/components/photo-share/WeddingRsvpBackground'
import { PageCollectionResponse, StrapiBlock } from '@/types/strapi'
import { DynamicBlock } from '@/types/custom'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const fetchHomePageData = async (locale: string, isDraft: boolean) => {
  const apiToken = isDraft
    ? process.env.STRAPI_PREVIEW_TOKEN || process.env.STRAPI_API_TOKEN
    : process.env.STRAPI_API_TOKEN

  const client = createStrapiClient({
    apiUrl: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
    apiToken,
  })

  let res: PageCollectionResponse = await client.findMany('pages', {
    filters: { slug: { $eq: 'home' } },
    fields: [
      'title',
      'hideTitle',
      'slug',
      'seoTitle',
      'seoDescription',
      'noIndex',
      'locale',
    ],
    populate:
      'sections.blocks.image,sections.blocks.imageDesktop,sections.blocks.buttons.file,sections.blocks.items.images.image,sections.blocks.items.images.link,sections.blocks.examples,sections.blocks.privacyPolicy,seoImage,localizations',
    locale,
    publicationState: isDraft ? 'preview' : 'live',
  })

  // Fallback to 'fr' if not found
  if (!res.data || res.data.length === 0) {
    res = await client.findMany('pages', {
      filters: { slug: { $eq: 'home' } },
      fields: [
        'title',
        'hideTitle',
        'slug',
        'seoTitle',
        'seoDescription',
        'noIndex',
        'locale',
      ],
      populate:
        'sections.blocks.image,sections.blocks.imageDesktop,sections.blocks.buttons.file,sections.blocks.items.images.image,sections.blocks.items.images.link,sections.blocks.examples,sections.blocks.privacyPolicy,seoImage,localizations',
      locale: 'fr',
      publicationState: isDraft ? 'preview' : 'live',
    })
  }

  // If still no data, return fallback
  if (!res.data || res.data.length === 0) {
    return {
      data: [
        {
          id: 1,
          documentId: 'fallback-home',
          title: 'Bienvenue',
          slug: 'home',
          seoTitle: 'Accueil',
          seoDescription: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: "Page d'accueil" }],
            },
          ],
          noIndex: false,
          locale: locale,
          sections: [],
          seoImage: undefined,
        },
      ],
      meta: { pagination: { page: 1, pageSize: 1, pageCount: 1, total: 1 } },
    } as PageCollectionResponse
  }

  return res
}

// Normalize container width coming from Strapi to the allowed values
const normalizeContainerWidth = (
  width: unknown
): 'small' | 'medium' | 'large' | 'full' => {
  if (
    width === 'small' ||
    width === 'medium' ||
    width === 'large' ||
    width === 'full'
  )
    return width
  return 'medium'
}

const getHomePageData = async (locale: string) =>
  fetchHomePageData(locale, false)
// unstable_cache(
//   async (locale: string) => fetchHomePageData(locale, false),
//   ['home-page'],
//   { revalidate: 3600, tags: ['strapi-pages'] }
// )

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Fetch home data to get the first image for preload
  const res = await getHomePageData(locale)
  const page = res?.data?.[0]
  const firstBlock = page?.sections?.[0]?.blocks?.[0] as
    | { image?: { url: string } }
    | undefined
  const firstImage = firstBlock?.image

  const links: {
    rel: string
    href: string
    as?: string
    fetchpriority?: string
  }[] = []

  // Preload main image
  if (firstImage) {
    const fullUrl = firstImage.url.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${firstImage.url}`
      : firstImage.url
    links.push({
      rel: 'preload',
      href: fullUrl,
      as: 'image',
      fetchpriority: 'high',
    })
  }

  // SEO per-locale: fetch home metadata for the active locale
  const seo = await getPageSEO('home', false, locale)

  // Build hreflang alternate links for multilingual SEO
  const localizations = page?.localizations || []
  const allLocales = [
    { locale: page?.locale || locale, slug: 'home' },
    ...localizations.map((loc) => ({
      locale: loc.locale || 'fr',
      slug: 'home',
    })),
  ]
  const alternates = getHreflangAlternates('home', allLocales)

  return {
    ...seo,
    alternates,
    other: links,
  }
}

export default async function HomeLocale({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ draft?: string }>
}) {
  const { locale } = await params

  const sparams = searchParams ? await searchParams : undefined
  const isDraft = sparams?.draft === 'true'

  // Bypass cache when Draft Mode is enabled (preview mode) regardless of draft/published status
  const res = isDraft
    ? await fetchHomePageData(locale, true)
    : await getHomePageData(locale)

  const page = res?.data?.[0]
  const sections = Array.isArray(page?.sections) ? page.sections : []
  const shouldRenderMinimalHome =
    !page || page.documentId === 'fallback-home' || sections.length === 0

  if (shouldRenderMinimalHome) {
    const uploadHref = `/${locale}/upload`

    return (
      <Layout locale={locale}>
        <section className="relative min-h-screen overflow-hidden">
          <WeddingRsvpBackground />
          <div className="relative z-10 flex min-h-screen items-start justify-center px-4 pt-16 pb-10 md:items-center md:px-8 md:py-14">
            <div className="flex min-h-[calc(100vh-6.5rem)] w-full max-w-4xl flex-col items-center text-center md:min-h-[18rem] md:justify-between">
              <div>
                <p
                  className="text-3xl text-stone-600 mb-3"
                  style={{ fontFamily: 'var(--font-hurricane)' }}
                >
                  Photos mariage
                </p>
                <h1 className="font-serif font-normal text-[#74511e] mb-1 leading-tight">
                  <span className="block text-4xl tracking-widest uppercase">
                    Amanda
                  </span>
                  <span
                    className="block text-center text-5xl text-stone-600 my-1 relative -left-2"
                    style={{ fontFamily: 'var(--font-hurricane)' }}
                  >
                    et
                  </span>
                  <span className="block text-4xl tracking-widest uppercase">
                    Romain
                  </span>
                </h1>
              </div>

              <div className="flex flex-1 items-center justify-center md:flex-none">
                <div className="flex w-full max-w-xs flex-col items-center justify-center gap-4 sm:max-w-none sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/${locale}/photos`}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#74511e]/60 px-6 py-2 text-lg font-semibold text-white transition hover:bg-[#74511e] sm:w-auto"
                  >
                    Galerie
                  </Link>
                  <Link
                    href={uploadHref}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#74511e]/60 px-6 py-2 text-lg font-semibold text-white transition hover:bg-[#74511e] sm:w-auto"
                  >
                    Ajouter des photos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    )
  }

  const getText = (value: unknown) =>
    typeof value === 'string'
      ? value
      : (value as StrapiBlock[])
          ?.map(
            (block) =>
              block.children?.map((child) => child.text || '').join('') || ''
          )
          .join('\n') || ''

  return (
    <Layout locale={locale}>
      {!page.hideTitle && <Hero title={getText(page.title)} />}

      {sections.map((section, sectionIndex) => (
        <SectionGeneric
          key={section.id}
          identifier={section.identifier}
          title={section.hideTitle ? undefined : section.title}
          blocks={section.blocks as DynamicBlock[]}
          containerWidth={normalizeContainerWidth(section.containerWidth)}
          isFirstSection={sectionIndex === 0}
          spacingTop={
            section.spacingTop as
              | 'none'
              | 'small'
              | 'medium'
              | 'large'
              | undefined
          }
          spacingBottom={
            section.spacingBottom as
              | 'none'
              | 'small'
              | 'medium'
              | 'large'
              | undefined
          }
        />
      ))}
    </Layout>
  )
}
