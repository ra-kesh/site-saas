import type { Post, ArchiveBlock as ArchiveBlockProps, Tenant } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { extractTenantId } from '@/lib/utils'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
    tenant?: Tenant | string
  }
> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs, tenant } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []
  const tenantId = extractTenantId(tenant)

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const where = {
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            categories: {
              in: flattenedCategories,
            },
          }
        : {}),
      ...(tenantId
        ? {
            tenant: {
              equals: tenantId,
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
          if (!tenantId) return true
          const postTenantId = extractTenantId(post.tenant)
          return !postTenantId || postTenantId === tenantId
        })

      posts = filteredSelectedPosts
    }
  }

  return (
    <div id={`block-${id}`}>
      {introContent && (
        <div className="mb-8 md:mb-12">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
