import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type SeedCategory = {
  id: string
  title: string
}

type PostSeedArgs = {
  categories: SeedCategory[]
  tenantId: string
  tenantSlug: string
  businessName: string
  businessDescription: string
  primaryAudience: string
  primaryGoal: string
}

export const createPostSeeds = ({
  categories,
  tenantId,
  tenantSlug,
  businessName,
  businessDescription,
  primaryAudience,
  primaryGoal,
}: PostSeedArgs): Array<RequiredDataFromCollectionSlug<'posts'> & { tenant: string }> => {
  const [firstCategory, secondCategory = firstCategory] = categories
  const goalPhrase = primaryGoal.toLowerCase()

  return [
    {
      tenant: tenantId,
      title: `Why ${businessName} is launching now`,
      slug: `introducing-${tenantSlug}`,
      _status: 'published',
      categories: firstCategory ? [firstCategory.id] : [],
      content: createRichText([
        createHeadingNode('h2', [
          createTextNode(`Helping ${primaryAudience.toLowerCase()} ${goalPhrase}`),
        ]),
        createParagraphNode([
          createTextNode(
            businessDescription,
          ),
        ]),
        createHeadingNode('h3', [createTextNode('What you can expect next')]),
        createParagraphNode([
          createTextNode(
            `Over the next few weeks we’re rolling out fresh blocks, sample copy, and launch checklists so you can ${goalPhrase} without slowing down your team.`,
          ),
        ]),
      ]),
      meta: {
        title: `Why ${businessName} is launching now`,
        description: `What ${businessName} offers ${primaryAudience.toLowerCase()} and how we’ll help you ${goalPhrase}.`,
      },
    },
    {
      tenant: tenantId,
      title: `Inside the ${businessName} build process`,
      slug: `inside-${tenantSlug}-build`,
      _status: 'published',
      categories: secondCategory ? [secondCategory.id] : [],
      content: createRichText([
        createHeadingNode('h2', [createTextNode('Structured content without friction')]),
        createParagraphNode([
          createTextNode(
            `Our team is using a library of blocks and automation to keep content fresh. You’ll see process updates here each time we improve the experience for ${primaryAudience.toLowerCase()}.`,
          ),
        ]),
        createHeadingNode('h3', [createTextNode('What happens after launch')]),
        createParagraphNode([
          createTextNode(
            `After we ship the initial draft, we’ll publish guides on extending components, managing content, and measuring results once you ${goalPhrase}.`,
          ),
        ]),
      ]),
      meta: {
        title: `Inside the ${businessName} build process`,
        description: `How ${businessName} plans, edits, and publishes updates for ${primaryAudience.toLowerCase()}.`,
      },
    },
  ]
}
