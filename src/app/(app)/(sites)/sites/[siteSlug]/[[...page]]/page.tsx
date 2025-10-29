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
import { generateSiteContentPath } from "@/lib/utils";
import { getSitePage } from "@/modules/tenants/data/getSitePage";

type PageParams = Promise<{
  siteSlug: string;
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

export default async function SitePage({ params }: { params: PageParams }) {
  const { isEnabled: draft } = await draftMode();
  const { siteSlug, page: pageSegments } = await params;

  const decodedSiteSlug = decodeURIComponent(siteSlug);
  const slug = decodeURIComponent(getSlugFromParams(pageSegments));

  const { site, tenant, page: fetchedPage } = await getSitePage({
    draft,
    pageSlug: slug,
    siteSlug: decodedSiteSlug,
  });

  if (!site) {
    notFound();
  }

  const tenantDoc = tenant ?? undefined;

  const urlPath = generateSiteContentPath({
    collection: "pages",
    slug,
    siteSlug: decodedSiteSlug,
    includeSitePrefix: true,
  });

  let page = fetchedPage;

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      site,
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
        <RenderBlocks
          blocks={layout}
          site={page.site ?? site}
          tenant={tenantDoc}
        />
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
  const { siteSlug, page: pageSegments } = await params;
  const { isEnabled: draft } = await draftMode();

  const slug = decodeURIComponent(getSlugFromParams(pageSegments));
  const decodedSiteSlug = decodeURIComponent(siteSlug);
  const { site, page: fetchedPage } = await getSitePage({
    draft,
    pageSlug: slug,
    siteSlug: decodedSiteSlug,
  });

  if (!site) {
    notFound();
  }

  let page = fetchedPage;

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      site,
    } as PageDoc;
  }

  return generateMeta({ doc: page });
}
