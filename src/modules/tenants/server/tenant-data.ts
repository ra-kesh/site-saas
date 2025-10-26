import type { Page, Post, Tenant } from "@/payload-types";

import configPromise from "@payload-config";
import { getPayload } from "payload";
import { cacheLife, cacheTag } from "next/cache";

async function fetchTenantBySlug(slug: string) {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "tenants",
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  return (result.docs?.[0] as Tenant | undefined) ?? null;
}

async function fetchPageBySlug({
  slug,
  tenantId,
  draft,
}: {
  slug: string;
  tenantId: string;
  draft: boolean;
}) {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
      tenant: {
        equals: tenantId,
      },
    },
  });

  return (result.docs?.[0] as Page | undefined) ?? null;
}

async function fetchPostBySlug({
  slug,
  tenantId,
  draft,
}: {
  slug: string;
  tenantId: string;
  draft: boolean;
}) {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "posts",
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
      tenant: {
        equals: tenantId,
      },
    },
  });

  return (result.docs?.[0] as Post | undefined) ?? null;
}

export async function getTenantCached(slug: string) {
  'use cache'

  cacheLife("tenantPages");
  cacheTag(`tenant:slug:${slug}`);

  const tenant = await fetchTenantBySlug(slug);

  if (tenant?.id) {
    cacheTag(`tenant:${tenant.id}`);
  }

  return tenant;
}

export async function getTenantPageCached({
  slug,
  tenantId,
}: {
  slug: string;
  tenantId: string;
}) {
  'use cache'

  cacheLife("tenantPages");
  cacheTag(`tenant:${tenantId}`);
  cacheTag(`page:${tenantId}:${slug || "home"}`);

  return fetchPageBySlug({ slug, tenantId, draft: false });
}

export async function getTenantPostCached({
  slug,
  tenantId,
}: {
  slug: string;
  tenantId: string;
}) {
  'use cache'

  cacheLife("tenantPosts");
  cacheTag(`tenant:${tenantId}`);
  cacheTag(`post:${tenantId}:${slug}`);

  return fetchPostBySlug({ slug, tenantId, draft: false });
}

export const tenantDataAccess = {
  fetchTenantBySlug,
  fetchPageBySlug,
  fetchPostBySlug,
};
