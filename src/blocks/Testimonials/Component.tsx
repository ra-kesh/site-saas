import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import RichText from '@/components/RichText'

type Testimonial = {
  quote?: DefaultTypedEditorState | null
  authorName?: string | null
  authorTitle?: string | null
}

type TestimonialsBlockProps = {
  title?: string | null
  items?: Testimonial[] | null
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({ title, items }) => {
  if (!items || items.length === 0) return null
  return (
    <div>
      {title && (
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {items.map((t, i) => (
          <figure key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            {t.quote && <RichText data={t.quote} enableGutter={false} />}
            <figcaption className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t.authorName}</span>
              {t.authorTitle && <span> — {t.authorTitle}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
