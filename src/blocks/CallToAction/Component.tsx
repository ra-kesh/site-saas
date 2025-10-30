import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText }) => {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-6 md:p-8 flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
      <div className="max-w-[48rem] flex items-center">
        {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {(links || []).map(({ link }, i) => {
          return <CMSLink key={i} size="lg" {...link} />
        })}
      </div>
    </div>
  )
}
