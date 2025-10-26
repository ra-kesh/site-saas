import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Post } from "../../../payload-types";
import { extractTenantSlug, generateTenantContentPath } from "@/lib/utils";

const revalidateTenantPostTags = ({
  doc,
  slug,
}: {
  doc?: Post | null;
  slug?: string | null;
}) => {
  if (!doc) return;

  const tenantSlug = extractTenantSlug(doc.tenant ?? undefined);

  if (tenantSlug) {
    revalidateTag(`tenant:${tenantSlug}`, "max");
    if (slug) {
      revalidateTag(`tenant:${tenantSlug}:post:${slug}`, "max");
    }
  }
};

const getPostPath = (doc?: Post | null) => {
  const tenantSlug = extractTenantSlug(doc?.tenant ?? undefined);
  const slugValue = Array.isArray(doc?.slug)
    ? doc?.slug.filter(Boolean).join("/")
    : doc?.slug;

  return generateTenantContentPath({
    collection: "posts",
    slug: slugValue,
    tenantSlug,
    includeTenantPrefix: true,
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
      revalidateTag("tenants", "max");
      revalidateTenantPostTags({ doc, slug: doc.slug });
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === "published" && doc._status !== "published") {
      const oldPath = getPostPath(previousDoc);

      payload.logger.info(`Revalidating old post at path: ${oldPath}`);

      revalidatePath(oldPath);
      revalidateTag("posts-sitemap", "max");
      revalidateTag("posts", "max");
      revalidateTag("tenants", "max");
      revalidateTenantPostTags({ doc: previousDoc, slug: previousDoc.slug });
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
    revalidateTag("tenants", "max");
    revalidateTenantPostTags({ doc, slug: doc?.slug });
  }

  return doc;
};
