import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import PageClient from "./page.client";
import { LivePreviewListener } from "@/components/LivePreviewListener";
import { Navbar } from "@/modules/tenants/ui/components/navbar";
import { Footer } from "@/modules/tenants/ui/components/footer";
import { PayloadRedirects } from "@/components/PayloadRedirects";
import { RenderBlocks } from "@/blocks/RenderBlocks";
import { RenderHero } from "@/heros/RenderHero";
import { generateMeta } from "@/utilities/generateMeta";
import { homeStatic } from "@/endpoints/seed/home-static";
import type { Page } from "@/payload-types";
import { getTenantPage } from "@/modules/tenants/data/getTenantPage";

type PageParams = Promise<{
  tenantSlug: string;
  page?: string[];
}>;

type PageDoc = Page;

export const dynamic = "force-static";

const getSlugFromParams = (pageSegments?: string[]) => {
  if (!pageSegments || pageSegments.length === 0) {
    return "home";
  }

  return pageSegments.join("/");
};

export default async function TenantPage({ params }: { params: PageParams }) {
  const { isEnabled: draft } = await draftMode();
  const { tenantSlug, page: pageSegments } = await params;

  const decodedTenantSlug = decodeURIComponent(tenantSlug);
  const slug = decodeURIComponent(getSlugFromParams(pageSegments));

  const { tenant, page: fetchedPage } = await getTenantPage({
    draft,
    pageSlug: slug,
    tenantSlug: decodedTenantSlug,
  });

  if (!tenant) {
    notFound();
  }
  const tenantDoc = tenant;

  const urlPath =
    slug === "home"
      ? `/tenants/${tenantSlug}`
      : `/tenants/${tenantSlug}/${slug}`;

  let page = fetchedPage;

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      tenant: tenantDoc,
    } as PageDoc;
  }

  if (!page) {
    return <PayloadRedirects url={urlPath} />;
  }

  const { hero, layout } = page;

  return (
    <>
      <Navbar tenant={tenantDoc} />
      <article className="pt-16 pb-24  max-w-(--breakpoint-xl) mx-auto  h-full px-4 lg:px-12">
        <PageClient />
        <PayloadRedirects disableNotFound url={urlPath} />
        {draft && <LivePreviewListener />}
        <RenderHero {...hero} />
        <RenderBlocks blocks={layout} tenant={tenantDoc} />
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
  const { tenantSlug, page: pageSegments } = await params;
  const { isEnabled: draft } = await draftMode();

  const slug = decodeURIComponent(getSlugFromParams(pageSegments));
  const decodedTenantSlug = decodeURIComponent(tenantSlug);
  const { tenant, page: fetchedPage } = await getTenantPage({
    draft,
    pageSlug: slug,
    tenantSlug: decodedTenantSlug,
  });

  if (!tenant) {
    notFound();
  }
  const tenantDoc = tenant;

  let page = fetchedPage;

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      tenant: tenantDoc,
    } as PageDoc;
  }

  return generateMeta({ doc: page });
}
