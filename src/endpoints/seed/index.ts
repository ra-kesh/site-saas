import type { Payload, PayloadRequest } from 'payload'

import type { Post } from '@/payload-types'

import { contactForm } from './contact-form'
import { contactPage } from './contact-page'
import { home } from './home'
import { postsListingPage } from './posts-page'
import { createPostSeeds } from './posts'
import { generateTenantContentPath } from '@/lib/utils'

const TENANT_SLUG = 'demo-creative'
const TENANT_NAME = 'Demo Creative'

const categoryNames = ['Product updates', 'Customer spotlights']

const toSlug = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const seed = async ({
  payload,
}: {
  payload: Payload
  req: PayloadRequest
}) => {
  payload.logger.info('Seeding multi-tenant starter content…')

  const existingTenant = await payload.find({
    collection: 'tenants',
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: TENANT_SLUG,
      },
    },
  })

  if (existingTenant.totalDocs > 0) {
    payload.logger.info(
      `Seed skipped — a tenant with slug "${TENANT_SLUG}" already exists. Delete it if you want to reseed.`,
    )
    return
  }

  const tenant = await payload.create({
    collection: 'tenants',
    context: {
      disableRevalidate: true,
    },
    data: {
      name: TENANT_NAME,
      slug: TENANT_SLUG,
    },
  })

  payload.logger.info('— Created demo tenant')

  const categories = await Promise.all(
    categoryNames.map((title) =>
      payload.create({
        collection: 'categories',
        context: {
          disableRevalidate: true,
        },
        data: {
          tenant: tenant.id,
          title,
          slug: toSlug(title),
        },
      }),
    ),
  )

  payload.logger.info('— Seeded categories')

  const form = await payload.create({
    collection: 'forms',
    context: {
      disableRevalidate: true,
    },
    data: contactForm({ tenantId: tenant.id }),
  })

  payload.logger.info('— Added contact form')

  const postSeeds = createPostSeeds({
    categories: categories.map(({ id, title }) => ({ id, title })),
    tenantId: tenant.id,
  })

  const posts: Post[] = []

  for (const postSeed of postSeeds) {
    const post = await payload.create({
      collection: 'posts',
      context: {
        disableRevalidate: true,
      },
      data: postSeed,
    })
    posts.push(post as Post)
  }

  if (posts.length > 1) {
    const [firstPost, ...restPosts] = posts
    const restIds = restPosts.map((post) => post.id)

    await payload.update({
      id: firstPost.id,
      collection: 'posts',
      context: {
        disableRevalidate: true,
      },
      data: {
        relatedPosts: restIds,
      },
    })

    await Promise.all(
      restPosts.map((post) =>
        payload.update({
          id: post.id,
          collection: 'posts',
          context: {
            disableRevalidate: true,
          },
          data: {
            relatedPosts: [firstPost.id, ...restIds.filter((id) => id !== post.id)],
          },
        }),
      ),
    )
  }

  payload.logger.info(`— Created ${posts.length} posts`)

  const contact = await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: contactPage({
      contactFormId: form.id,
      tenantId: tenant.id,
    }),
  })

  payload.logger.info('— Published contact page')

  const categoryIds = categories.map((category) => category.id)

  await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: postsListingPage({
      categories: categoryIds,
      tenantId: tenant.id,
    }),
  })

  payload.logger.info('— Published posts listing')

  const featuredPost = posts[0]
  const featuredPostUrl = featuredPost
    ? generateTenantContentPath({
        collection: 'posts',
        slug: featuredPost.slug,
        tenantSlug: TENANT_SLUG,
      })
    : `/tenants/${TENANT_SLUG}`

  await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: home({
      categories: categoryIds,
      contactUrl: `/tenants/${TENANT_SLUG}/contact`,
      featuredPostUrl,
      tenantId: tenant.id,
      tenantSlug: TENANT_SLUG,
    }),
  })

  payload.logger.info('— Published home page')
  payload.logger.info('Seeded database successfully!')
}
