import type { CollectionConfig } from "payload";

import { link } from "@/fields/link";
import { revalidateTenantFooter } from "./hooks/revalidateFooter";

export const Footers: CollectionConfig = {
  slug: "footers",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["tenant", "updatedAt"],
  },
  fields: [
    {
      name: "navItems",
      type: "array",
      maxRows: 8,
      admin: {
        initCollapsed: true,
      },
      fields: [link({ appearances: false })],
    },
  ],
  hooks: {
    afterChange: [revalidateTenantFooter],
    afterDelete: [revalidateTenantFooter],
  },
};
