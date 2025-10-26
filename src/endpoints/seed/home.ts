import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createCustomLinkNode,
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'
import { generateTenantContentPath } from '@/lib/utils'

type HomePageArgs = {
  categories: string[]
  contactUrl: string
  featuredPostUrl: string
  tenantId: string
  tenantSlug: string
  tenantName: string
}

export const home = ({
  categories,
  contactUrl,
  featuredPostUrl,
  tenantId,
  tenantSlug,
  tenantName,
}: HomePageArgs): (RequiredDataFromCollectionSlug<'pages'> & { tenant: string }) => {
  const siteHomePath = generateTenantContentPath({
    slug: 'home',
    tenantSlug,
  })

  return {
    tenant: tenantId,
    title: 'Home',
    slug: 'home',
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: createRichText([
        createHeadingNode('h1', [createTextNode(`Welcome to ${tenantName}`)]),
        createParagraphNode([
          createTextNode(
            `${tenantName} publishes tenant-specific marketing pages with reusable blocks, live preview, and form integrations powered by Payload.`,
          ),
        ]),
        createParagraphNode([
          createTextNode('Explore your site at '),
          createCustomLinkNode([createTextNode(siteHomePath)], {
            newTab: false,
            url: siteHomePath,
          }),
          createTextNode(' to see every seeded component in action.'),
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
                  'Reusable blocks, previews, scheduled publishing, and tenant isolation are ready to go out of the box.',
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
              `A running feed of improvements and customer stories from ${tenantName}.`,
            ),
          ]),
        ]),
        limit: 3,
        populateBy: 'collection',
        relationTo: 'posts',
      },
    ],
    meta: {
      title: `${tenantName} — tenant-aware marketing starter`,
      description:
        'Explore a multi-tenant Payload + Next.js starter with pages, posts, forms, redirects, and preview-ready blocks.',
    },
  }
}
