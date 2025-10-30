import type { GlobalConfig } from "payload";

import { link } from "@/fields/link";
import { revalidateFooter } from "./hooks/revalidateFooter";

export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "navItems",
      type: "array",
      maxRows: 8,
      admin: {
        initCollapsed: true,
      },
      fields: [
        link({ appearances: false }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
};
