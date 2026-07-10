'use server'

import { getPublicPhotos } from '@/lib/photo-share'

export async function loadMorePhotos(page: number) {
  return getPublicPhotos(page, 24)
}
