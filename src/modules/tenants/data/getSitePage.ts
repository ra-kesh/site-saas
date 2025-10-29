import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import configPromise from "@payload-config";

import type { Page, Site, Tenant } from "@/payload-types";

type SitePageResult = {
  page: Page | null;
  site: Site | null;
  tenant: Tenant | null;
};

type SitePageArgs = {
  draft: boolean;
  pageSlug: string;
  siteSlug: string;
};

const resolveTenant = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  tenantField: Tenant | string | null | undefined
) => {
  if (!tenantField) {
    return null;
  }

  if (typeof tenantField === "string") {
    try {
      const tenant = await payload.findByID({
        collection: "tenants",
        depth: 1,
        id: tenantField,
      });

      return (tenant as Tenant | undefined) ?? null;
    } catch {
      return null;
    }
  }

  return tenantField;
};

const fetchSitePage = async ({
  draft,
  pageSlug,
  siteSlug,
}: SitePageArgs): Promise<SitePageResult> => {
  const payload = await getPayload({ config: configPromise });

  const siteResult = await payload.find({
    collection: "sites",
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: siteSlug,
      },
    },
  });

  const site = (siteResult.docs?.[0] as Site | undefined) ?? null;

  if (!site) {
    return { page: null, site: null, tenant: null };
  }

  const tenant = await resolveTenant(payload, site.tenant);

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
      site: {
        equals: site.id,
      },
    },
  });

  const page = (pageResult.docs?.[0] as Page | undefined) ?? null;

  return { page, site, tenant };
};

const getPublishedSitePage = ({
  pageSlug,
  siteSlug,
}: Omit<SitePageArgs, "draft">) =>
  unstable_cache(
    () =>
      fetchSitePage({
        draft: false,
        pageSlug,
        siteSlug,
      }),
    ["site-page", siteSlug, pageSlug],
    {
      revalidate: false,
      tags: [
        "sites",
        "pages",
        `site:${siteSlug}`,
        `site:${siteSlug}:page:${pageSlug}`,
      ],
    }
  )();

export const getSitePage = async ({
  draft,
  pageSlug,
  siteSlug,
}: SitePageArgs): Promise<SitePageResult> => {
  if (draft) {
    return fetchSitePage({ draft, pageSlug, siteSlug });
  }

  return getPublishedSitePage({ pageSlug, siteSlug });
};
