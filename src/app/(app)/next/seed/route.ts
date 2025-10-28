import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'

import config from '@payload-config'
import { seedTenant } from '@/endpoints/seed'
import type { Tenant, User } from '@/payload-types'
import { generateTenantContentPath } from '@/lib/utils'

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

type SeedRequestBody = {
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

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  let tenantSlugFromBody: string | undefined
  let businessDetails: SeedRequestBody['business']

  try {
    const body = (await request.json()) as SeedRequestBody
    if (body && typeof body === 'object') {
      tenantSlugFromBody =
        typeof body.tenantSlug === 'string' ? body.tenantSlug.trim() : undefined
      businessDetails = body.business
    }
  } catch {
    // Body is optional — ignore JSON parse errors
  }

  let tenantDoc: Tenant | null = null

  if (tenantSlugFromBody) {
    const tenants = await payload.find({
      collection: 'tenants',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: tenantSlugFromBody,
        },
      },
    })
    tenantDoc = (tenants.docs[0] as Tenant | undefined) ?? null
  } else {
    const tenantId = resolveTenantIdFromUser(user as User)
    if (tenantId) {
      try {
        const tenant = await payload.findByID({
          collection: 'tenants',
          id: tenantId,
        })
        tenantDoc = tenant as Tenant
      } catch (error) {
        payload.logger.error({
          err: error,
          message: `Unable to resolve tenant with id "${tenantId}" for seeding`,
        })
      }
    }
  }

  if (!tenantDoc) {
    return new Response('Tenant not found for seeding.', { status: 400 })
  }

  try {
    await seedTenant({
      payload,
      tenant: {
        id: tenantDoc.id,
        slug: tenantDoc.slug,
        name: tenantDoc.name,
      },
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

    const tenantSlug = tenantDoc.slug
    const tenantTags = [
      `tenant:${tenantSlug}`,
      `tenant:${tenantSlug}:page:home`,
      `tenant:${tenantSlug}:page:contact`,
      `tenant:${tenantSlug}:page:posts`,
    ]

    const globalTags = ['tenants', 'pages', 'pages-sitemap', 'posts', 'posts-sitemap']

    for (const tag of [...tenantTags, ...globalTags]) {
      revalidateTag(tag, 'max')
    }

    const tenantBasePath = generateTenantContentPath({
      tenantSlug,
      slug: 'home',
      includeTenantPrefix: true,
    })

    const tenantPagePaths = new Set<string>([tenantBasePath])

    for (const slug of ['contact', 'posts']) {
      tenantPagePaths.add(
        generateTenantContentPath({
          tenantSlug,
          slug,
          includeTenantPrefix: true,
        }),
      )
    }

    for (const path of tenantPagePaths) {
      revalidatePath(path)
    }

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
