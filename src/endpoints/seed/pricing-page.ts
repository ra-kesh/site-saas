import type { RequiredDataFromCollectionSlug } from 'payload'

import { createHeadingNode, createParagraphNode, createRichText, createTextNode } from './richText'

type PricingPageArgs = {
  tenantId: string
  tenantName: string
}

export const pricingPage = ({ tenantId, tenantName }: PricingPageArgs): (RequiredDataFromCollectionSlug<'pages'> & { tenant: string }) => ({
  tenant: tenantId,
  title: 'Pricing',
  slug: 'pricing',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: createRichText([
      createHeadingNode('h1', [createTextNode('Choose a plan that scales with you')]),
      createParagraphNode([
        createTextNode(
          `Transparent pricing and predictable performance for ${tenantName}. Start simple and grow without migrations.`,
        ),
      ]),
    ]),
  },
  layout: [
    {
      // @ts-ignore added via runtime blocks; types will be regenerated
      blockType: 'pricing',
      title: 'Plans',
      subtitle: 'Simple pricing, no surprises',
      plans: [
        {
          name: 'Starter',
          price: '$0',
          period: 'Forever free',
          features: [
            { item: '1 tenant' },
            { item: 'Pages, Posts, Forms' },
            { item: 'SEO + Redirects' },
          ],
          links: [
            { link: { type: 'custom', label: 'Get started', appearance: 'default', newTab: false, url: '/sign-up' } },
          ],
        },
        {
          name: 'Growth',
          price: '$49',
          period: 'per month',
          highlight: true,
          features: [
            { item: 'Up to 5 tenants' },
            { item: 'Search + Preview' },
            { item: 'Priority support' },
          ],
          links: [
            { link: { type: 'custom', label: 'Start trial', appearance: 'default', newTab: false, url: '/sign-up' } },
          ],
        },
        {
          name: 'Scale',
          price: 'Custom',
          period: 'Enterprise',
          features: [
            { item: 'Unlimited tenants' },
            { item: 'SLA + SSO' },
            { item: 'Dedicated support' },
          ],
          links: [
            { link: { type: 'custom', label: 'Contact sales', appearance: 'outline', newTab: false, url: '/sign-up' } },
          ],
        },
      ],
    },
    {
      // @ts-ignore added via runtime blocks; types will be regenerated
      blockType: 'faq',
      title: 'Pricing FAQs',
      items: [
        {
          question: 'Can I change plans later?',
          answer: createRichText([createParagraphNode([createTextNode('Yes, upgrade or downgrade anytime.')])]),
        },
        {
          question: 'Is there a trial?',
          answer: createRichText([createParagraphNode([createTextNode('All paid plans include a 14-day trial.')])]),
        },
      ],
    },
  ],
  meta: {
    title: `${tenantName} pricing`,
    description: 'Compare plans and pick the right fit.',
  },
})
