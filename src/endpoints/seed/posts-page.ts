import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type PostsListingPageArgs = {
  categories: string[]
  siteId: string
  siteName: string
}

export const postsListingPage = ({
  categories,
  siteId,
  siteName,
}: PostsListingPageArgs): (RequiredDataFromCollectionSlug<'pages'> & { site: string }) => ({
  site: siteId,
  title: 'Latest posts',
  slug: 'posts',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: createRichText([
      createHeadingNode('h1', [createTextNode('Latest posts')]),
      createParagraphNode([
        createTextNode(
          `Stories from the ${siteName} team — product launches, workflow tips, and customer spotlights for multi-site experiences.`,
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
            'Browse every article seeded for this site. Filtered archives can be added per category or product line.',
          ),
        ]),
      ]),
      limit: 12,
      populateBy: 'collection',
      relationTo: 'posts',
    },
  ],
  meta: {
    title: `${siteName} posts`,
    description: 'A running list of launch notes and product updates.',
  },
})
