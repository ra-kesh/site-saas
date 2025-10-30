import React from 'react'

type StatsBlockProps = {
  title?: string | null
  items?: Array<{ value?: string | null; label?: string | null }> | null
}

export const StatsBlock: React.FC<StatsBlockProps> = ({ title, items }) => {
  return (
    <div>
      {title && (
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
        </div>
      )}
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {(items || []).map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card/50 p-4 md:p-6 text-center shadow-sm"
          >
            <dt className="text-muted-foreground text-sm">{stat.label}</dt>
            <dd className="text-3xl md:text-4xl font-bold mt-1">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )}
