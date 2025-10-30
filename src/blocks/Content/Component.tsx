import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '../../components/Link'

export const ContentBlock: React.FC<ContentBlockProps> = (props) => {
  const { columns } = props

  // Tailwind cannot detect dynamic class names in production.
  // Use explicit static class strings so they are preserved by the compiler.
  type ColumnSize = 'full' | 'half' | 'oneThird' | 'twoThirds'
  const colSpanLgMap: Record<ColumnSize, string> = {
    full: 'lg:col-span-12',
    half: 'lg:col-span-6',
    oneThird: 'lg:col-span-4',
    twoThirds: 'lg:col-span-8',
  }

  return (
    <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
      {columns &&
        columns.length > 0 &&
        columns.map((col, index) => {
          const { enableLink, link, richText, size } = col

          const baseCols = size === 'full' ? 'col-span-4' : 'col-span-4 md:col-span-2'
          const lgCols = colSpanLgMap[(size ?? 'oneThird') as ColumnSize]

          return (
            <div className={cn(baseCols, lgCols)} key={index}>
              {richText && <RichText data={richText} enableGutter={false} />}

              {enableLink && <CMSLink {...link} />}
            </div>
          )
        })}
    </div>
  )
}
