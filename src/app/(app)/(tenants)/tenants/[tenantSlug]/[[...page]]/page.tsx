import type { Metadata } from "next";
import { cache } from "react";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload, type RequiredDataFromCollectionSlug } from "payload";

import configPromise from "@payload-config";

import PageClient from "./page.client";
import { LivePreviewListener } from "@/components/LivePreviewListener";
import { Navbar } from "@/modules/tenants/ui/components/navbar";
import { Footer } from "@/modules/tenants/ui/components/footer";
import { PayloadRedirects } from "@/components/PayloadRedirects";
import { RenderBlocks } from "@/blocks/RenderBlocks";
import { RenderHero } from "@/heros/RenderHero";
import { generateMeta } from "@/utilities/generateMeta";
import { homeStatic } from "@/endpoints/seed/home-static";

type PageParams = Promise<{
  tenantSlug: string;
  page?: string[];
}>;

type TenantDoc = RequiredDataFromCollectionSlug<"tenants">;
type PageDoc = RequiredDataFromCollectionSlug<"pages">;

export const dynamic = "force-dynamic";

const queryTenant = cache(async (slug: string) => {
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

  return result.docs[0] as TenantDoc | undefined;
});

const queryPage = cache(
  async ({
    draft,
    slug,
    tenantId,
  }: {
    draft: boolean;
    slug: string;
    tenantId: string;
  }) => {
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

    return (result.docs[0] as PageDoc | undefined) ?? null;
  }
);

const getSlugFromParams = (pageSegments?: string[]) => {
  if (!pageSegments || pageSegments.length === 0) {
    return "home";
  }

  return pageSegments.join("/");
};

export default async function TenantPage({ params }: { params: PageParams }) {
  const { isEnabled: draft } = await draftMode();
  const { tenantSlug, page: pageSegments } = await params;

  const tenant = await queryTenant(decodeURIComponent(tenantSlug));

  if (!tenant) {
    notFound();
  }

  const slug = decodeURIComponent(getSlugFromParams(pageSegments));
  const urlPath =
    slug === "home"
      ? `/tenants/${tenantSlug}`
      : `/tenants/${tenantSlug}/${slug}`;

  let page = await queryPage({
    draft,
    slug,
    tenantId: tenant.id,
  });

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      tenant,
    } as PageDoc;
  }

  if (!page) {
    return <PayloadRedirects url={urlPath} />;
  }

  const { hero, layout } = page;

  return (
    <>
      <Navbar slug={tenant.slug} />
      <article className="pt-16 pb-24">
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
  const { tenantSlug, page: pageSegments } = await params;
  const tenant = await queryTenant(decodeURIComponent(tenantSlug));

  if (!tenant) {
    return {};
  }

  const slug = decodeURIComponent(getSlugFromParams(pageSegments));
  let page = await queryPage({
    draft,
    slug,
    tenantId: tenant.id,
  });

  if (!page && slug === "home") {
    page = {
      ...homeStatic,
      tenant,
    } as PageDoc;
  }

  return generateMeta({ doc: page });
}
