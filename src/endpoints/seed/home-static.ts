import type { RequiredDataFromCollectionSlug } from 'payload'

// Used for pre-seeded content so that the homepage is not empty
export const homeStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            children: [
              {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Coming Soon',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
            indent: 0,
            tag: 'h1',
            version: 1,
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                children: [
                  {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Open your dashboard',
                version: 1,
              },
            ],
            direction: 'ltr',
            fields: {
              linkType: 'custom',
              newTab: false,
              url: '/dashboard',
            },
            format: '',
            indent: 0,
            version: 2,
          },
              {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' to start building your pages and publishing updates.',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
            indent: 0,
            textFormat: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  },
  meta: {
    description: 'Your new site is warming up. Finish onboarding to launch your first page.',
    title: 'Site coming soon',
  },
  title: 'Home',
  layout: [],
}
