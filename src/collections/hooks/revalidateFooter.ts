import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidateTag } from "next/cache";
import { extractTenantSlug } from "@/lib/utils";

type Doc = {
  tenant?: unknown;
};

const revalidate = (doc?: Doc) => {
  revalidateTag("footers", "max");
  const slug = extractTenantSlug(doc?.tenant as any);
  if (slug) revalidateTag(`tenant:${slug}`, "max");
};

export const revalidateTenantFooter: CollectionAfterChangeHook<any> &
  CollectionAfterDeleteHook<any> = ({ doc, req: { payload, context } }) => {
  if (!context?.disableRevalidate) {
    payload.logger.info("Revalidating tenant footer");
    revalidate(doc);
  }
  return doc as any;
};
