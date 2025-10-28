import type { CollectionConfig } from "payload";

import { isSuperAdmin } from "@/lib/access";
import {
  revalidateTenant,
  revalidateTenantDelete,
} from "@/hooks/revalidateTenant";

export const Tenants: CollectionConfig = {
  slug: "tenants",
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    update: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  hooks: {
    afterChange: [revalidateTenant],
    afterDelete: [revalidateTenantDelete],
  },
  admin: {
    useAsTitle: "slug",
  },
  fields: [
    {
      name: "name",
      required: true,
      type: "text",
      label: "Business Name",
      admin: {
        description: "This is the name of the Business ",
      },
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description:
          "This is the subdomain for the store (e.g. [slug].example.com)",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      admin: {
        description:
          "Controls onboarding progress. Pending tenants see the dashboard checklist until they subscribe.",
      },
      options: [
        {
          label: "Pending",
          value: "pending",
        },
        {
          label: "Draft",
          value: "draft",
        },
        {
          label: "Active",
          value: "active",
        },
        {
          label: "Suspended",
          value: "suspended",
        },
      ],
    },
    {
      name: "templateId",
      type: "select",
      options: [
        {
          label: "Convention",
          value: "convention",
        },
        {
          label: "Mobile Shop",
          value: "mobile-shop",
        },
      ],
      admin: {
        description:
          "Website template selected during onboarding. Leave blank until a tenant chooses one.",
      },
    },
    {
      name: "templateVersion",
      type: "number",
      admin: {
        readOnly: true,
        description:
          "Tracks which version of the template the tenant last synced to.",
      },
    },
    {
      name: "siteConfig",
      type: "json",
      admin: {
        readOnly: true,
        description:
          "Generated block configuration tied to the selected template. Managed automatically.",
      },
    },
    // {
    //   name: "stripeAccountId",
    //   type: "text",
    //   required: true,
    //   access: {
    //     update: ({ req }) => isSuperAdmin(req.user),
    //   },
    //   admin: {
    //     description: "Stripe Account ID associated with your shop",
    //   },
    // },
    // {
    //   name: "stripeDetailsSubmitted",
    //   type: "checkbox",
    //   access: {
    //     update: ({ req }) => isSuperAdmin(req.user),
    //   },
    //   admin: {
    //     description:
    //       "You cannot create products until you submit your Stripe details",
    //   },
    // },
  ],
};
