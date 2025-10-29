import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Site } from "@/payload-types";

type ReferenceValue =
  | string
  | {
      id?: string;
      slug?: string | null;
      value?: string | { id?: string; slug?: string | null } | null;
    }
  | null
  | undefined;

export type TenantReference = ReferenceValue;
export type SiteReference = ReferenceValue | Site | string | null | undefined;

type CollectionSlug = "pages" | "posts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function extractRelationId(candidate: ReferenceValue): string | undefined {
  if (!candidate) return undefined;

  if (typeof candidate === "string") {
    return candidate;
  }

  if (typeof candidate === "object") {
    if (candidate.id && typeof candidate.id === "string") {
      return candidate.id;
    }

    if (candidate.value) {
      if (typeof candidate.value === "string") {
        return candidate.value;
      }

      if (
        typeof candidate.value === "object" &&
        candidate.value !== null &&
        "id" in candidate.value &&
        typeof candidate.value.id === "string"
      ) {
        return candidate.value.id;
      }
    }
  }

  return undefined;
}

function extractRelationSlug(candidate: ReferenceValue): string | undefined {
  if (!candidate || typeof candidate === "string") {
    return undefined;
  }

  if (typeof candidate === "object") {
    if (candidate.slug && typeof candidate.slug === "string") {
      return candidate.slug;
    }

    if (candidate.value) {
      if (
        typeof candidate.value === "object" &&
        candidate.value !== null &&
        "slug" in candidate.value &&
        typeof candidate.value.slug === "string"
      ) {
        return candidate.value.slug;
      }
    }
  }

  return undefined;
}

const resolveSitePathPrefix = () =>
  process.env.NEXT_PUBLIC_SITE_PATH_PREFIX || "sites";

export function extractSiteId(site: SiteReference): string | undefined {
  if (site && typeof site === "object" && "id" in site) {
    const candidate = (site as { id?: unknown }).id;
    if (typeof candidate === "string") {
      return candidate;
    }
  }

  return extractRelationId(site as ReferenceValue);
}

export function extractTenantId(tenant: TenantReference): string | undefined {
  return extractRelationId(tenant);
}

export function extractSiteSlug(site: SiteReference): string | undefined {
  const slug = extractRelationSlug(site);

  if (slug) {
    return slug;
  }

  if (typeof site === "string") {
    return site;
  }

  return undefined;
}

export function extractTenantSlug(tenant: TenantReference): string | undefined {
  return extractRelationSlug(tenant);
}

export function generateSiteURL(siteSlug: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSubdomainRoutingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";

  if (isDevelopment || !isSubdomainRoutingEnabled) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/${resolveSitePathPrefix()}/${siteSlug}`;
  }

  const protocol = "https";
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

  return `${protocol}://${siteSlug}.${domain}`;
}

export function generateTenantURL(tenantSlug: string) {
  return generateSiteURL(tenantSlug);
}

export function generateSiteContentPath({
  collection = "pages",
  slug,
  siteSlug,
  includeSitePrefix,
}: {
  collection?: CollectionSlug;
  slug?: string | null;
  siteSlug?: string;
  includeSitePrefix?: boolean;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSubdomainRoutingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";
  const shouldIncludeSitePrefix =
    includeSitePrefix !== undefined
      ? includeSitePrefix
      : isDevelopment || !isSubdomainRoutingEnabled;

  const segments: string[] = [];

  if (siteSlug && shouldIncludeSitePrefix) {
    segments.push(resolveSitePathPrefix(), siteSlug);
  }

  if (collection && collection !== "pages") {
    segments.push(collection);
  }

  const slugSegments =
    typeof slug === "string"
      ? slug
          .split("/")
          .map((segment) => segment.trim())
          .filter(Boolean)
      : [];

  if (
    collection === "pages" &&
    slugSegments.length === 1 &&
    slugSegments[0] === "home"
  ) {
    slugSegments.length = 0;
  }

  const pathname = `/${segments.concat(slugSegments).join("/")}`;

  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

export function generateTenantContentPath(args: {
  collection?: CollectionSlug;
  slug?: string | null;
  tenantSlug?: string;
  includeTenantPrefix?: boolean;
}) {
  const { tenantSlug, includeTenantPrefix, ...rest } = args;

  return generateSiteContentPath({
    ...rest,
    siteSlug: tenantSlug,
    includeSitePrefix: includeTenantPrefix,
  });
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
