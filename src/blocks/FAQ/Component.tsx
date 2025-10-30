import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import RichText from '@/components/RichText'

type FAQItem = { question?: string | null; answer?: DefaultTypedEditorState | null }
type FAQBlockProps = { title?: string | null; items?: FAQItem[] | null }

export const FAQBlock: React.FC<FAQBlockProps> = ({ title, items }) => {
  if (!items || items.length === 0) return null
  return (
    <div>
      {title && <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">{title}</h2>}
      <Accordion type="single" collapsible className="w-full">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{it.question}</AccordionTrigger>
            <AccordionContent>
              {it.answer && <RichText data={it.answer} enableGutter={false} />}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
