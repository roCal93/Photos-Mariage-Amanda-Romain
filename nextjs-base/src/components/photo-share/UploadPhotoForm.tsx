'use client'

import { FormEvent, useState } from 'react'

type UploadPhotoFormProps = {
  requireModeration: boolean
}

type SubmitState = {
  type: 'idle' | 'success' | 'error'
  message?: string
}

const MAX_IMAGE_SIZE_BYTES = 30 * 1024 * 1024
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024

type CloudinaryUploadResponse = {
  secure_url: string
  resource_type: 'image' | 'video' | 'raw'
  width?: number
  height?: number
  format?: string
  original_filename?: string
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

async function uploadVideoToCloudinary(file: File) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary non configure sur le front (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).'
    )
  }

  const cloudinaryBody = new FormData()
  cloudinaryBody.append('file', file)
  cloudinaryBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  cloudinaryBody.append('resource_type', 'video')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    {
      method: 'POST',
      body: cloudinaryBody,
    }
  )

  const json = (await response.json().catch(() => null)) as
    | CloudinaryUploadResponse
    | { error?: { message?: string } }
    | null

  if (!response.ok || !json || !('secure_url' in json)) {
    const message =
      json && 'error' in json
        ? json.error?.message || 'Echec upload Cloudinary.'
        : 'Echec upload Cloudinary.'
    throw new Error(message)
  }

  return {
    url: json.secure_url,
    mime: `video/${json.format || 'mp4'}`,
    width: json.width,
    height: json.height,
    title: json.original_filename || file.name.replace(/\.[^.]+$/, ''),
  }
}

async function uploadImageToCloudinary(file: File) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary non configure sur le front.')
  }

  const cloudinaryBody = new FormData()
  cloudinaryBody.append('file', file)
  cloudinaryBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  cloudinaryBody.append('resource_type', 'image')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: cloudinaryBody,
    }
  )

  const json = (await response.json().catch(() => null)) as
    | CloudinaryUploadResponse
    | { error?: { message?: string } }
    | null

  if (!response.ok || !json || !('secure_url' in json)) {
    const message =
      json && 'error' in json
        ? json.error?.message || 'Echec upload Cloudinary.'
        : 'Echec upload Cloudinary.'
    throw new Error(message)
  }

  return {
    url: json.secure_url,
    mime: `image/${json.format || 'jpeg'}`,
    width: json.width,
    height: json.height,
    title: json.original_filename || file.name.replace(/\.[^.]+$/, ''),
  }
}

export function UploadPhotoForm({ requireModeration }: UploadPhotoFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<SubmitState>({ type: 'idle' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setState({ type: 'idle' })

    const form = event.currentTarget
    const body = new FormData(form)
    const rawFiles = body
      .getAll('files')
      .filter((entry): entry is File => entry instanceof File)

    const videoFiles = rawFiles.filter((file) => file.type.startsWith('video/'))
    const imageFiles = rawFiles.filter(
      (file) => !file.type.startsWith('video/')
    )

    const oversizedVideo = videoFiles.find(
      (file) =>
        file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE_BYTES
    )

    if (oversizedVideo) {
      setState({
        type: 'error',
        message: 'Video trop lourde (max 200 Mo).',
      })
      setSubmitting(false)
      return
    }

    const oversizedImage = imageFiles.find(
      (file) =>
        file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE_BYTES
    )

    if (oversizedImage) {
      setState({
        type: 'error',
        message: 'Image trop lourde (max 30 Mo).',
      })
      setSubmitting(false)
      return
    }

    try {
      let uploadedCount = 0

      if (imageFiles.length > 0) {
        const uploadedImages = await Promise.all(
          imageFiles.map((file) => uploadImageToCloudinary(file))
        )

        const imageResponse = await fetch('/api/photo-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorName: (body.get('authorName') as string) || '',
            externalMedia: uploadedImages,
          }),
        })

        const imageJson = (await imageResponse.json().catch(() => null)) as {
          error?: string
        } | null

        if (!imageResponse.ok) {
          setState({
            type: 'error',
            message:
              imageJson?.error ||
              'Le depot image a echoue. Reessaie dans un instant.',
          })
          return
        }

        uploadedCount += imageFiles.length
      }

      if (videoFiles.length > 0) {
        const uploadedVideos = await Promise.all(
          videoFiles.map((file) => uploadVideoToCloudinary(file))
        )

        const videoResponse = await fetch('/api/photo-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorName: (body.get('authorName') as string) || '',
            externalMedia: uploadedVideos,
          }),
        })

        const videoJson = (await videoResponse.json().catch(() => null)) as {
          error?: string
        } | null

        if (!videoResponse.ok) {
          setState({
            type: 'error',
            message:
              videoJson?.error ||
              'Le depot video a echoue. Reessaie dans un instant.',
          })
          return
        }

        uploadedCount += videoFiles.length
      }

      form.reset()
      setState({
        type: 'success',
        message: `${uploadedCount} media(s) publie(s) avec succes.`,
      })
    } catch (error) {
      setState({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : "Erreur reseau pendant l'envoi. Reessaie dans un instant.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Ton nom
        <input
          name="authorName"
          required
          maxLength={80}
          className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-500"
          placeholder="Ex: Robert"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Deposer une ou plusieurs photos ou videos
        <input
          name="files"
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          multiple
          required
          className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-700"
        />
      </label>

      <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900">
        {requireModeration
          ? "Les dépôts sont modérés. Les médias resteront privés jusqu'à validation."
          : 'Les dépôts valides sont publiés automatiquement après envoi.'}
        <p className="mt-2 text-xs text-amber-800/90">
          Limites: image 30 Mo, video 200 Mo.
        </p>
      </div>

      {state.type !== 'idle' ? (
        <p
          className={
            state.type === 'success'
              ? 'rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
              : 'rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700'
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Envoi en cours...' : 'Envoyer'}
      </button>
    </form>
  )
}
