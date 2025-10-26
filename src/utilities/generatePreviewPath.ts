import type { PayloadRequest } from 'payload'

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

const resolveTenantSlug = async ({
  req,
  tenant,
}: {
  req: PayloadRequest | undefined
  tenant?: TenantReference
}) => {
  if (!tenant) {
    return undefined
  }

  const directSlug = extractTenantSlug(tenant)
  if (directSlug) {
    return directSlug
  }

  if (typeof tenant === 'string' && req?.payload) {
    try {
      const tenantDoc = await req.payload.findByID({
        collection: 'tenants',
        depth: 0,
        id: tenant,
      })

      if (tenantDoc && typeof tenantDoc.slug === 'string') {
        return tenantDoc.slug
      }
    } catch (error) {
      req.payload.logger.warn(
        {
          err: error,
          tenant,
        },
        'Failed to resolve tenant slug for preview path',
      )
    }
  }

  return undefined
}

export const generatePreviewPath = async ({ collection, slug, tenant, req }: Props) => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)
  const decodedSlug = decodeURIComponent(encodedSlug)
  const tenantSlug = await resolveTenantSlug({ req, tenant })

  const path = generateTenantContentPath({
    collection,
    slug: decodedSlug,
    tenantSlug,
    includeTenantPrefix: true,
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
