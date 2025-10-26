import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import PageClient from "./page.client";
import { LivePreviewListener } from "@/components/LivePreviewListener";
import { Navbar, NavbarSkeleton } from "@/modules/tenants/ui/components/navbar";
import { Footer } from "@/modules/tenants/ui/components/footer";
import { PayloadRedirects } from "@/components/PayloadRedirects";
import { RenderBlocks } from "@/blocks/RenderBlocks";
import { RenderHero } from "@/heros/RenderHero";
import { generateMeta } from "@/utilities/generateMeta";
import { homeStatic } from "@/endpoints/seed/home-static";
import type { Page, Tenant } from "@/payload-types";
import {
  getTenantCached,
  getTenantPageCached,
  tenantDataAccess,
} from "@/modules/tenants/server/tenant-data";

type PageParams = Promise<{
  tenantSlug: string;
  page?: string[];
}>;

type TenantDoc = Tenant;
type PageDoc = Page;

const getSlugFromParams = (pageSegments?: string[]) => {
  if (!pageSegments || pageSegments.length === 0) {
    return "home";
  }

  return pageSegments.map((segment) => decodeURIComponent(segment)).join("/");
};

const getUrlPath = (tenantSlug: string, slug: string) =>
  slug === "home"
    ? `/tenants/${tenantSlug}`
    : `/tenants/${tenantSlug}/${slug}`;

const resolveParams = async (params: PageParams) => {
  const { tenantSlug, page: pageSegments } = await params;
  const decodedTenantSlug = decodeURIComponent(tenantSlug);
  const slug = getSlugFromParams(pageSegments);
  const urlPath = getUrlPath(tenantSlug, slug);

  return {
    tenantSlug: decodedTenantSlug,
    slug,
    urlPath,
  };
};

export default async function TenantPage({
  params,
}: {
  params: PageParams;
}) {
  const { isEnabled: draft } = await draftMode();
  const resolved = await resolveParams(params);

  if (draft) {
    return (
      <TenantPageDraft
        slug={resolved.slug}
        tenantSlug={resolved.tenantSlug}
        urlPath={resolved.urlPath}
      />
    );
  }

  return (
    <TenantPageCached
      slug={resolved.slug}
      tenantSlug={resolved.tenantSlug}
      urlPath={resolved.urlPath}
    />
  );
}

type TenantPageShellProps = {
  slug: string;
  tenantSlug: string;
  urlPath: string;
};

async function TenantPageCached({
  slug,
  tenantSlug,
  urlPath,
}: TenantPageShellProps) {
  'use cache'

  cacheLife("tenantPages");

  const tenant = await getTenantCached(tenantSlug);

  if (!tenant) {
    notFound();
  }

  let page = await getTenantPageCached({
    slug,
    tenantId: tenant.id,
  });

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      tenant,
    } as PageDoc;
  }

  return (
    <TenantPageLayout
      draft={false}
      page={page}
      tenant={tenant}
      urlPath={urlPath}
    />
  );
}

async function TenantPageDraft({
  slug,
  tenantSlug,
  urlPath,
}: TenantPageShellProps) {
  const tenant = await tenantDataAccess.fetchTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  let page = await tenantDataAccess.fetchPageBySlug({
    draft: true,
    slug,
    tenantId: tenant.id,
  });

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      tenant,
    } as PageDoc;
  }

  return (
    <TenantPageLayout
      draft
      page={page}
      tenant={tenant}
      urlPath={urlPath}
    />
  );
}

type TenantPageLayoutProps = {
  draft: boolean;
  page: PageDoc | null;
  tenant: TenantDoc;
  urlPath: string;
};

function TenantPageLayout({
  draft,
  page,
  tenant,
  urlPath,
}: TenantPageLayoutProps) {
  if (!page) {
    return <PayloadRedirects url={urlPath} />;
  }

  const { hero, layout } = page;

  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar slug={tenant.slug} />
      </Suspense>
      <article className="pt-16 pb-24  max-w-(--breakpoint-xl) mx-auto  h-full px-4 lg:px-12">
        <PageClient />
        <PayloadRedirects disableNotFound url={urlPath} />
        {draft && <LivePreviewListener />}
        <RenderHero {...hero} />
        <RenderBlocks blocks={layout} tenant={tenant} />
      </article>
      <Footer />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { isEnabled: draft } = await draftMode();
  const resolved = await resolveParams(params);

  if (draft) {
    const tenant = await tenantDataAccess.fetchTenantBySlug(
      resolved.tenantSlug
    );

    if (!tenant) {
      notFound();
    }

    let page = await tenantDataAccess.fetchPageBySlug({
      draft: true,
      slug: resolved.slug,
      tenantId: tenant.id,
    });

    if (!page && resolved.slug === "home") {
      page = {
        ...homeStatic,
        tenant,
      } as PageDoc;
    }

    return generateMeta({ doc: page });
  }

  const tenant = await getTenantCached(resolved.tenantSlug);

  if (!tenant) {
    notFound();
  }

  let page = await getTenantPageCached({
    slug: resolved.slug,
    tenantId: tenant.id,
  });

  if (!page && resolved.slug === "home") {
    page = {
      ...homeStatic,
      tenant,
    } as PageDoc;
  }

  return generateMeta({ doc: page });
}
