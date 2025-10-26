import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Page } from "../../../payload-types";
import {
  extractTenantId,
  extractTenantSlug,
  generateTenantContentPath,
} from "@/lib/utils";

const normalizePageSlug = (slug: Page["slug"]): string => {
  if (typeof slug === "string" && slug.trim().length > 0) {
    return slug;
  }

  if (Array.isArray(slug)) {
    return slug
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join("/");
  }

  return "home";
};

const revalidateForPage = (
  payloadLogger: { info: (message: string) => void },
  doc?: Page | null
) => {
  if (!doc) {
    return;
  }

  const tenantId = extractTenantId(doc.tenant);
  const tenantSlug = extractTenantSlug(doc.tenant);
  const slug = normalizePageSlug(doc.slug);
  const cacheSlug = slug || "home";

  const path = generateTenantContentPath({
    slug,
    tenantSlug,
    includeTenantPrefix: true,
  });

  payloadLogger.info(`Revalidating page at path: ${path}`);

  revalidatePath(path);
  revalidateTag("pages-sitemap", "max");
  revalidateTag(`doc:pages:${cacheSlug}`, "max");

  if (tenantSlug) {
    revalidateTag(`tenant:slug:${tenantSlug}`, "max");
  }

  if (tenantId) {
    revalidateTag(`tenant:${tenantId}`, "max");
    revalidateTag(`page:${tenantId}:${cacheSlug}`, "max");
  }
};

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  if (doc._status === "published") {
    revalidateForPage(payload.logger, doc);
  }

  if (previousDoc?._status === "published" && doc._status !== "published") {
    revalidateForPage(payload.logger, previousDoc);
  }

  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateForPage(payload.logger, doc ?? undefined);

  return doc;
};
