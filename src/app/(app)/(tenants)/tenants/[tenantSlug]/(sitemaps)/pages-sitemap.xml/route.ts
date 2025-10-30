import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import type { NextRequest } from "next/server";

import { generateTenantContentPath } from "@/lib/utils";
import { getServerSideURL } from "@/utilities/getURL";

const getPagesSitemap = ({ tenantSlug }: { tenantSlug: string }) =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise });

      const tenantResult = await payload.find({
        collection: "tenants",
        limit: 1,
        pagination: false,
        where: { slug: { equals: tenantSlug } },
        select: { id: true, slug: true },
      });

      const tenant = tenantResult.docs?.[0];
      if (!tenant) return [] as { loc: string; lastmod: string }[];

      const pages = await payload.find({
        collection: "pages",
        depth: 0,
        draft: false,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
        where: {
          and: [
            { _status: { equals: "published" } },
            { tenant: { equals: tenant.id } },
          ],
        },
      });

      const base = getServerSideURL();
      const dateFallback = new Date().toISOString();

      const entries = (pages.docs || [])
        .filter((p: any) => typeof p?.slug !== "undefined")
        .map((p: any) => {
          const path = generateTenantContentPath({
            collection: "pages",
            slug: p.slug,
            tenantSlug,
          });
          return {
            loc: base.replace(/\/$/, "") + path,
            lastmod: p.updatedAt || dateFallback,
          };
        });

      return entries;
    },
    ["tenant-pages-sitemap", tenantSlug],
    {
      tags: ["pages-sitemap", `tenant:${tenantSlug}`],
    }
  )();

const toXML = (nodes: { loc: string; lastmod: string }[]) => {
  const urls = nodes
    .map((n) => `  <url>\n    <loc>${n.loc}</loc>\n    <lastmod>${n.lastmod}</lastmod>\n  </url>`) 
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const decoded = decodeURIComponent(tenantSlug);
  const sitemap = await getPagesSitemap({ tenantSlug: decoded });
  const xml = toXML(sitemap);
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
