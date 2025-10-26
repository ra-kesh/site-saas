import type { Config, Page, Post } from "@/payload-types";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { cacheLife, cacheTag } from "next/cache";
import { extractTenantId, extractTenantSlug } from "@/lib/utils";

type CollectionKeys = keyof Config["collections"];
type Collection = [CollectionKeys] extends [never]
  ? string
  : Extract<CollectionKeys, string>;

async function getDocument(collection: Collection, slug: string, depth = 0) {
  const payload = await getPayload({ config: configPromise });

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  return page.docs[0];
}

type SupportedDoc = Page | Post | null | undefined;

const applyCacheTagsForDocument = (
  collection: Collection,
  document: SupportedDoc
) => {
  if (!document) {
    return;
  }

  const tenantId = extractTenantId((document as Page | Post).tenant);
  const tenantSlug = extractTenantSlug((document as Page | Post).tenant);

  if (tenantSlug) {
    cacheTag(`tenant:slug:${tenantSlug}`);
  }

  if (tenantId) {
    cacheTag(`tenant:${tenantId}`);

    if (collection === "pages") {
      const slug =
        typeof (document as Page).slug === "string" &&
        (document as Page).slug.trim().length > 0
          ? (document as Page).slug
          : "home";
      cacheTag(`page:${tenantId}:${slug}`);
    }

    if (collection === "posts" && typeof (document as Post).slug === "string") {
      cacheTag(`post:${tenantId}:${(document as Post).slug}`);
    }
  }
};

export const getCachedDocument =
  (collection: Collection, slug: string) => async () => {
    'use cache'

    if (collection === "posts") {
      cacheLife("tenantPosts");
    } else {
      cacheLife("tenantPages");
    }

    cacheTag(`doc:${collection}:${slug}`);

    const document = (await getDocument(
      collection,
      slug
    )) as SupportedDoc;

    applyCacheTagsForDocument(collection, document);

    return document;
  };
