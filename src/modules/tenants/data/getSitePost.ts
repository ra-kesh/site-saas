import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import configPromise from "@payload-config";

import type { Post, Site, Tenant } from "@/payload-types";

type SitePostResult = {
  post: Post | null;
  site: Site | null;
  tenant: Tenant | null;
};

type SitePostArgs = {
  draft: boolean;
  postSlug: string;
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

const fetchSitePost = async ({
  draft,
  postSlug,
  siteSlug,
}: SitePostArgs): Promise<SitePostResult> => {
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
    return { post: null, site: null, tenant: null };
  }

  const tenant = await resolveTenant(payload, site.tenant);

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
      site: {
        equals: site.id,
      },
    },
  });

  const post = (postResult.docs?.[0] as Post | undefined) ?? null;

  return { post, site, tenant };
};

const getPublishedSitePost = ({
  postSlug,
  siteSlug,
}: Omit<SitePostArgs, "draft">) =>
  unstable_cache(
    () =>
      fetchSitePost({
        draft: false,
        postSlug,
        siteSlug,
      }),
    ["site-post", siteSlug, postSlug],
    {
      revalidate: false,
      tags: [
        "sites",
        "posts",
        `site:${siteSlug}`,
        `site:${siteSlug}:post:${postSlug}`,
      ],
    }
  )();

export const getSitePost = async ({
  draft,
  postSlug,
  siteSlug,
}: SitePostArgs): Promise<SitePostResult> => {
  if (draft) {
    return fetchSitePost({ draft, postSlug, siteSlug });
  }

  return getPublishedSitePost({ postSlug, siteSlug });
};
