import type { Block } from 'payload'
import { defaultLexical } from '@/fields/defaultLexical'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: {
    singular: 'FAQ',
    plural: 'FAQs',
  },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 10,
      admin: { initCollapsed: true },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', editor: defaultLexical, required: true },
      ],
    },
  ],
}
