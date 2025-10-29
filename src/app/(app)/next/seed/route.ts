import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'

import config from '@payload-config'
import { seedSite } from '@/endpoints/seed'
import type { Site, Tenant, User } from '@/payload-types'
import { generateSiteContentPath } from '@/lib/utils'

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

type SeedRequestBody = {
  siteSlug?: string
  tenantSlug?: string
  business?: {
    name?: string
    description?: string
    audience?: string
    primaryGoal?: string
  }
}

const resolveTenantIdFromUser = (user: User) => {
  if (!Array.isArray(user.tenants) || user.tenants.length === 0) {
    return undefined
  }

  const firstTenant = user.tenants[0]
  if (!firstTenant) return undefined

  return typeof firstTenant.tenant === 'string' ? firstTenant.tenant : firstTenant.tenant?.id
}

const resolveSiteIdFromUser = (user: User) => {
  if (!Array.isArray((user as User & { sites?: { site?: unknown }[] }).sites)) {
    return undefined
  }

  const firstSite = (user as User & { sites?: { site?: unknown }[] }).sites?.[0]
  if (!firstSite) return undefined

  const relation = firstSite.site
  if (!relation) return undefined

  if (typeof relation === 'string') return relation

  if (typeof relation === 'object' && 'id' in relation) {
    return relation.id as string | undefined
  }

  return undefined
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  let siteSlugFromBody: string | undefined
  let businessDetails: SeedRequestBody['business']

  try {
    const body = (await request.json()) as SeedRequestBody
    if (body && typeof body === 'object') {
      siteSlugFromBody =
        typeof body.siteSlug === 'string'
          ? body.siteSlug.trim()
          : typeof body.tenantSlug === 'string'
            ? body.tenantSlug.trim()
            : undefined
      businessDetails = body.business
    }
  } catch {
    // Body is optional — ignore JSON parse errors
  }

  let siteDoc: Site | null = null
  let tenantDoc: Tenant | null = null

  const resolveTenantDoc = async (tenantId: string | undefined) => {
    if (!tenantId) return null

    try {
      const tenant = await payload.findByID({
        collection: 'tenants',
        id: tenantId,
      })

      return tenant as Tenant
    } catch (error) {
      payload.logger.error({
        err: error,
        message: `Unable to resolve tenant with id "${tenantId}" for seeding`,
      })
      return null
    }
  }

  if (siteSlugFromBody) {
    const sites = await payload.find({
      collection: 'sites',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: siteSlugFromBody,
        },
      },
    })
    siteDoc = (sites.docs[0] as Site | undefined) ?? null
    if (siteDoc?.tenant) {
      tenantDoc = await resolveTenantDoc(
        typeof siteDoc.tenant === 'string' ? siteDoc.tenant : siteDoc.tenant?.id,
      )
    }
  } else {
    const siteId = resolveSiteIdFromUser(user as User)
    if (siteId) {
      try {
        const site = await payload.findByID({
          collection: 'sites',
          id: siteId,
          depth: 1,
        })
        siteDoc = site as Site
        if (siteDoc?.tenant) {
          tenantDoc = await resolveTenantDoc(
            typeof siteDoc.tenant === 'string' ? siteDoc.tenant : siteDoc.tenant?.id,
          )
        }
      } catch (error) {
        payload.logger.error({
          err: error,
          message: `Unable to resolve site with id "${siteId}" for seeding`,
        })
      }
    }

    if (!siteDoc) {
      const tenantId = resolveTenantIdFromUser(user as User)
      if (tenantId) {
        tenantDoc = await resolveTenantDoc(tenantId)
        if (tenantDoc) {
          const sites = await payload.find({
            collection: 'sites',
            limit: 1,
            pagination: false,
            where: {
              tenant: {
                equals: tenantDoc.id,
              },
            },
          })
          siteDoc = (sites.docs[0] as Site | undefined) ?? null
        }
      }
    }
  }

  if (!siteDoc) {
    return new Response('Site not found for seeding.', { status: 400 })
  }

  try {
    await seedSite({
      payload,
      site: {
        id: siteDoc.id,
        slug: siteDoc.slug,
        name: siteDoc.name,
      },
      tenant: tenantDoc
        ? {
            id: tenantDoc.id,
            slug: tenantDoc.slug,
            name: tenantDoc.name,
          }
        : null,
      ownerEmail: (user as User).email,
      businessDetails: businessDetails
        ? {
            name: businessDetails.name?.trim(),
            description: businessDetails.description?.trim(),
            audience: businessDetails.audience?.trim(),
            primaryGoal: businessDetails.primaryGoal?.trim(),
          }
        : undefined,
    })

    const siteSlug = siteDoc.slug
    const siteTags = [
      `site:${siteSlug}`,
      `site:${siteSlug}:page:home`,
      `site:${siteSlug}:page:contact`,
      `site:${siteSlug}:page:posts`,
    ]

    const globalTags = ['sites', 'pages', 'pages-sitemap', 'posts', 'posts-sitemap']

    for (const tag of [...siteTags, ...globalTags]) {
      revalidateTag(tag, 'max')
    }

    const siteBasePath = generateSiteContentPath({
      siteSlug,
      slug: 'home',
      includeSitePrefix: true,
    })

    const sitePagePaths = new Set<string>([siteBasePath])

    for (const slug of ['contact', 'posts']) {
      sitePagePaths.add(
        generateSiteContentPath({
          siteSlug,
          slug,
          includeSitePrefix: true,
        }),
      )
    }

    for (const path of sitePagePaths) {
      revalidatePath(path)
    }

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
