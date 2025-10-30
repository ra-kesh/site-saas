import type { Payload } from 'payload'

import type { Post } from '@/payload-types'

import { contactForm } from './contact-form'
import { contactPage } from './contact-page'
import { home } from './home'
import { postsListingPage } from './posts-page'
import { createPostSeeds } from './posts'
import { generateTenantContentPath } from '@/lib/utils'
import { pricingPage } from './pricing-page'

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

  const postsPage = await payload.create({
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
    : generateTenantContentPath({
        slug: 'home',
        tenantSlug,
      })

  const contactUrl = generateTenantContentPath({
    slug: 'contact',
    tenantSlug,
  })

  // Precompute stable URLs to avoid relationship validation during seed
  const homeUrl = generateTenantContentPath({ slug: 'home', tenantSlug })
  const blogUrl = generateTenantContentPath({ slug: 'posts', tenantSlug })
  const pricingUrl = generateTenantContentPath({ slug: 'pricing', tenantSlug })

  const homePage = await payload.create({
    collection: 'pages',
    context: {
      disableRevalidate: true,
    },
    data: home({
      categories: categoryIds,
      contactUrl,
      featuredPostUrl,
      tenantId,
      tenantSlug,
      tenantName,
    }),
  })

  payload.logger.info('— Published home page')

  const pricing = await payload.create({
    collection: 'pages',
    context: { disableRevalidate: true },
    data: pricingPage({ tenantId, tenantName }),
  })
  payload.logger.info('— Published pricing page')

  // Seed Header / Footer if missing
  const existingHeader = await payload.find({
    collection: 'headers',
    limit: 1,
    pagination: false,
    where: { tenant: { equals: tenantId } },
  })

  if (existingHeader.totalDocs === 0) {
    await payload.create({
      collection: 'headers',
      context: { disableRevalidate: true },
      data: {
        tenant: tenantId,
        navItems: [
          {
            link: { type: 'custom', newTab: false, url: homeUrl, label: 'Home' },
          },
          {
            link: { type: 'custom', newTab: false, url: blogUrl, label: 'Blog' },
          },
          {
            link: { type: 'custom', newTab: false, url: pricingUrl, label: 'Pricing' },
          },
          {
            link: {
              type: 'custom',
              newTab: false,
              url: contactUrl,
              label: 'Contact',
            },
          },
        ],
      },
    })
    payload.logger.info('— Seeded header navigation')
  } else {
    payload.logger.info('— Header exists, skipping')
  }

  const existingFooter = await payload.find({
    collection: 'footers',
    limit: 1,
    pagination: false,
    where: { tenant: { equals: tenantId } },
  })

  if (existingFooter.totalDocs === 0) {
    await payload.create({
      collection: 'footers',
      context: { disableRevalidate: true },
      data: {
        tenant: tenantId,
        navItems: [
          {
            link: { type: 'custom', newTab: false, url: homeUrl, label: 'Home' },
          },
          {
            link: { type: 'custom', newTab: false, url: blogUrl, label: 'Blog' },
          },
          {
            link: { type: 'custom', newTab: false, url: pricingUrl, label: 'Pricing' },
          },
          {
            link: {
              type: 'custom',
              newTab: false,
              url: contactUrl,
              label: 'Contact',
            },
          },
        ],
      },
    })
    payload.logger.info('— Seeded footer navigation')
  } else {
    payload.logger.info('— Footer exists, skipping')
  }

  // Seed Settings if missing
  const existingSettings = await payload.find({
    collection: 'settings' as any,
    limit: 1,
    pagination: false,
    where: { tenant: { equals: tenantId } },
  })
  if (existingSettings.totalDocs === 0) {
    await payload.create({
      collection: 'settings' as any,
      context: { disableRevalidate: true },
      data: {
        tenant: tenantId,
        brand: {
          primary: '#111827',
          accent: '#3B82F6',
        },
        typography: 'system',
      } as any,
    })
    payload.logger.info('— Seeded tenant settings')
  } else {
    payload.logger.info('— Settings exist, skipping')
  }
  payload.logger.info(`Seeded database successfully for tenant "${tenantSlug}".`)
}

// Backwards compatibility for existing imports
export const seed = seedTenant
