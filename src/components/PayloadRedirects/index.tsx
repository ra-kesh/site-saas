import type React from 'react'
import type { Page, Post } from '@/payload-types'

import { getCachedDocument } from "@/utilities/getDocument";
import { notFound, redirect } from "next/navigation";
import { extractTenantSlug, generateTenantContentPath } from "@/lib/utils";
import { getRedirectByFrom } from "@/modules/redirects/data/getRedirectByFrom";

interface Props {
  disableNotFound?: boolean
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirectItem = await getRedirectByFrom(url);

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url);
    }

    let redirectUrl: string;

    const relationTo = redirectItem.to?.reference?.relationTo as "pages" | "posts" | undefined;

    if (typeof redirectItem.to?.reference?.value === "string" && relationTo) {
      const id = redirectItem.to.reference.value;

      const document = (await getCachedDocument(relationTo, id)()) as Page | Post;
      const tenantSlug = document?.tenant ? extractTenantSlug(document.tenant ?? undefined) : undefined;

      const slug = typeof document?.slug === "string" ? document.slug : undefined;

      redirectUrl = generateTenantContentPath({
        collection: relationTo,
        slug,
        tenantSlug,
      })
    } else if (typeof redirectItem.to?.reference?.value === "object" && redirectItem.to.reference?.value) {
      const doc = redirectItem.to.reference.value as Page | Post;
      const tenantSlug = doc?.tenant ? extractTenantSlug(doc.tenant ?? undefined) : undefined;
      const slug = typeof doc.slug === "string" ? doc.slug : undefined;

      redirectUrl = generateTenantContentPath({
        collection: relationTo ?? "pages",
        slug,
        tenantSlug,
      })
    } else {
      redirectUrl = "";
    }

    if (redirectUrl) redirect(redirectUrl);
  }

  if (disableNotFound) return null;

  notFound();
};
