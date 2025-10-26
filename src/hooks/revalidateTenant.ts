import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Tenant } from "@/payload-types";
import { generateTenantContentPath } from "@/lib/utils";

const revalidateTenantSlug = ({
  payload,
  slug,
}: {
  payload: Parameters<CollectionAfterChangeHook<Tenant>>[0]["req"]["payload"];
  slug?: string | null;
}) => {
  if (!slug) return;

  const homePath = generateTenantContentPath({
    tenantSlug: slug,
    slug: "home",
    includeTenantPrefix: true,
  });

  payload.logger.info(`Revalidating tenant cache for slug: ${slug}`);

  revalidatePath(homePath);
  revalidateTag(`tenant:${slug}`, "max");
};

export const revalidateTenant: CollectionAfterChangeHook<Tenant> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateTag("tenants", "max");

  revalidateTenantSlug({ payload, slug: doc.slug });

  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidateTenantSlug({ payload, slug: previousDoc.slug });
  }

  return doc;
};

export const revalidateTenantDelete: CollectionAfterDeleteHook<Tenant> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateTag("tenants", "max");
  revalidateTenantSlug({ payload, slug: doc?.slug });

  return doc;
};
