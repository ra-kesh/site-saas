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
    description:
      "Tenants represent customer accounts (billing, ownership, and shared settings). Sites will reference the tenant that owns them.",
    useAsTitle: "name",
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
          "Legacy tenant slug used for backwards compatibility. Sites will own routing in future phases.",
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
      name: "account",
      label: "Account Settings",
      type: "group",
      admin: {
        description:
          "Metadata about the organization that owns this account. These values never surface on public sites.",
      },
      fields: [
        {
          name: "billingEmail",
          type: "email",
          admin: {
            description: "Primary address for invoices and account notices.",
          },
        },
        {
          name: "plan",
          type: "select",
          options: [
            { value: "free", label: "Free" },
            { value: "starter", label: "Starter" },
            { value: "growth", label: "Growth" },
            { value: "enterprise", label: "Enterprise" },
          ],
          admin: {
            description: "Used for billing and feature flags.",
          },
        },
        {
          name: "trialEndsAt",
          type: "date",
          admin: {
            description:
              "Optional trial expiration date. Leave empty for accounts without a trial.",
          },
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      admin: {
        description:
          "Internal-only notes about this tenant (support history, migration steps, etc.).",
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
