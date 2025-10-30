import type { CollectionConfig } from 'payload'

export const Settings: CollectionConfig = {
  slug: 'settings',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['tenant', 'updatedAt'],
  },
  fields: [
    {
      name: 'brand',
      type: 'group',
      fields: [
        { name: 'primary', type: 'text', admin: { description: 'Primary brand color (e.g., #4F46E5)' } },
        { name: 'accent', type: 'text', admin: { description: 'Accent color (e.g., #22D3EE)' } },
        { name: 'logoLight', type: 'upload', relationTo: 'media' },
        { name: 'logoDark', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'typography',
      type: 'select',
      defaultValue: 'system',
      options: [
        { label: 'System', value: 'system' },
        { label: 'Classic', value: 'classic' },
        { label: 'Modern', value: 'modern' },
      ],
    },
  ],
}
