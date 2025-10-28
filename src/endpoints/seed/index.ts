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
  businessDetails?: {
    name?: string | null
    description?: string | null
    audience?: string | null
    primaryGoal?: string | null
  }
}

export const seedTenant = async ({
  payload,
  tenant,
  ownerEmail,
  businessDetails,
}: SeedTenantArgs) => {
  const { id: tenantId, slug: tenantSlug, name: tenantName } = tenant

  payload.logger.info(`Seeding starter content for tenant "${tenantSlug}"…`)

  const displayName = businessDetails?.name?.trim() || tenantName
  const defaultDescription = `${displayName} delivers block-based marketing sites with reusable sections, live previews, and tenant-specific content tailored to each workspace.`
  const description = businessDetails?.description?.trim() || defaultDescription
  const audience =
    businessDetails?.audience?.trim() || 'growth-focused founders and marketing teams'
  const primaryGoal = businessDetails?.primaryGoal?.trim() || 'Start a project'

  type SeedCollectionsWithSlug = 'categories' | 'pages' | 'posts'

  const deleteBySlug = async (collection: SeedCollectionsWithSlug, slug: string) => {
    const docs = await payload.find({
      collection,
      limit: 100,
      pagination: false,
      where: {
        and: [
          {
            slug: {
              equals: slug,
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

    if (docs.totalDocs > 0) {
      await Promise.all(
        docs.docs.map((doc) =>
          payload.delete({
            collection,
            id: doc.id as string,
            context: {
              disableRevalidate: true,
            },
          }),
        ),
      )
    }
  }

  const deleteSeedForms = async () => {
    const existingForms = await payload.find({
      collection: 'forms',
      limit: 100,
      pagination: false,
      where: {
        tenant: {
          equals: tenantId,
        },
      },
    })

    const formsToDelete = existingForms.docs.filter((form) => {
      if (!form.emails) return false
      return form.emails.some((email) =>
        typeof email?.emailFrom === 'string'
          ? email.emailFrom.includes(`${tenantSlug}.example.com`)
          : false,
      )
    })

    if (formsToDelete.length > 0) {
      await Promise.all(
        formsToDelete.map((form) =>
          payload.delete({
            collection: 'forms',
            id: form.id as string,
            context: {
              disableRevalidate: true,
            },
          }),
        ),
      )
    }
  }

  await Promise.all([
    deleteBySlug('pages', 'home'),
    deleteBySlug('pages', 'contact'),
    deleteBySlug('pages', 'posts'),
    deleteBySlug('posts', `introducing-${tenantSlug}`),
    deleteBySlug('posts', `inside-${tenantSlug}-build`),
    ...categoryNames.map((title) => deleteBySlug('categories', `${toSlug(title)}-${tenantSlug}`)),
    deleteSeedForms(),
  ])

  payload.logger.info('— Cleared previous seed content')

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
      businessName: displayName,
      businessDescription: description,
      primaryAudience: audience,
      primaryGoal,
      tenantSlug,
      notificationEmail: ownerEmail ?? undefined,
    }),
  })

  payload.logger.info('— Added contact form')

  const postSeeds = createPostSeeds({
    categories: categories.map(({ id, title }) => ({ id, title })),
    tenantId,
    tenantSlug,
    businessName: displayName,
    businessDescription: description,
    primaryAudience: audience,
    primaryGoal,
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
      businessName: displayName,
      businessDescription: description,
      primaryGoal,
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
      tenantName: displayName,
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

  await payload.create({
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
      businessName: displayName,
      businessDescription: description,
      primaryAudience: audience,
      primaryGoal,
    }),
  })

  payload.logger.info('— Published home page')
  payload.logger.info(`Seeded database successfully for tenant "${tenantSlug}".`)
}

// Backwards compatibility for existing imports
export const seed = seedTenant
