import React from 'react'
import { CMSLink } from '@/components/Link'

type Plan = {
  name?: string | null
  price?: string | null
  period?: string | null
  highlight?: boolean | null
  features?: Array<{ item?: string | null }> | null
  links?: Array<{ link: any }>
}

type PricingBlockProps = {
  title?: string | null
  subtitle?: string | null
  plans?: Plan[] | null
}

export const PricingBlock: React.FC<PricingBlockProps> = ({ title, subtitle, plans }) => {
  if (!plans || plans.length === 0) return null
  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-8 md:mb-12 text-center">
          {title && <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>}
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {plans.map((p, i) => (
          <div
            key={i}
            className={
              'rounded-2xl border border-border bg-card p-6 shadow-sm ' +
              (p.highlight ? 'ring-2 ring-primary' : '')
            }
          >
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <div className="mt-2 text-4xl font-bold">{p.price}</div>
            {p.period && <div className="text-muted-foreground">{p.period}</div>}
            <ul className="mt-4 space-y-2">
              {(p.features || []).map((f, j) => (
                <li key={j} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary/60" />
                  <span>{f.item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {(p.links || []).map(({ link }, k) => (
                <CMSLink key={k} size="lg" {...link} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
