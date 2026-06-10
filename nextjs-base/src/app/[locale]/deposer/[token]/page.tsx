import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Upload',
    description: 'Formulaire public pour envoyer une ou plusieurs photos.',
  }
}

export default async function SubmitPhotoPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/upload`)
}
