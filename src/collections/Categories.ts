import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { activeSiteOnly } from '../access/activeSite'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: activeSiteOnly,
    delete: activeSiteOnly,
    read: anyone,
    update: activeSiteOnly,
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
