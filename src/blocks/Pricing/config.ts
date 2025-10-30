import type { Block } from 'payload'
import { linkGroup } from '@/fields/linkGroup'

export const Pricing: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: { singular: 'Pricing', plural: 'Pricing' },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    {
      name: 'plans',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'price', type: 'text', required: true },
        { name: 'period', type: 'text' },
        { name: 'highlight', type: 'checkbox', defaultValue: false },
        {
          name: 'features',
          type: 'array',
          minRows: 1,
          fields: [{ name: 'item', type: 'text', required: true }],
        },
        linkGroup({ overrides: { maxRows: 1 } }),
      ],
    },
  ],
}
