import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import configPromise from "@payload-config";

import type { Page, Tenant } from "@/payload-types";

type TenantPageResult = {
  page: Page | null;
  tenant: Tenant | null;
};

type TenantPageArgs = {
  draft: boolean;
  pageSlug: string;
  tenantSlug: string;
};

const fetchTenantPage = async ({
  draft,
  pageSlug,
  tenantSlug,
}: TenantPageArgs): Promise<TenantPageResult> => {
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
    return { page: null, tenant: null };
  }

  const pageResult = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: pageSlug,
      },
      tenant: {
        equals: tenant.id,
      },
    },
  });

  const page = (pageResult.docs?.[0] as Page | undefined) ?? null;

  return { page, tenant };
};

const getPublishedTenantPage = ({
  pageSlug,
  tenantSlug,
}: Omit<TenantPageArgs, "draft">) =>
  unstable_cache(
    () =>
      fetchTenantPage({
        draft: false,
        pageSlug,
        tenantSlug,
      }),
    ["tenant-page", tenantSlug, pageSlug],
    {
      revalidate: false,
      tags: [
        "tenants",
        "pages",
        `tenant:${tenantSlug}`,
        `tenant:${tenantSlug}:page:${pageSlug}`,
      ],
    }
  )();

export const getTenantPage = async ({
  draft,
  pageSlug,
  tenantSlug,
}: TenantPageArgs): Promise<TenantPageResult> => {
  if (draft) {
    return fetchTenantPage({ draft, pageSlug, tenantSlug });
  }

  return getPublishedTenantPage({ pageSlug, tenantSlug });
};
