import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Page } from "../../../payload-types";
import { extractTenantSlug, generateTenantContentPath } from "@/lib/utils";

const revalidateTenantTags = ({
  doc,
  slug,
}: {
  doc?: Page | null;
  slug?: string | null;
}) => {
  if (!doc) return;

  const tenantSlug = extractTenantSlug(doc.tenant ?? undefined);

  if (tenantSlug) {
    revalidateTag(`tenant:${tenantSlug}`, "max");
    if (slug) {
      revalidateTag(`tenant:${tenantSlug}:page:${slug}`, "max");
    }
  }
};

const getPagePath = (doc?: Page | null) => {
  const tenantSlug = extractTenantSlug(doc?.tenant ?? undefined);
  const slugValue = Array.isArray(doc?.slug)
    ? doc?.slug.filter(Boolean).join("/")
    : doc?.slug;

  return generateTenantContentPath({
    collection: "pages",
    slug: slugValue,
    tenantSlug,
    includeTenantPrefix: true,
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
      revalidateTag("tenants", "max");
      revalidateTenantTags({ doc, slug: doc.slug });
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === "published" && doc._status !== "published") {
      const oldPath = getPagePath(previousDoc);

      payload.logger.info(`Revalidating old page at path: ${oldPath}`);

      revalidatePath(oldPath);
      revalidateTag("pages-sitemap", "max");
      revalidateTag("pages", "max");
      revalidateTag("tenants", "max");
      revalidateTenantTags({ doc: previousDoc, slug: previousDoc.slug });
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
    revalidateTag("tenants", "max");
    revalidateTenantTags({ doc, slug: doc?.slug });
  }

  return doc;
};
