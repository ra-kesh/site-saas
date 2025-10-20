import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type SeedCategory = {
  id: string
  title: string
}

type PostSeedArgs = {
  categories: SeedCategory[]
  tenantId: string
}

export const createPostSeeds = ({
  categories,
  tenantId,
}: PostSeedArgs): Array<RequiredDataFromCollectionSlug<'posts'> & { tenant: string }> => {
  const [firstCategory, secondCategory = firstCategory] = categories

  return [
    {
      tenant: tenantId,
      title: 'Launching the Demo Creative tenant experience',
      slug: 'launching-demo-creative',
      _status: 'published',
      categories: firstCategory ? [firstCategory.id] : [],
      content: createRichText([
        createHeadingNode('h2', [createTextNode('Why Payload for multi-tenant marketing?')]),
        createParagraphNode([
          createTextNode(
            'We built Demo Creative to showcase how Payload keeps tenant content, redirects, and forms isolated while sharing a single codebase. The seed data mirrors the production setup we deploy for client work.',
          ),
        ]),
        createHeadingNode('h3', [createTextNode('What ships with the starter?')]),
        createParagraphNode([
          createTextNode(
            'Pages support the hero, content, archive, CTA, and form blocks. Posts include rich text with embeds, categories, and related content. Every document ties back to a tenant so access control stays predictable.',
          ),
        ]),
      ]),
      meta: {
        title: 'Launching the Demo Creative tenant experience',
        description:
          'A walkthrough of the seeded Payload + Next.js starter powering tenant marketing sites.',
      },
    },
    {
      tenant: tenantId,
      title: 'Designing editorial workflows for every tenant',
      slug: 'designing-tenant-workflows',
      _status: 'published',
      categories: secondCategory ? [secondCategory.id] : [],
      content: createRichText([
        createHeadingNode('h2', [createTextNode('Structured content without the friction')]),
        createParagraphNode([
          createTextNode(
            'Editors get a focused dashboard with just the collections they need. Scheduled publishing, live preview, and form builder support mean each tenant can launch campaigns independently.',
          ),
        ]),
        createHeadingNode('h3', [createTextNode('Blocks that map to React components')]),
        createParagraphNode([
          createTextNode(
            'Every block in the seed content corresponds to a React component in the frontend. It is easy to swap styles, extend functionality, or add entirely new modules when a tenant requests them.',
          ),
        ]),
      ]),
      meta: {
        title: 'Designing editorial workflows for every tenant',
        description:
          'How Demo Creative configures Payload blocks and access control to keep teams shipping quickly.',
      },
    },
  ]
}

