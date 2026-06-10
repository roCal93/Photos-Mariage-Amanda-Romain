'use client'

import { FormEvent, useState } from 'react'

type UploadPhotoFormProps = {
  requireModeration: boolean
}

type SubmitState = {
  type: 'idle' | 'success' | 'error'
  message?: string
}

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

    if (rawFiles.length > 0) {
      body.delete('files')
      const normalizedFiles = await Promise.all(
        rawFiles.map((file) => normalizeImageFile(file))
      )
      normalizedFiles.forEach((file) => body.append('files', file))
    }

    try {
      const response = await fetch('/api/photo-upload', {
        method: 'POST',
        body,
      })

      const json = (await response.json().catch(() => null)) as {
        error?: string
        message?: string
      } | null

      if (!response.ok) {
        setState({
          type: 'error',
          message:
            json?.error || 'Le depot a echoue. Reessaie dans un instant.',
        })
        return
      }

      form.reset()
      setState({
        type: 'success',
        message:
          json?.message ||
          (requireModeration
            ? 'Photos recues. Elles seront visibles apres validation.'
            : 'Photos publiees avec succes.'),
      })
    } catch {
      setState({
        type: 'error',
        message: "Erreur reseau pendant l'envoi. Reessaie dans un instant.",
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
          placeholder="Ex: Romain"
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
          ? "Les depots sont moderes. Les medias resteront prives jusqu'a validation."
          : 'Les depots valides sont publies automatiquement apres envoi.'}
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
        {submitting ? 'Envoi en cours...' : 'Envoyer les photos'}
      </button>
    </form>
  )
}
