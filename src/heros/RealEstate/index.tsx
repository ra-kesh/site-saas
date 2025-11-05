"use client";

import React from "react";

import type { Page } from "@/payload-types";

import { CMSLink } from "@/components/Link";
import { Media } from "@/components/Media";
import RichText from "@/components/RichText";

const inlineAppearance = "inline";

export const RealEstateHero: React.FC<Page["hero"]> = ({
  links,
  media,
  richText,
}) => {
  const brandLink = Array.isArray(links)
    ? links.find(({ link }) => link?.appearance === inlineAppearance)
    : undefined;
  const brandLabel =
    typeof brandLink?.link?.label === "string"
      ? brandLink.link.label
      : undefined;

  const ctaLinks = Array.isArray(links)
    ? links.filter(({ link }) => link?.appearance !== inlineAppearance)
    : [];

  const hasCtas = ctaLinks.length > 0;
  const hasMedia = media && typeof media === "object";

  return (
    <section
      className="relative isolate -mt-[10.4rem] overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fcff_20%,#f0faff_55%,#ffffff_100%)]"
      data-theme="light"
    >
      <div className="container relative z-10 flex min-h-[70vh] flex-col pb-40 pt-28 md:pt-36">
        {brandLabel && (
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 md:text-sm">
            <span className="flex items-center gap-2 font-semibold tracking-tight text-slate-800 md:text-base">
              {brandLabel}
              <span aria-hidden className="h-2 w-2 rounded-full bg-slate-300" />
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 md:h-9 md:w-9 md:text-lg"
              aria-label="Open menu"
            >
              +
            </button>
          </div>
        )}

        <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center text-center">
          {richText && (
            <RichText
              className="flex flex-col gap-6 text-center [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:text-slate-900 [&_p]:mx-auto [&_p]:max-w-2xl [&_p]:text-base [&_p]:leading-7 [&_p]:text-slate-600 md:[&_h1]:text-5xl md:[&_p]:text-lg"
              data={richText}
              enableGutter={false}
              enableProse={false}
            />
          )}

          {hasCtas && (
            <ul className="mt-10 flex flex-wrap justify-center gap-3">
              {ctaLinks.map(({ link }, index) => (
                <li key={index}>
                  <CMSLink {...link} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {hasMedia && (
        <div className="relative z-0 -mt-28 flex justify-center px-4 pb-24">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/20 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.65)] backdrop-blur">
            <Media
              className="w-full"
              imgClassName="h-full w-full object-cover object-center"
              pictureClassName="block h-full w-full"
              priority
              resource={media}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white" />
          </div>
        </div>
      )}
    </section>
  );
};
