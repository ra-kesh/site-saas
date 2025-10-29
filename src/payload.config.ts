// storage-adapter-import-placeholder
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { Tenants } from "./collections/Tenants";
import { Sites } from "./collections/Sites";
import { Users } from "./collections/Users";
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import type { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types";
import { isSuperAdmin } from "./lib/access";
import { revalidateRedirects } from "./hooks/revalidateRedirects";
import type { Page, Post } from "./payload-types";
import {
  generateSiteContentPath,
  extractSiteSlug,
  extractTenantSlug,
  type SiteReference,
  type TenantReference,
} from "./lib/utils";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const generateTitle: GenerateTitle<Page | Post> = ({ doc }) => {
  if (doc?.title) {
    return `${doc.title}`;
  }

  return "Tenant Website";
};

const resolveSiteSlug = (doc?: Partial<Page | Post>) => {
  if (!doc?.site) {
    return undefined;
  }

  return extractSiteSlug(doc.site as SiteReference);
};

const resolveTenantSlug = (doc?: Partial<Page | Post>) => {
  if (!doc || typeof doc !== "object" || !("tenant" in doc)) {
    return undefined;
  }

  return extractTenantSlug((doc as { tenant?: TenantReference }).tenant);
};

const generateURL: GenerateURL<Page | Post> = ({ doc }) => {
  const baseURL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "http://localhost:3000";

  const siteSlug = resolveSiteSlug(doc);
  const tenantSlug = resolveTenantSlug(doc);
  const slugValue = doc?.slug as unknown;
  let normalizedSlug = "home";

  if (typeof slugValue === "string") {
    normalizedSlug = slugValue || "home";
  } else if (Array.isArray(slugValue)) {
    normalizedSlug = slugValue.join("/") || "home";
  }

  const collection = doc && typeof doc === "object" && "layout" in doc ? "pages" : "posts";

  const pathname = generateSiteContentPath({
    collection,
    slug: normalizedSlug,
    siteSlug: siteSlug ?? tenantSlug,
  });

  return `${baseURL}${pathname}`;
};

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ["@/components/BeforeLogin"],
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: "light",
    suppressHydrationWarning: true,
  },
  collections: [Users, Media, Tenants, Sites, Pages, Posts, Categories],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL:
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || "",
  }),
  sharp,
  plugins: [
    // payloadCloudPlugin(),
    redirectsPlugin({
      collections: ["pages", "posts"],
      overrides: {
        hooks: {
          afterChange: [revalidateRedirects],
        },
      },
    }),
    formBuilderPlugin({
      fields: {
        payment: false,
      },
    }),
    seoPlugin({
      generateTitle,
      generateURL,
    }),
    multiTenantPlugin({
      tenantsSlug: "sites",
      collections: {
        media: {},
        pages: {},
        posts: {},
        categories: {},
        redirects: {},
        forms: {},
        "form-submissions": {},
      },
      tenantField: {
        name: "site",
        admin: {
          disableListColumn: false,
        },
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    }),
    // storage-adapter-placeholder
  ],
});
