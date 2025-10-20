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
import { Users } from "./collections/Users";
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import type { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types";
import { isSuperAdmin } from "./lib/access";
import { revalidateRedirects } from "./hooks/revalidateRedirects";
import type { Page, Post } from "./payload-types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const generateTitle: GenerateTitle<Page | Post> = ({ doc }) => {
  if (doc?.title) {
    return `${doc.title}`;
  }

  return "Tenant Website";
};

const resolveTenantSlug = (doc?: Partial<Page | Post>) => {
  if (!doc?.tenant) {
    return undefined;
  }

  if (typeof doc.tenant === "string") {
    return undefined;
  }

  if (typeof doc.tenant === "object" && "slug" in doc.tenant) {
    return doc.tenant.slug as string | undefined;
  }

  return undefined;
};

const generateURL: GenerateURL<Page | Post> = ({ doc }) => {
  const baseURL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "http://localhost:3000";

  const tenantSlug = resolveTenantSlug(doc);
  const normalizedSlug =
    typeof doc?.slug === "string"
      ? doc.slug
      : Array.isArray(doc?.slug)
        ? doc?.slug.join("/")
        : "home";

  const path =
    normalizedSlug === "home" || normalizedSlug === ""
      ? ""
      : `/${normalizedSlug}`;

  const tenantPrefix = tenantSlug ? `/tenants/${tenantSlug}` : "";

  return `${baseURL}${tenantPrefix}${path}`;
};

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Tenants, Pages, Posts, Categories],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
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
      collections: {
        // products: {},
        media: {},
        pages: {},
        posts: {},
        categories: {},
        redirects: {},
        forms: {},
        "form-submissions": {},
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    }),
    // storage-adapter-placeholder
  ],
});
