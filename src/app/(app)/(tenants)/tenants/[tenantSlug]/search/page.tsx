import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import Link from "next/link";
import { generateTenantContentPath } from "@/lib/utils";
import type { Page, Post, Tenant } from "@/payload-types";

type PageParams = Promise<{ tenantSlug: string }>;
type SearchParams = Promise<{ q?: string }>;

export default async function TenantSearch({ params, searchParams }: { params: PageParams; searchParams?: SearchParams }) {
  const { isEnabled: draft } = await draftMode();
  const { tenantSlug } = await params;
  const sp = (await searchParams) || {};
  const qRaw = sp.q || "";
  const q = decodeURIComponent(qRaw).trim();

  const payload = await getPayload({ config: configPromise });

  const tenants = await payload.find({
    collection: "tenants",
    limit: 1,
    pagination: false,
    where: { slug: { equals: tenantSlug } },
  });
  const tenant = (tenants.docs?.[0] as Tenant | undefined) ?? null;
  if (!tenant) return notFound();

  let pageResults: Page[] = [];
  let postResults: Post[] = [];

  if (q.length >= 2) {
    const where: any = {
      and: [
        { tenant: { equals: tenant.id } },
        {
          or: [
            { title: { like: q } },
            { slug: { like: q } },
            { "meta.title": { like: q } },
            { "meta.description": { like: q } },
          ],
        },
      ],
    };

    const pagesRes = await payload.find({ collection: "pages", draft, overrideAccess: draft, pagination: false, where });
    const postsRes = await payload.find({ collection: "posts", draft, overrideAccess: draft, pagination: false, where });
    pageResults = pagesRes.docs as Page[];
    postResults = postsRes.docs as Post[];
  }

  const results = [
    ...pageResults.map((doc) => ({
      id: doc.id,
      title: doc.title,
      href: generateTenantContentPath({ tenantSlug, slug: typeof doc.slug === "string" ? doc.slug : undefined }),
      collection: "pages" as const,
    })),
    ...postResults.map((doc) => ({
      id: doc.id,
      title: doc.title,
      href: generateTenantContentPath({ tenantSlug, collection: "posts", slug: doc.slug }),
      collection: "posts" as const,
    })),
  ];

  return (
    <main className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-6">Search</h1>
      <form action="" className="mb-6">
        <input
          className="w-full border rounded-md px-3 py-2"
          placeholder="Search pages and posts..."
          name="q"
          defaultValue={q}
        />
      </form>
      {q.length < 2 ? (
        <p className="text-muted-foreground">Type at least 2 characters to search.</p>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground">No results for “{q}”.</p>
      ) : (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={`${r.collection}-${r.id}`} className="border rounded-md p-3 hover:bg-muted/40 transition-colors">
              <Link href={r.href}>
                <div className="text-sm text-muted-foreground">{r.collection}</div>
                <div className="text-lg font-medium">{r.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
