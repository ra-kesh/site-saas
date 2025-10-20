import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createCustomLinkNode,
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type HomePageArgs = {
  categories: string[]
  contactUrl: string
  featuredPostUrl: string
  tenantId: string
  tenantSlug: string
}

export const home = ({
  categories,
  contactUrl,
  featuredPostUrl,
  tenantId,
  tenantSlug,
}: HomePageArgs): (RequiredDataFromCollectionSlug<'pages'> & { tenant: string }) => ({
  tenant: tenantId,
  title: 'Demo Creative',
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: createRichText([
      createHeadingNode('h1', [createTextNode('Multi-tenant sites built to convert')]),
      createParagraphNode([
        createTextNode(
          'Demo Creative helps SaaS teams launch fast, experiment often, and scale confidently with Payload-powered marketing infrastructure.',
        ),
      ]),
      createParagraphNode([
        createTextNode('This demo tenant lives at '),
        createCustomLinkNode([createTextNode(`/tenants/${tenantSlug}`)], {
          newTab: false,
          url: `/tenants/${tenantSlug}`,
        }),
        createTextNode(' — explore the seeded content to see every block in action.'),
      ]),
    ]),
    links: [
      {
        link: {
          appearance: 'default',
          label: 'Start a project',
          newTab: false,
          type: 'custom',
          url: contactUrl,
        },
      },
      {
        link: {
          appearance: 'outline',
          label: 'Read a recent launch',
          newTab: false,
          type: 'custom',
          url: featuredPostUrl,
        },
      },
    ],
  },
  layout: [
    {
      blockName: 'Highlights',
      blockType: 'content',
      columns: [
        {
          enableLink: false,
          richText: createRichText([
            createHeadingNode('h2', [createTextNode('Everything editors expect')]),
            createParagraphNode([
              createTextNode(
                'Reusable blocks, previews, scheduled publishing, and full tenant isolation are ready to go out of the box.',
              ),
            ]),
          ]),
          size: 'half',
        },
        {
          enableLink: false,
          richText: createRichText([
            createHeadingNode('h3', [createTextNode('Bring your components')]),
            createParagraphNode([
              createTextNode(
                'Connect Payload blocks directly to your React components. Seeded content demonstrates the hero, content, archive, CTA, and form blocks working together.',
              ),
            ]),
          ]),
          size: 'half',
        },
      ],
    },
    {
      blockType: 'cta',
      richText: createRichText([
        createHeadingNode('h2', [createTextNode('Ready to launch your next tenant?')]),
        createParagraphNode([
          createTextNode(
            'Provision a tenant, invite collaborators, and start publishing pages without touching code. Each tenant keeps schedules, redirects, and forms separate.',
          ),
        ]),
      ]),
      links: [
        {
          link: {
            appearance: 'default',
            label: 'Talk to the team',
            newTab: false,
            type: 'custom',
            url: contactUrl,
          },
        },
      ],
    },
    {
      blockName: 'Latest posts',
      blockType: 'archive',
      categories,
      introContent: createRichText([
        createHeadingNode('h2', [createTextNode('Latest launch notes')]),
        createParagraphNode([
          createTextNode(
            'A running feed of improvements and customer stories from the Demo Creative tenant.',
          ),
        ]),
      ]),
      limit: 3,
      populateBy: 'collection',
      relationTo: 'posts',
    },
  ],
  meta: {
    title: 'Demo Creative — tenant-aware marketing starter',
    description:
      'Explore a multi-tenant Payload + Next.js starter with pages, posts, forms, redirects, and preview-ready blocks.',
  },
})

