import React from "react";
import { getCachedGlobal } from "@/utilities/getGlobals";
import type { Tenant } from "@/payload-types";
import { TenantHeaderClient } from "./template-header.client";
import { generateTenantContentPath } from "@/lib/utils";

export async function TenantHeader({ tenant }: { tenant: Tenant }) {
  const header = await getCachedGlobal("header", 1)();
  const homeHref = generateTenantContentPath({
    slug: "home",
    tenantSlug: tenant.slug,
    includeTenantPrefix: true,
  });
  const searchHref = generateTenantContentPath({
    tenantSlug: tenant.slug,
    includeTenantPrefix: true,
  }) + "/search";

  return (
    <TenantHeaderClient data={header as any} homeHref={homeHref} searchHref={searchHref} />
  );
}
