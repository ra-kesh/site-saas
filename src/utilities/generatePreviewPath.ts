import { PayloadRequest } from 'payload'

import {
  extractTenantSlug,
  generateTenantContentPath,
  type TenantReference,
} from '@/lib/utils'

type SupportedCollection = 'pages' | 'posts'

type Props = {
  collection: SupportedCollection
  req: PayloadRequest
  slug: string
  tenant?: TenantReference
}

export const generatePreviewPath = ({ collection, slug, tenant }: Props) => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)
  const decodedSlug = decodeURIComponent(encodedSlug)
  const tenantSlug = extractTenantSlug(tenant)

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
