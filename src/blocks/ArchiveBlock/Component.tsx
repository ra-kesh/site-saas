import type { Category, Post, ArchiveBlock as ArchiveBlockProps, Site, Tenant } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { extractSiteId, extractTenantId, type TenantReference } from '@/lib/utils'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
    site?: Site | string | null
    tenant?: Tenant | string
  }
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    selectedDocs,
    site,
    tenant,
  } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []
  const siteId = site ? extractSiteId(site) : undefined
  const tenantId = extractTenantId(tenant as TenantReference)

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      return category
    })

    const where = {
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            categories: {
              in: flattenedCategories,
            },
          }
        : {}),
      ...(siteId
        ? {
            site: {
              equals: siteId,
            },
          }
        : {}),
    } satisfies Where

    const fetchedPosts = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      ...(Object.keys(where).length > 0 ? { where } : {}),
    })

    posts = fetchedPosts.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedPosts = selectedDocs
        .map((post) => {
          if (typeof post.value === 'object') return post.value
          return null
        })
        .filter((post): post is Post => {
          if (!post) return false
          if (siteId) {
            const postSiteId = extractSiteId(post.site)

            if (postSiteId) {
              return postSiteId === siteId
            }
          }

          if (!tenantId) return true

          const postTenantId =
            typeof post === 'object' && post !== null && 'tenant' in post
              ? extractTenantId((post as unknown as { tenant?: TenantReference }).tenant)
              : undefined

          return !postTenantId || postTenantId === tenantId
        })

      posts = filteredSelectedPosts
    }
  }

  const toCardPostData = (post: Post) => {
    const baseCategories = post.categories?.map((category) => {
      if (typeof category === 'object') return category
      return category
    }) as (Category | string)[] | undefined

    return {
      slug: post.slug,
      categories: baseCategories,
      meta: post.meta,
      title: post.title,
      site: post.site ?? null,
      tenant:
        typeof post === 'object' && post !== null && 'tenant' in post
          ? (post as unknown as { tenant?: TenantReference }).tenant
          : undefined,
    }
  }

  const cardPosts = posts.map(toCardPostData)

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={cardPosts} />
    </div>
  )
}
