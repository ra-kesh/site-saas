import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { activeTenantOnly } from '../access/activeTenant'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: activeTenantOnly,
    delete: activeTenantOnly,
    read: anyone,
    update: activeTenantOnly,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
