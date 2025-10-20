import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type PostsListingPageArgs = {
  categories: string[]
  tenantId: string
  tenantName: string
}

export const postsListingPage = ({
  categories,
  tenantId,
  tenantName,
}: PostsListingPageArgs): (RequiredDataFromCollectionSlug<'pages'> & { tenant: string }) => ({
  tenant: tenantId,
  title: 'Latest posts',
  slug: 'posts',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: createRichText([
      createHeadingNode('h1', [createTextNode('Latest posts')]),
      createParagraphNode([
        createTextNode(
          `Stories from the ${tenantName} team — product launches, workflow tips, and customer spotlights for multi-tenant sites.`,
        ),
      ]),
    ]),
  },
  layout: [
    {
      blockType: 'archive',
      blockName: 'All posts',
      categories,
      introContent: createRichText([
        createParagraphNode([
          createTextNode(
            'Browse every article seeded for this tenant. Filtered archives can be added per category or product line.',
          ),
        ]),
      ]),
      limit: 12,
      populateBy: 'collection',
      relationTo: 'posts',
    },
  ],
  meta: {
    title: `${tenantName} posts`,
    description: 'A running list of tenant launch notes and product updates.',
  },
})
