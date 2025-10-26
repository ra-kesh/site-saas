import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type TenantReference =
  | string
  | {
      id?: string;
      slug?: string | null;
      value?: string | { id?: string; slug?: string | null };
    }
  | null
  | undefined;

type CollectionSlug = "pages" | "posts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractTenantId(tenant: TenantReference): string | undefined {
  if (!tenant) return undefined;

  if (typeof tenant === "string") {
    return tenant;
  }

  if (typeof tenant === "object") {
    if (tenant.id && typeof tenant.id === "string") {
      return tenant.id;
    }

    if (tenant.value) {
      if (typeof tenant.value === "string") {
        return tenant.value;
      }

      if (
        typeof tenant.value === "object" &&
        tenant.value !== null &&
        "id" in tenant.value &&
        typeof tenant.value.id === "string"
      ) {
        return tenant.value.id;
      }
    }
  }

  return undefined;
}

export function extractTenantSlug(tenant: TenantReference): string | undefined {
  if (!tenant || typeof tenant === "string") {
    return undefined;
  }

  if (typeof tenant === "object") {
    if (tenant.slug && typeof tenant.slug === "string") {
      return tenant.slug;
    }

    if (tenant.value) {
      if (
        typeof tenant.value === "object" &&
        tenant.value !== null &&
        "slug" in tenant.value &&
        typeof tenant.value.slug === "string"
      ) {
        return tenant.value.slug;
      }
    }
  }

  return undefined;
}

export function generateTenantURL(tenantSlug: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSubdomainRoutingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";

  // In development or subdomain routing disabled mode, use normal routing
  if (isDevelopment || !isSubdomainRoutingEnabled) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/tenants/${tenantSlug}`;
  }

  const protocol = "https";
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

  // In production, use subdomain routing
  return `${protocol}://${tenantSlug}.${domain}`;
}

export function generateTenantContentPath({
  collection = "pages",
  slug,
  tenantSlug,
  includeTenantPrefix,
}: {
  collection?: CollectionSlug;
  slug?: string | null;
  tenantSlug?: string;
  includeTenantPrefix?: boolean;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSubdomainRoutingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";
  const shouldIncludeTenantPrefix =
    includeTenantPrefix !== undefined
      ? includeTenantPrefix
      : isDevelopment || !isSubdomainRoutingEnabled;

  const segments: string[] = [];

  if (tenantSlug && shouldIncludeTenantPrefix) {
    segments.push("tenants", tenantSlug);
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

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
