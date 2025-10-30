import type { GlobalConfig } from "payload";

import { link } from "@/fields/link";
import { revalidateHeader } from "./hooks/revalidateHeader";

export const Header: GlobalConfig = {
  slug: "header",
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
    afterChange: [revalidateHeader],
  },
};
