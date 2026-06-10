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

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Impossible de charger l'image."))
    image.src = url
  })
}

async function normalizeImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const targetType = 'image/jpeg'

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      })
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')

      if (!context) {
        bitmap.close()
        return file
      }

      context.drawImage(bitmap, 0, 0)
      bitmap.close()

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, targetType, 0.92)
      })

      if (!blob) return file

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
      return new File([blob], `${baseName}.jpg`, {
        type: targetType,
        lastModified: file.lastModified,
      })
    }

    const objectUrl = URL.createObjectURL(file)

    try {
      const image = await loadImageFromUrl(objectUrl)
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const context = canvas.getContext('2d')

      if (!context) return file

      context.drawImage(image, 0, 0)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, targetType, 0.92)
      })

      if (!blob) return file

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
      return new File([blob], `${baseName}.jpg`, {
        type: targetType,
        lastModified: file.lastModified,
      })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch {
    return file
  }
}

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
        body.delete('files')
        const normalizedFiles = await Promise.all(
          imageFiles.map((file) => normalizeImageFile(file))
        )
        normalizedFiles.forEach((file) => body.append('files', file))

        const imageResponse = await fetch('/api/photo-upload', {
          method: 'POST',
          body,
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
          Limites: image 20 Mo, video 200 Mo.
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
