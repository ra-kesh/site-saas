import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Post } from "../../../payload-types";
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

const revalidateSitePostTags = ({
  doc,
  slug,
}: {
  doc?: Post | null;
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
      revalidateTag(`site:${siteSlug}:post:${slug}`, "max");
    }
  }
};

const getPostPath = (doc?: Post | null) => {
  const siteRelation = doc?.site as SiteReference | undefined;
  const siteSlug =
    (siteRelation ? extractSiteSlug(siteRelation as SiteReference) : undefined) ??
    extractTenantSlug(resolveLegacyTenant(doc));
  const slugValue = Array.isArray(doc?.slug)
    ? doc?.slug.filter(Boolean).join("/")
    : doc?.slug;

  return generateSiteContentPath({
    collection: "posts",
    slug: slugValue,
    siteSlug,
    includeSitePrefix: true,
  });
};

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === "published") {
      const path = getPostPath(doc);

      payload.logger.info(`Revalidating post at path: ${path}`);

      revalidatePath(path);
      revalidateTag("posts-sitemap", "max");
      revalidateTag("posts", "max");
      revalidateTag("sites", "max");
      revalidateSitePostTags({ doc, slug: doc.slug });
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === "published" && doc._status !== "published") {
      const oldPath = getPostPath(previousDoc);

      payload.logger.info(`Revalidating old post at path: ${oldPath}`);

      revalidatePath(oldPath);
      revalidateTag("posts-sitemap", "max");
      revalidateTag("posts", "max");
      revalidateTag("sites", "max");
      revalidateSitePostTags({ doc: previousDoc, slug: previousDoc.slug });
    }
  }
  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = getPostPath(doc);

    revalidatePath(path);
    revalidateTag("posts-sitemap", "max");
    revalidateTag("posts", "max");
    revalidateTag("sites", "max");
    revalidateSitePostTags({ doc, slug: doc?.slug });
  }

  return doc;
};
