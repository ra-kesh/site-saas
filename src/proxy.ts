import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TENANT_PREFIX = "/sites";
const DEV_SUBDOMAIN_COOKIE = "__tenant_subdomain";
const DEV_SUBDOMAIN_PARAM = "__subdomain";
const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css|map)$/i;
const RESERVED_SUBDOMAINS = new Set([
  "app",
  "api",
  "auth",
  "sites",
  "www",
  "admin",
  "static",
  "assets",
]);

type ProxyResult = {
  response: NextResponse | null;
  tenantSlug: string | null;
  setDevCookie?: string;
};

const isSubdomainRoutingEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";

const configuredRootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(":")[0].toLowerCase() ?? "";

const appHostname = (() => {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url) return "";
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

// Derive fallback root domain from APP_URL when NEXT_PUBLIC_ROOT_DOMAIN is not set.
const derivedRootDomain =
  (!configuredRootDomain && appHostname.includes(".")
    ? appHostname.split(".").slice(1).join(".")
    : "") ?? "";

const rootDomain = configuredRootDomain || derivedRootDomain;

if (rootDomain && appHostname && appHostname.endsWith(`.${rootDomain}`)) {
  const [label] = appHostname.split(".");
  if (label) RESERVED_SUBDOMAINS.add(label);
}

function shouldBypass(pathname: string) {
  if (!pathname) return true;
  if (PUBLIC_FILE.test(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  return false;
}

function normalizeSlug(candidate: string | null | undefined) {
  if (!candidate) return null;
  const normalized = candidate
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return normalized.length ? normalized : null;
}

function detectTenantSlug(
  request: NextRequest
): { slug: string | null; setDevCookie?: string } {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost");

  if (isLoopback) {
    const provided = request.nextUrl.searchParams.get(DEV_SUBDOMAIN_PARAM);
    if (provided) {
      const slug = normalizeSlug(provided);
      return { slug, setDevCookie: slug ?? undefined };
    }

    // Support dev hostnames like <tenant>.localhost
    const labels = hostname.split(".");
    if (labels.length > 1 && labels.at(-1) === "localhost") {
      return { slug: normalizeSlug(labels[0]) };
    }

    const cookie = request.cookies.get(DEV_SUBDOMAIN_COOKIE)?.value;
    return { slug: normalizeSlug(cookie) };
  }

  if (rootDomain && hostname === rootDomain) {
    return { slug: null };
  }

  if (rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    const labels = hostname.split(".");
    const candidate = labels[0];
    if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
      return { slug: normalizeSlug(candidate) };
    }
    return { slug: null };
  }

  return { slug: null };
}

function handleTenantRouting(request: NextRequest): ProxyResult {
  if (!isSubdomainRoutingEnabled) {
    return { response: null, tenantSlug: null };
  }

  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) {
    return { response: null, tenantSlug: null };
  }

  const { slug: tenantSlug, setDevCookie } = detectTenantSlug(request);

  if (!tenantSlug) {
    return { response: null, tenantSlug: null, setDevCookie };
  }

  if (pathname.startsWith(TENANT_PREFIX)) {
    return { response: null, tenantSlug, setDevCookie };
  }

  const forwardedSearch = new URLSearchParams(request.nextUrl.searchParams);
  forwardedSearch.delete(DEV_SUBDOMAIN_PARAM);

  const appendPath = pathname === "/" ? "" : pathname;
  const rewriteUrl = new URL(
    `${TENANT_PREFIX}/${tenantSlug}${appendPath}`,
    request.url
  );

  const search = forwardedSearch.toString();
  if (search) {
    rewriteUrl.search = search;
  }

  const headers = new Headers(request.headers);
  headers.set("x-tenant-slug", tenantSlug);
  const originalHost =
    request.headers.get("host") ?? request.nextUrl.hostname ?? "";
  headers.set("x-original-hostname", originalHost);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: { headers },
  });

  return { response, tenantSlug, setDevCookie };
}

function respond(request: NextRequest) {
  const { response, tenantSlug, setDevCookie } = handleTenantRouting(request);

  if (response) {
    if (setDevCookie) {
      response.cookies.set(DEV_SUBDOMAIN_COOKIE, setDevCookie, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  }

  const headers = new Headers(request.headers);
  if (tenantSlug) {
    headers.set("x-tenant-slug", tenantSlug);
  }
  const originalHost =
    request.headers.get("host") ?? request.nextUrl.hostname ?? "";
  headers.set("x-original-hostname", originalHost);

  const nextResponse = NextResponse.next({ request: { headers } });

  if (!tenantSlug && setDevCookie) {
    nextResponse.cookies.delete({
      name: DEV_SUBDOMAIN_COOKIE,
      path: "/",
    });
  } else if (setDevCookie) {
    nextResponse.cookies.set(DEV_SUBDOMAIN_COOKIE, setDevCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return nextResponse;
}

export default function proxy(request: NextRequest) {
  return respond(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
