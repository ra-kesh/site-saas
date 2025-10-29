import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Page } from "../../../payload-types";
import {
  extractSiteSlug,
  extractTenantSlug,
  generateSiteContentPath,
  type SiteReference,
  type TenantReference,
} from "@/lib/utils";

const resolveLegacyTenant = (doc: unknown): TenantReference => {
  if (doc && typeof doc === "object" && "tenant" in doc) {
    return (doc as { tenant?: TenantReference }).tenant as TenantReference;
  }

  return undefined;
};

const revalidateSiteTags = ({
  doc,
  slug,
}: {
  doc?: Page | null;
  slug?: string | null;
}) => {
  if (!doc) return;

  const siteRelation = doc?.site as SiteReference | undefined;
  const siteSlug =
    (siteRelation ? extractSiteSlug(siteRelation as SiteReference) : undefined) ??
    extractTenantSlug(resolveLegacyTenant(doc));

  if (siteSlug) {
    revalidateTag(`site:${siteSlug}`, "max");
    if (slug) {
      revalidateTag(`site:${siteSlug}:page:${slug}`, "max");
    }
  }
};

const getPagePath = (doc?: Page | null) => {
  const siteRelation = doc?.site as SiteReference | undefined;
  const siteSlug =
    (siteRelation ? extractSiteSlug(siteRelation as SiteReference) : undefined) ??
    extractTenantSlug(resolveLegacyTenant(doc));
  const slugValue = Array.isArray(doc?.slug)
    ? doc?.slug.filter(Boolean).join("/")
    : doc?.slug;

  return generateSiteContentPath({
    collection: "pages",
    slug: slugValue,
    siteSlug,
    includeSitePrefix: true,
  });
};

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === "published") {
      const path = getPagePath(doc);

      payload.logger.info(`Revalidating page at path: ${path}`);

      revalidatePath(path);
      revalidateTag("pages-sitemap", "max");
      revalidateTag("pages", "max");
      revalidateTag("sites", "max");
      revalidateSiteTags({ doc, slug: doc.slug });
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === "published" && doc._status !== "published") {
      const oldPath = getPagePath(previousDoc);

      payload.logger.info(`Revalidating old page at path: ${oldPath}`);

      revalidatePath(oldPath);
      revalidateTag("pages-sitemap", "max");
      revalidateTag("pages", "max");
      revalidateTag("sites", "max");
      revalidateSiteTags({ doc: previousDoc, slug: previousDoc.slug });
    }
  }
  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = getPagePath(doc);
    revalidatePath(path);
    revalidateTag("pages-sitemap", "max");
    revalidateTag("pages", "max");
    revalidateTag("sites", "max");
    revalidateSiteTags({ doc, slug: doc?.slug });
  }

  return doc;
};
