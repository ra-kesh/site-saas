import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Post } from "../../../payload-types";
import {
  extractTenantId,
  extractTenantSlug,
  generateTenantContentPath,
} from "@/lib/utils";

const normalizePostSlug = (slug: Post["slug"]): string => {
  if (typeof slug === "string" && slug.trim().length > 0) {
    return slug;
  }

  return "post";
};

const revalidateForPost = (
  payloadLogger: { info: (message: string) => void },
  doc?: Post | null
) => {
  if (!doc) {
    return;
  }

  const tenantId = extractTenantId(doc.tenant);
  const tenantSlug = extractTenantSlug(doc.tenant);
  const slug = normalizePostSlug(doc.slug);

  const path = generateTenantContentPath({
    collection: "posts",
    slug,
    tenantSlug,
    includeTenantPrefix: true,
  });

  payloadLogger.info(`Revalidating post at path: ${path}`);

  revalidatePath(path);
  revalidateTag("posts-sitemap", "max");
  revalidateTag(`doc:posts:${slug}`, "max");

  if (tenantSlug) {
    revalidateTag(`tenant:slug:${tenantSlug}`, "max");
  }

  if (tenantId) {
    revalidateTag(`tenant:${tenantId}`, "max");
    revalidateTag(`post:${tenantId}:${slug}`, "max");
  }
};

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  if (doc._status === "published") {
    revalidateForPost(payload.logger, doc);
  }

  if (previousDoc?._status === "published" && doc._status !== "published") {
    revalidateForPost(payload.logger, previousDoc);
  }

  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateForPost(payload.logger, doc ?? undefined);

  return doc;
};
