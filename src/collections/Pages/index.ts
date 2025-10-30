import type { CollectionConfig } from "payload";

import { authenticated } from "../../access/authenticated";
import { authenticatedOrPublished } from "../../access/authenticatedOrPublished";
import { Archive } from "../../blocks/ArchiveBlock/config";
import { CallToAction } from "../../blocks/CallToAction/config";
import { Content } from "../../blocks/Content/config";
import { Logos } from "../../blocks/Logos/config";
import { FormBlock } from "../../blocks/Form/config";
import { MediaBlock } from "../../blocks/MediaBlock/config";
import { Stats } from "../../blocks/Stats/config";
import { Pricing } from "../../blocks/Pricing/config";
import { Testimonials } from "../../blocks/Testimonials/config";
import { FAQ } from "../../blocks/FAQ/config";
import { hero } from "@/heros/config";
import { slugField } from "payload";
import { populatePublishedAt } from "../../hooks/populatePublishedAt";
import { generatePreviewPath } from "../../utilities/generatePreviewPath";
import { revalidateDelete, revalidatePage } from "./hooks/revalidatePage";
import type { TenantReference } from "@/lib/utils";

import { tenantsArrayField } from "@payloadcms/plugin-multi-tenant/fields";
import { isSuperAdmin } from "@/lib/access";

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";

export const Pages: CollectionConfig<"pages"> = {
  slug: "pages",
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
    tenant: true,
  },
  admin: {
    defaultColumns: ["title", "tenant", "slug", "updatedAt"],
    livePreview: {
      url: async ({ data, req }) =>
        await generatePreviewPath({
          slug: data?.slug,
          collection: "pages",
          tenant: data?.tenant as TenantReference,
          req,
        }),
    },
    preview: async (data, { req }) =>
      await generatePreviewPath({
        slug: data?.slug as string,
        collection: "pages",
        tenant: data?.tenant as TenantReference,
        req,
      }),
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      type: "tabs",
      tabs: [
        {
          fields: [hero],
          label: "Hero",
        },
        {
          fields: [
            {
              name: "layout",
              type: "blocks",
              blocks: [CallToAction, Logos, Stats, Content, MediaBlock, Pricing, Testimonials, FAQ, Archive, FormBlock],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: "Content",
        },
        {
          name: "meta",
          label: "SEO",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: "media",
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
          ],
        },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    slugField({
      overrides: (field) => {
        const slug = field.fields.find(
          (candidate) =>
            typeof (candidate as { name?: unknown }).name === "string" &&
            (candidate as { name: string }).name === "slug"
        ) as { type?: string; unique?: boolean } | undefined;

        if (slug && slug.type === "text") {
          slug.unique = false;
        }

        return field;
      },
    }),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  indexes: [
    {
      fields: ["slug", "tenant"],
      unique: true,
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
