import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Tenant } from "@/payload-types";
import { generateSiteContentPath } from "@/lib/utils";

type PayloadType = Parameters<CollectionAfterChangeHook<Tenant>>[0]["req"]["payload"];

type SiteRecord = {
  slug?: string | null;
};

const revalidateAssociatedSites = async ({
  payload,
  tenantId,
}: {
  payload: PayloadType;
  tenantId?: string | null;
}) => {
  if (!tenantId || !payload) {
    return;
  }

  try {
    const sites = await payload.find({
      collection: "sites",
      depth: 0,
      limit: 100,
      pagination: false,
      where: {
        tenant: {
          equals: tenantId,
        },
      },
    });

    for (const site of sites.docs as SiteRecord[]) {
      if (!site?.slug) continue;

      const homePath = generateSiteContentPath({
        siteSlug: site.slug,
        slug: "home",
        includeSitePrefix: true,
      });

      payload.logger.info(
        `Revalidating site cache for tenant "${tenantId}" and site "${site.slug}"`
      );

      revalidatePath(homePath);
      revalidateTag(`site:${site.slug}`, "max");
    }
  } catch (error) {
    payload.logger.warn({
      err: error,
      message: `Unable to revalidate sites for tenant "${tenantId}"`,
    });
  }
};

export const revalidateTenant: CollectionAfterChangeHook<Tenant> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateTag("tenants", "max");
  revalidateTag("sites", "max");

  await revalidateAssociatedSites({
    payload,
    tenantId: doc.id,
  });

  return doc;
};

export const revalidateTenantDelete: CollectionAfterDeleteHook<Tenant> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateTag("tenants", "max");
  revalidateTag("sites", "max");

  await revalidateAssociatedSites({
    payload,
    tenantId: doc?.id,
  });

  return doc;
};
