import type { Block } from 'payload'
import { defaultLexical } from '@/fields/defaultLexical'

export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [
        { name: 'quote', type: 'richText', editor: defaultLexical, required: true },
        { name: 'authorName', type: 'text', required: true },
        { name: 'authorTitle', type: 'text' },
      ],
    },
  ],
}
