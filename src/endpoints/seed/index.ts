import type { Payload } from 'payload'

import type { Post } from '@/payload-types'

import { contactForm } from './contact-form'
import { contactPage } from './contact-page'
import { home } from './home'
import { postsListingPage } from './posts-page'
import { createPostSeeds } from './posts'
import { generateTenantContentPath } from '@/lib/utils'

const categoryNames = ['Product updates', 'Customer spotlights']

const toSlug = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

type SeedTenantArgs = {
  payload: Payload
  tenant: {
    id: string
    slug: string
    name: string
  }
  ownerEmail?: string | null
}

export const seedTenant = async ({ payload, tenant, ownerEmail }: SeedTenantArgs) => {
  const { id: tenantId, slug: tenantSlug, name: tenantName } = tenant

  payload.logger.info(`Seeding starter content for tenant "${tenantSlug}"…`)

  const existingHome = await payload.find({
    collection: 'pages',
    limit: 1,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: 'home',
          },
        },
        {
          tenant: {
            equals: tenantId,
          },
        },
      ],
    },
  })

  if (existingHome.totalDocs > 0) {
    payload.logger.info(
      `Seed skipped — tenant "${tenantSlug}" already has a home page. Delete existing content to reseed.`,
    )
    return
  }

  const categories = await Promise.all(
    categoryNames.map((title) =>
      payload.create({
        collection: 'categories',
        context: {
          disableRevalidate: true,
        },
        data: {
          tenant: tenantId,
          title,
          slug: `${toSlug(title)}-${tenantSlug}`,
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
    data: contactForm({
      tenantId,
      tenantName,
      tenantSlug,
      notificationEmail: ownerEmail ?? undefined,
    }),
  })

  payload.logger.info('— Added contact form')

  const postSeeds = createPostSeeds({
    categories: categories.map(({ id, title }) => ({ id, title })),
    tenantId,
    tenantName,
    tenantSlug,
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

  await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: contactPage({
      contactFormId: form.id,
      tenantId,
      tenantName,
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
      tenantId,
      tenantName,
    }),
  })

  payload.logger.info('— Published posts listing')

  const featuredPost = posts[0]
  const featuredPostUrl = featuredPost
    ? generateTenantContentPath({
        collection: 'posts',
        slug: featuredPost.slug,
        tenantSlug,
      })
    : `/tenants/${tenantSlug}`

  await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: home({
      categories: categoryIds,
      contactUrl: `/tenants/${tenantSlug}/contact`,
      featuredPostUrl,
      tenantId,
      tenantSlug,
      tenantName,
    }),
  })

  payload.logger.info('— Published home page')
  payload.logger.info(`Seeded database successfully for tenant "${tenantSlug}".`)
}

// Backwards compatibility for existing imports
export const seed = seedTenant
