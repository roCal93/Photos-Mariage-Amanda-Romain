'use client'

import { FormEvent, useState } from 'react'

type UploadPhotoFormProps = {
  requireModeration: boolean
}

type SubmitState = {
  type: 'idle' | 'success' | 'error'
  message?: string
}

type UploadPhase = 'idle' | 'uploading' | 'publishing'

const STRAPI_UPLOAD_URL = `${process.env.NEXT_PUBLIC_STRAPI_URL || ''}/api/bunny-upload`

type BunnyUploadResponse = {
  url?: string
  mime?: string
  title?: string
  width?: number
  height?: number
  error?: string | { message?: string }
}

function getErrorMessage(error: BunnyUploadResponse['error']) {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && typeof error.message === 'string') {
    return error.message
  }

  return null
}

async function uploadMediaToBunny(
  file: File,
  authorName: string,
  onProgress?: (loaded: number, total: number) => void
) {
  if (!process.env.NEXT_PUBLIC_STRAPI_URL) {
    throw new Error(
      'NEXT_PUBLIC_STRAPI_URL manquant pour envoyer vers le backend.'
    )
  }

  const bunnyBody = new FormData()
  bunnyBody.append('file', file)
  bunnyBody.append('authorName', authorName)

  const response = await new Promise<{
    status: number
    ok: boolean
    json: BunnyUploadResponse | null
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', STRAPI_UPLOAD_URL)
    xhr.responseType = 'json'

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(event.loaded, event.total)
    }

    xhr.onerror = () => {
      reject(new Error("Erreur reseau pendant l'upload Bunny.net."))
    }

    xhr.onload = () => {
      const responseJson =
        xhr.response && typeof xhr.response === 'object'
          ? (xhr.response as BunnyUploadResponse)
          : null

      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        json: responseJson,
      })
    }

    xhr.send(bunnyBody)
  })

  onProgress?.(file.size, file.size)

  const json = response.json

  if (
    !response.ok ||
    !json ||
    typeof json.url !== 'string' ||
    typeof json.mime !== 'string'
  ) {
    const message = getErrorMessage(json?.error) || 'Echec upload Bunny.net.'
    throw new Error(message)
  }

  return {
    url: json.url,
    mime: json.mime,
    title: json.title || file.name.replace(/\.[^.]+$/, ''),
    width: json.width,
    height: json.height,
  }
}

export function UploadPhotoForm({ requireModeration }: UploadPhotoFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<SubmitState>({ type: 'idle' })
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0)
  const [totalFilesCount, setTotalFilesCount] = useState(0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setState({ type: 'idle' })
    setUploadPhase('uploading')
    setUploadProgress(0)
    setUploadedFilesCount(0)

    const form = event.currentTarget
    const body = new FormData(form)
    const authorName = (body.get('authorName') as string) || ''
    const rawFiles = body
      .getAll('files')
      .filter((entry): entry is File => entry instanceof File)

    const videoFiles = rawFiles.filter((file) => file.type.startsWith('video/'))
    const imageFiles = rawFiles.filter(
      (file) => !file.type.startsWith('video/')
    )
    setTotalFilesCount(rawFiles.length)
    const totalBytes = rawFiles.reduce((sum, file) => sum + file.size, 0)
    let uploadedBytes = 0

    async function uploadFiles(files: File[]) {
      const uploadedMedia = []

      for (const file of files) {
        let lastLoaded = 0
        const uploadedMediaItem = await uploadMediaToBunny(
          file,
          authorName,
          (loaded) => {
            const delta = Math.max(0, loaded - lastLoaded)
            lastLoaded = loaded
            uploadedBytes += delta
            if (totalBytes > 0) {
              setUploadProgress(
                Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
              )
            }
          }
        )
        uploadedMedia.push(uploadedMediaItem)
        setUploadedFilesCount((current) => current + 1)
      }

      return uploadedMedia
    }

    try {
      let uploadedCount = 0

      if (imageFiles.length > 0) {
        const uploadedImages = await uploadFiles(imageFiles)
        setUploadPhase('publishing')

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
        if (imageFiles.length === 0) {
          setUploadPhase('uploading')
        }
        const uploadedVideos = await uploadFiles(videoFiles)
        setUploadPhase('publishing')

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
      setUploadProgress(100)
      setUploadPhase('idle')
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
      setUploadPhase('idle')
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
      </div>

      {submitting ? (
        <div className="space-y-2 rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between text-sm text-stone-700">
            <span>
              {uploadPhase === 'publishing'
                ? 'Publication en cours...'
                : 'Envoi des fichiers...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <p className="text-xs text-stone-500">
            {uploadPhase === 'publishing'
              ? `${uploadedFilesCount} fichier(s) sur ${totalFilesCount} envoyes, publication en cours`
              : `${uploadedFilesCount} fichier(s) sur ${totalFilesCount} envoyes`}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-stone-900 transition-[width] duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

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
