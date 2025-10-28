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
  businessName: string
  businessDescription: string
  primaryAudience: string
  primaryGoal: string
}

export const home = ({
  categories,
  contactUrl,
  featuredPostUrl,
  tenantId,
  tenantSlug,
  businessName,
  businessDescription,
  primaryAudience,
  primaryGoal,
}: HomePageArgs): (RequiredDataFromCollectionSlug<'pages'> & { tenant: string }) => {
  const siteHomePath = generateTenantContentPath({
    slug: 'home',
    tenantSlug,
  })
  const goalPhrase = primaryGoal.toLowerCase()

  return {
    tenant: tenantId,
    title: 'Home',
    slug: 'home',
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: createRichText([
        createHeadingNode('h1', [createTextNode(businessName)]),
        createParagraphNode([createTextNode(businessDescription)]),
        createParagraphNode([
          createTextNode(`Explore your draft site at `),
          createCustomLinkNode([createTextNode(siteHomePath)], {
            newTab: false,
            url: siteHomePath,
          }),
          createTextNode(' and keep iterating as we add more blocks.'),
        ]),
        createParagraphNode([
          createTextNode(
            `We built this experience for ${primaryAudience.toLowerCase()} who want to ${goalPhrase} without wading through custom code.`,
          ),
        ]),
      ]),
      links: [
        {
          link: {
            appearance: 'default',
            label: primaryGoal,
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
              createHeadingNode('h2', [
                createTextNode(`Built to move fast with ${primaryAudience.toLowerCase()}`),
              ]),
              createParagraphNode([
                createTextNode(
                  'Reusable blocks, previews, scheduled publishing, and tenant isolation are ready to go out of the box so your team can ship updates weekly.',
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
          createHeadingNode('h2', [
            createTextNode(`Ready to ${goalPhrase}?`),
          ]),
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
              `A running feed of improvements and customer stories from ${businessName}.`,
            ),
          ]),
        ]),
        limit: 3,
        populateBy: 'collection',
        relationTo: 'posts',
      },
    ],
    meta: {
      title: `${businessName} — launch-ready site`,
      description: `Explore how ${businessName} uses block-based pages, posts, and forms to ${goalPhrase}.`,
    },
  }
}
