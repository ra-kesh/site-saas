import { getPayload } from 'payload'
import { headers } from 'next/headers'

import config from '@payload-config'
import { seedTenant } from '@/endpoints/seed'
import type { Tenant, User } from '@/payload-types'

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

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
  try {
    const body = await request.json()
    if (body && typeof body.tenantSlug === 'string') {
      tenantSlugFromBody = body.tenantSlug
    }
  } catch {
    // ignore JSON parse errors — the body is optional
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
    })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
