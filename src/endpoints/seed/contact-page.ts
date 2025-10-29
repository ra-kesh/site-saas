import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type ContactPageArgs = {
  contactFormId: string
  siteId: string
  businessName: string
  businessDescription: string
  primaryGoal: string
}

export const contactPage = ({
  contactFormId,
  siteId,
  businessName,
  businessDescription,
  primaryGoal,
}: ContactPageArgs): (RequiredDataFromCollectionSlug<'pages'> & { site: string }) => ({
  site: siteId,
  title: 'Contact',
  slug: 'contact',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: createRichText([
      createHeadingNode('h1', [createTextNode(`Partner with ${businessName}`)]),
      createParagraphNode([
        createTextNode(businessDescription),
      ]),
      createParagraphNode([
        createTextNode(`Ready to ${primaryGoal.toLowerCase()}? Fill out the brief form below and we’ll plan your next steps together.`),
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
    title: `Contact ${businessName}`,
    description: `Start a project with ${businessName}. We’ll guide you through the next steps so you can ${primaryGoal.toLowerCase()}.`,
  },
})
