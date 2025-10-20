import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { extractTenantSlug, generateTenantContentPath } from '@/lib/utils'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? doc?.meta?.title + ' | Payload Website Template'
    : 'Payload Website Template'

  const tenantSlug =
    doc && typeof doc === 'object' && 'tenant' in doc
      ? extractTenantSlug((doc as Page | Post).tenant as unknown)
      : undefined

  const slugValue =
    typeof doc?.slug === 'string'
      ? doc.slug
      : Array.isArray(doc?.slug)
        ? doc.slug.join('/')
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
