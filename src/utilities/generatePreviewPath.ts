import { PayloadRequest, CollectionSlug } from 'payload'

import { extractTenantSlug, generateTenantContentPath } from '@/lib/utils'

type Props = {
  collection: CollectionSlug
  req: PayloadRequest
  slug: string
  tenant?: unknown
}

export const generatePreviewPath = ({ collection, slug, tenant }: Props) => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)
  const decodedSlug = decodeURIComponent(encodedSlug)
  const tenantSlug = extractTenantSlug(tenant as unknown)

  const path = generateTenantContentPath({
    collection,
    slug: decodedSlug,
    tenantSlug,
  })

  const encodedParams = new URLSearchParams({
    slug: encodedSlug,
    collection,
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}
