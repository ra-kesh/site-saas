import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidateTag } from "next/cache";
import { extractTenantSlug } from "@/lib/utils";

type Doc = {
  tenant?: unknown;
};

const revalidate = (doc?: Doc) => {
  revalidateTag("headers", "max");
  const slug = extractTenantSlug(doc?.tenant as any);
  if (slug) revalidateTag(`tenant:${slug}`, "max");
};

export const revalidateTenantHeader: CollectionAfterChangeHook<any> &
  CollectionAfterDeleteHook<any> = ({ doc, req: { payload, context } }) => {
  if (!context?.disableRevalidate) {
    payload.logger.info("Revalidating tenant header");
    revalidate(doc);
  }
  return doc as any;
};
