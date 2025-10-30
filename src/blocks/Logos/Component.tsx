import React from 'react'
import { Media } from '@/components/Media'

type LogosBlockProps = {
  title?: string | null
  items?: Array<{ logo?: unknown; alt?: string | null }> | null
}

export const LogosBlock: React.FC<LogosBlockProps> = ({ title, items }) => {
  return (
    <div>
      {title && (
        <div className="mb-8 md:mb-10">
          <h3 className="text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
        </div>
      )}
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 items-center">
        {(items || []).map(({ logo, alt }: any, i: number) => (
          <li key={i} className="flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
            {logo && typeof logo === 'object' && (
              <Media resource={logo as any} imgClassName="max-h-8 w-auto object-contain grayscale" alt={alt || ''} />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
