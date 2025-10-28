import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'
import type { TenantReference } from '@/lib/utils'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { extractTenantSlug, generateTenantContentPath } from '@/lib/utils'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Sites of Puri'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    type MediaWithSizes = Media & {
      sizes?: {
        og?: {
          url?: string | null
        }
      }
    }

    const mediaWithSizes = image as MediaWithSizes
    const ogUrl = mediaWithSizes.sizes?.og?.url ?? undefined

    url = ogUrl ? serverUrl + ogUrl : serverUrl + mediaWithSizes.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title ? `${doc.meta.title} | ${APP_NAME}` : APP_NAME

  const tenantSlug =
    doc && typeof doc === 'object' && 'tenant' in doc
      ? extractTenantSlug(
          (doc as Page | Post).tenant as TenantReference
        )
      : undefined

  const rawSlug = doc?.slug as unknown

  const slugValue =
    typeof rawSlug === 'string'
      ? rawSlug
      : Array.isArray(rawSlug)
        ? rawSlug.join('/')
        : undefined

  const collection: 'pages' | 'posts' =
    doc && typeof doc === 'object' && 'layout' in doc ? 'pages' : 'posts'

  const path = generateTenantContentPath({
    collection,
    slug: slugValue,
    tenantSlug,
  })

  const serverURL = getServerSideURL()

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: `${serverURL}${path}`,
    }),
    title,
  }
}
