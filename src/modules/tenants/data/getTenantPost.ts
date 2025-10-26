import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import configPromise from "@payload-config";

import type { Post, Tenant } from "@/payload-types";

type TenantPostResult = {
  post: Post | null;
  tenant: Tenant | null;
};

type TenantPostArgs = {
  draft: boolean;
  postSlug: string;
  tenantSlug: string;
};

const fetchTenantPost = async ({
  draft,
  postSlug,
  tenantSlug,
}: TenantPostArgs): Promise<TenantPostResult> => {
  const payload = await getPayload({ config: configPromise });

  const tenantResult = await payload.find({
    collection: "tenants",
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: tenantSlug,
      },
    },
  });

  const tenant = (tenantResult.docs?.[0] as Tenant | undefined) ?? null;

  if (!tenant) {
    return { post: null, tenant: null };
  }

  const postResult = await payload.find({
    collection: "posts",
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: postSlug,
      },
      tenant: {
        equals: tenant.id,
      },
    },
  });

  const post = (postResult.docs?.[0] as Post | undefined) ?? null;

  return { post, tenant };
};

const getPublishedTenantPost = ({
  postSlug,
  tenantSlug,
}: Omit<TenantPostArgs, "draft">) =>
  unstable_cache(
    () =>
      fetchTenantPost({
        draft: false,
        postSlug,
        tenantSlug,
      }),
    ["tenant-post", tenantSlug, postSlug],
    {
      revalidate: 60,
      tags: [
        "tenants",
        "posts",
        `tenant:${tenantSlug}`,
        `tenant:${tenantSlug}:post:${postSlug}`,
      ],
    }
  )();

export const getTenantPost = async ({
  draft,
  postSlug,
  tenantSlug,
}: TenantPostArgs): Promise<TenantPostResult> => {
  if (draft) {
    return fetchTenantPost({ draft, postSlug, tenantSlug });
  }

  return getPublishedTenantPost({ postSlug, tenantSlug });
};
