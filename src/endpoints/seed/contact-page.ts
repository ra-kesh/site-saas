import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type ContactPageArgs = {
  contactFormId: string
  tenantId: string
  tenantName: string
}

export const contactPage = ({
  contactFormId,
  tenantId,
  tenantName,
}: ContactPageArgs): (RequiredDataFromCollectionSlug<'pages'> & { tenant: string }) => ({
  tenant: tenantId,
  title: 'Contact',
  slug: 'contact',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: createRichText([
      createHeadingNode('h1', [createTextNode(`Tell ${tenantName} about your next launch`)]),
      createParagraphNode([
        createTextNode(
          'Fill out the brief form below and we will schedule a kickoff call to align on goals, scope, and timelines.',
        ),
      ]),
    ]),
  },
  layout: [
    {
      blockType: 'formBlock',
      enableIntro: true,
      form: contactFormId,
      introContent: createRichText([
        createParagraphNode([
          createTextNode(
            'We typically respond within one business day. Share as much detail as possible — a URL to your current site, the product you are launching, and your ideal launch date help us prepare before we chat.',
          ),
        ]),
      ]),
    },
  ],
  meta: {
    title: `Contact ${tenantName}`,
    description: `Start a project with ${tenantName}. We specialize in multi-tenant marketing sites and conversion-focused experiences.`,
  },
})
