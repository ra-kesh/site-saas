import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Post } from "../../../payload-types";
import { extractTenantSlug } from "@/lib/utils";

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

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === "published") {
      const path = `/posts/${doc.slug}`;

      payload.logger.info(`Revalidating post at path: ${path}`);

      revalidatePath(path);
      revalidateTag("posts-sitemap", "max");
      revalidateTag("posts", "max");
      revalidateTag("tenants", "max");
      revalidateTenantPostTags({ doc, slug: doc.slug });
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === "published" && doc._status !== "published") {
      const oldPath = `/posts/${previousDoc.slug}`;

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
    const path = `/posts/${doc?.slug}`;

    revalidatePath(path);
    revalidateTag("posts-sitemap", "max");
    revalidateTag("posts", "max");
    revalidateTag("tenants", "max");
    revalidateTenantPostTags({ doc, slug: doc?.slug });
  }

  return doc;
};
