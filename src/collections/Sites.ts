import type { CollectionConfig } from "payload";

import { isSuperAdmin } from "@/lib/access";
import { revalidateSite, revalidateSiteDelete } from "@/hooks/revalidateSite";

const RESERVED_SITE_SLUGS = new Set([
  "app",
  "api",
  "auth",
  "sites",
  "www",
  "admin",
]);

function validateSiteSlug(value: unknown) {
  if (typeof value !== "string") {
    return "Site slug must be a string.";
  }

  const normalized = value.toLowerCase().trim();

  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(normalized)) {
    return "Use 2-63 characters: letters, numbers, and single hyphens. Start and end with a letter or number.";
  }

  if (RESERVED_SITE_SLUGS.has(normalized)) {
    return `"${normalized}" is reserved. Choose another slug.`;
  }

  return true;
}

export const Sites: CollectionConfig = {
  slug: "sites",
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    update: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  hooks: {
    afterChange: [revalidateSite],
    afterDelete: [revalidateSiteDelete],
  },
  admin: {
    defaultColumns: ["name", "tenant", "slug", "status"],
    group: "Content",
    useAsTitle: "name",
    description:
      "Sites belong to tenants. Each site can have its own pages, posts, and branding.",
  },
  fields: [
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      required: true,
      index: true,
      admin: {
        description:
          "Choose which tenant owns this site. Tenants can manage multiple sites.",
        position: "sidebar",
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
      label: "Site Name",
      admin: {
        description: "Public-facing name shown in navigation and metadata.",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "Used for subdomains and routing (e.g. [slug].example.com).",
      },
      validate: (value: unknown) => validateSiteSlug(value),
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      label: "Publishing Status",
      required: true,
      admin: {
        description:
          "Only active sites are exposed publicly. Draft sites stay internal until ready.",
        position: "sidebar",
      },
      options: [
        { value: "draft", label: "Draft" },
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description:
          "Internal notes about this site. Use this to track vertical, launch dates, etc.",
      },
    },
    {
      name: "branding",
      type: "group",
      label: "Branding",
      admin: {
        description:
          "Optional branding controls to customize navigation and marketing components.",
      },
      fields: [
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "primaryColor",
          type: "text",
          admin: {
            description: "Hex color (e.g. #0040FF).",
          },
        },
        {
          name: "secondaryColor",
          type: "text",
          admin: {
            description: "Hex color used for accents.",
          },
        },
      ],
    },
  ],
  timestamps: true,
};
