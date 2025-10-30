import type { Metadata } from "next";

import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import type { Post } from "@/payload-types";

import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Navbar } from "@/modules/tenants/ui/components/navbar";
import { Footer } from "@/modules/tenants/ui/components/footer";
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { PostHero } from '@/heros/PostHero'
import RichText from '@/components/RichText'
import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { generateMeta } from "@/utilities/generateMeta";
import { extractTenantId, generateTenantContentPath } from "@/lib/utils";
import { getTenantPost } from "@/modules/tenants/data/getTenantPost";

type PageParams = Promise<{
  slug: string
  tenantSlug: string
}>

type PostDoc = Post

export const dynamic = "force-static";

export default async function TenantPostPage({ params }: { params: PageParams }) {
  const { isEnabled: draft } = await draftMode();
  const { tenantSlug, slug } = await params;

  const decodedTenantSlug = decodeURIComponent(tenantSlug);
  const decodedSlug = decodeURIComponent(slug);

  const { tenant, post } = await getTenantPost({
    draft,
    postSlug: decodedSlug,
    tenantSlug: decodedTenantSlug,
  });

  if (!tenant) {
    notFound();
  }

  const tenantDoc = tenant;

  const urlPath = generateTenantContentPath({
    collection: "posts",
    slug: decodedSlug,
    tenantSlug: tenantDoc.slug,
  });

  if (!post) {
    return <PayloadRedirects url={urlPath} />;
  }

  const relatedPosts =
    post.relatedPosts?.filter((related): related is PostDoc => {
      if (typeof related !== "object" || related === null) return false;
      const relatedTenantId = extractTenantId(related.tenant);
      return !relatedTenantId || relatedTenantId === tenantDoc.id;
    }) ?? [];

  return (
    <>
      <Navbar tenant={tenantDoc} />
      <article className="pt-16 pb-16">
        <PageClient />
        <PayloadRedirects disableNotFound url={urlPath} />
        {draft && <LivePreviewListener />}
        <PostHero post={post} />
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="container">
            <RichText className="mx-auto max-w-[52rem]" data={post.content} enableGutter={false} />
            {relatedPosts.length > 0 && (
              <RelatedPosts className="mt-12 mx-auto max-w-[52rem]" docs={relatedPosts} />
            )}
          </div>
        </div>
      </article>
      <Footer tenantId={tenantDoc.id} />
    </>
  );
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { tenantSlug, slug } = await params;
  const { isEnabled: draft } = await draftMode();

  const decodedTenantSlug = decodeURIComponent(tenantSlug);
  const decodedSlug = decodeURIComponent(slug);

  const { tenant, post } = await getTenantPost({
    draft,
    postSlug: decodedSlug,
    tenantSlug: decodedTenantSlug,
  });

  if (!tenant) {
    notFound();
  }

  return generateMeta({ doc: post });
}
