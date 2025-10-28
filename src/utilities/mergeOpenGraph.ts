import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Sites of Puri'
const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
  'Launch your tenant-ready marketing site with reusable blocks and live previews.'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: APP_TAGLINE,
  images: [
    {
      url: `${getServerSideURL()}/website-template-OG.webp`,
    },
  ],
  siteName: APP_NAME,
  title: APP_NAME,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
