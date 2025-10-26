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
import { PostHero } from "@/heros/PostHero";
import RichText from "@/components/RichText";
import { RelatedPosts } from "@/blocks/RelatedPosts/Component";
import { generateMeta } from "@/utilities/generateMeta";
import { extractTenantId, generateTenantContentPath } from "@/lib/utils";
import type { Post, Tenant } from "@/payload-types";
import {
  getTenantCached,
  getTenantPostCached,
  tenantDataAccess,
} from "@/modules/tenants/server/tenant-data";

type PageParams = Promise<{
  slug: string;
  tenantSlug: string;
}>;

type TenantDoc = Tenant;
type PostDoc = Post;

export default async function TenantPostPage({
  params,
}: {
  params: PageParams;
}) {
  const { isEnabled: draft } = await draftMode();
  const { slug, tenantSlug } = await params;

  const resolvedSlug = decodeURIComponent(slug);
  const resolvedTenantSlug = decodeURIComponent(tenantSlug);

  if (draft) {
    return (
      <TenantPostDraft
        slug={resolvedSlug}
        tenantSlug={resolvedTenantSlug}
      />
    );
  }

  return (
    <TenantPostCached
      slug={resolvedSlug}
      tenantSlug={resolvedTenantSlug}
    />
  );
}

type TenantPostShellProps = {
  slug: string;
  tenantSlug: string;
};

async function TenantPostCached({
  slug,
  tenantSlug,
}: TenantPostShellProps) {
  'use cache'

  cacheLife("tenantPosts");

  const tenant = await getTenantCached(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const post = await getTenantPostCached({
    slug,
    tenantId: tenant.id,
  });

  const urlPath = generateTenantContentPath({
    collection: "posts",
    slug,
    tenantSlug: tenant.slug,
  });

  return (
    <TenantPostLayout
      draft={false}
      post={post}
      tenant={tenant}
      urlPath={urlPath}
    />
  );
}

async function TenantPostDraft({
  slug,
  tenantSlug,
}: TenantPostShellProps) {
  const tenant = await tenantDataAccess.fetchTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const post = await tenantDataAccess.fetchPostBySlug({
    draft: true,
    slug,
    tenantId: tenant.id,
  });

  const urlPath = generateTenantContentPath({
    collection: "posts",
    slug,
    tenantSlug: tenant.slug,
  });

  return (
    <TenantPostLayout
      draft
      post={post}
      tenant={tenant}
      urlPath={urlPath}
    />
  );
}

type TenantPostLayoutProps = {
  draft: boolean;
  post: PostDoc | null;
  tenant: TenantDoc;
  urlPath: string;
};

function TenantPostLayout({
  draft,
  post,
  tenant,
  urlPath,
}: TenantPostLayoutProps) {
  const relatedPosts =
    post?.relatedPosts?.filter((related): related is PostDoc => {
      if (typeof related !== "object" || related === null) return false;
      const relatedTenantId = extractTenantId(related.tenant);
      return !relatedTenantId || relatedTenantId === tenant.id;
    }) ?? [];

  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar slug={tenant.slug} />
      </Suspense>
      <article className="pt-16 pb-16">
        <PageClient />
        <PayloadRedirects
          disableNotFound={Boolean(post)}
          url={urlPath}
        />
        {draft && <LivePreviewListener />}
        {post ? (
          <>
            <PostHero post={post} />
            <div className="flex flex-col items-center gap-4 pt-8">
              <div className="container">
                <RichText
                  className="mx-auto max-w-[48rem]"
                  data={post.content}
                  enableGutter={false}
                />
                {relatedPosts.length > 0 && (
                  <RelatedPosts
                    className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
                    docs={relatedPosts}
                  />
                )}
              </div>
            </div>
          </>
        ) : null}
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
  const { slug, tenantSlug } = await params;

  const resolvedSlug = decodeURIComponent(slug);
  const resolvedTenantSlug = decodeURIComponent(tenantSlug);

  if (draft) {
    const tenant = await tenantDataAccess.fetchTenantBySlug(
      resolvedTenantSlug
    );

    if (!tenant) {
      notFound();
    }

    const post = await tenantDataAccess.fetchPostBySlug({
      draft: true,
      slug: resolvedSlug,
      tenantId: tenant.id,
    });

    return generateMeta({ doc: post });
  }

  const tenant = await getTenantCached(resolvedTenantSlug);

  if (!tenant) {
    notFound();
  }

  const post = await getTenantPostCached({
    slug: resolvedSlug,
    tenantId: tenant.id,
  });

  return generateMeta({ doc: post });
}
