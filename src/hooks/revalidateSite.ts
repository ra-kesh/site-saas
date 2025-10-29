import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import { generateSiteContentPath } from "@/lib/utils";

type SiteDocument = {
  id: string;
  slug?: string | null;
};

const revalidateSiteSlug = ({
  payload,
  slug,
}: {
  payload: Parameters<CollectionAfterChangeHook<SiteDocument>>[0]["req"]["payload"];
  slug?: string | null;
}) => {
  if (!slug) return;

  const homePath = generateSiteContentPath({
    siteSlug: slug,
    slug: "home",
    includeSitePrefix: true,
  });

  payload.logger.info(`Revalidating site cache for slug: ${slug}`);

  revalidatePath(homePath);
  revalidateTag(`site:${slug}`, "max");
};

export const revalidateSite: CollectionAfterChangeHook<SiteDocument> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateTag("sites", "max");

  revalidateSiteSlug({ payload, slug: doc.slug });

  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidateSiteSlug({ payload, slug: previousDoc.slug });
  }

  return doc;
};

export const revalidateSiteDelete: CollectionAfterDeleteHook<SiteDocument> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc;
  }

  revalidateTag("sites", "max");
  revalidateSiteSlug({ payload, slug: doc?.slug });

  return doc;
};
