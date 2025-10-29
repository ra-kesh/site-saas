import clsx from 'clsx'
import React from 'react'
import RichText from '@/components/RichText'

import type { Category, Post } from '@/payload-types'

import { Card, type CardPostData } from '../../components/Card'
import { type TenantReference } from '@/lib/utils'
import { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

export type RelatedPostsProps = {
  className?: string
  docs?: Post[]
  introContent?: DefaultTypedEditorState
}

export const RelatedPosts: React.FC<RelatedPostsProps> = (props) => {
  const { className, docs, introContent } = props

  const toCardPostData = (doc: Post): CardPostData => {
    const normalizedCategories = doc.categories?.map((category) => {
      if (typeof category === 'object') return category
      return category
    }) as (Category | string)[] | undefined

    return {
      slug: doc.slug,
      meta: doc.meta,
      title: doc.title,
      categories: normalizedCategories,
      site: doc.site ?? null,
      tenant:
        typeof doc === 'object' && doc !== null && 'tenant' in doc
          ? (doc as unknown as { tenant?: TenantReference }).tenant
          : undefined,
    }
  }

  return (
    <div className={clsx('lg:container', className)}>
      {introContent && <RichText data={introContent} enableGutter={false} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-stretch">
        {docs?.map((doc, index) => {
          if (typeof doc === 'string') return null

          return (
            <Card
              key={index}
              doc={toCardPostData(doc)}
              relationTo="posts"
              showCategories
            />
          )
        })}
      </div>
    </div>
  )
}
