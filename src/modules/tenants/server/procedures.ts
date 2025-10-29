import z from "zod";
import { TRPCError } from "@trpc/server";
import { Media, Site, Tenant, User } from "@/payload-types";

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";

const MAX_SUBDOMAIN_LENGTH = 63;
const MIN_SUBDOMAIN_LENGTH = 3;
const SUBDOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "support",
  "blog",
  "mail",
  "help",
  "status",
]);

type SiteWithTenant = Site & { tenant: Tenant | string | null };
type ProcedureContext = {
  db: any;
  session?: { user?: User | null };
};

function normalizeSubdomain(raw: string) {
  return raw.trim().toLowerCase();
}

function extractRelationId(
  relation:
    | string
    | {
        id?: string;
        value?: string | { id?: string | null } | null;
      }
    | null
    | undefined
): string | null {
  if (!relation) return null;

  if (typeof relation === "string") {
    return relation;
  }

  if (typeof relation === "object") {
    if (relation.id && typeof relation.id === "string") {
      return relation.id;
    }

    if (relation.value) {
      if (typeof relation.value === "string") {
        return relation.value;
      }

      if (
        typeof relation.value === "object" &&
        relation.value !== null &&
        "id" in relation.value &&
        typeof relation.value.id === "string"
      ) {
        return relation.value.id;
      }
    }
  }

  return null;
}

function resolvePrimaryContext(user: User | null) {
  const siteRelation = (user as User & { sites?: { site?: unknown }[] })?.sites?.[0]?.site;
  const tenantRelation = user?.tenants?.[0]?.tenant;

  return {
    siteId: extractRelationId(siteRelation as never),
    tenantId: extractRelationId(tenantRelation),
  };
}

async function resolveTenant(
  ctx: ProcedureContext,
  tenantField: Tenant | string | null | undefined
): Promise<(Tenant & { image: Media | null }) | null> {
  if (!tenantField) {
    return null;
  }

  if (typeof tenantField === "string") {
    const tenant = await ctx.db.findByID({
      collection: "tenants",
      id: tenantField,
      depth: 1,
    });

    return tenant ? (tenant as Tenant & { image: Media | null }) : null;
  }

  return tenantField as Tenant & { image: Media | null };
}

async function enrichSite(
  ctx: ProcedureContext,
  site: Site | null
) {
  if (!site) {
    return null;
  }

  const tenant = await resolveTenant(ctx, site.tenant);

  return {
    site: site as SiteWithTenant,
    tenant,
  };
}

function generateSubdomainSuggestions(base: string) {
  if (!base) {
    return [];
  }

  const suffixes = ["hq", "studio", "online", "pages", "shop", "team"];
  const suggestions: string[] = [];

  for (const suffix of suffixes) {
    const candidate = `${base}-${suffix}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (
      candidate !== base &&
      candidate.length <= MAX_SUBDOMAIN_LENGTH &&
      SUBDOMAIN_PATTERN.test(candidate) &&
      !RESERVED_SUBDOMAINS.has(candidate)
    ) {
      suggestions.push(candidate);
    }

    if (suggestions.length >= 3) {
      break;
    }
  }

  if (suggestions.length < 3 && base.length > 1) {
    const hyphenated = `${base}-${base.length > 4 ? "space" : "hub"}`;
    if (
      hyphenated.length <= MAX_SUBDOMAIN_LENGTH &&
      SUBDOMAIN_PATTERN.test(hyphenated) &&
      !RESERVED_SUBDOMAINS.has(hyphenated)
    ) {
      suggestions.push(hyphenated);
    }
  }

  return Array.from(new Set(suggestions)).slice(0, 3);
}

async function findSiteBySlug(ctx: ProcedureContext, slug: string) {
  const result = await ctx.db.find({
    collection: "sites",
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  return (result.docs[0] as Site | undefined) ?? null;
}

async function findSiteById(ctx: ProcedureContext, id: string) {
  try {
    const site = await ctx.db.findByID({
      collection: "sites",
      depth: 1,
      id,
    });

    return (site as Site | undefined) ?? null;
  } catch {
    return null;
  }
}

async function findFirstSiteForTenant(ctx: ProcedureContext, tenantId: string) {
  const result = await ctx.db.find({
    collection: "sites",
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      tenant: {
        equals: tenantId,
      },
    },
  });

  return (result.docs[0] as Site | undefined) ?? null;
}

export const tenantsRouter = createTRPCRouter({
  getSite: baseProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const site = await findSiteBySlug(ctx, input.slug);

      if (!site) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      const enriched = await enrichSite(ctx, site);

      if (!enriched) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });
      }

      return enriched;
    }),
  getCurrentSite: protectedProcedure.query(async ({ ctx }) => {
    const { siteId, tenantId } = resolvePrimaryContext(ctx.session.user as User);

    let site: Site | null = null;

    if (siteId) {
      site = await findSiteById(ctx, siteId);
    }

    if (!site && tenantId) {
      site = await findFirstSiteForTenant(ctx, tenantId);
    }

    if (!site) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No site found for the current user.",
      });
    }

    const seededHome = await ctx.db.find({
      collection: "pages",
      limit: 1,
      pagination: false,
      where: {
        and: [
          {
            slug: { equals: "home" },
          },
          {
            site: { equals: site.id },
          },
        ],
      },
    });

    const enriched = await enrichSite(ctx, site);

    if (!enriched) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Site record is missing.",
      });
    }

    return {
      ...enriched,
      hasSeeded: seededHome.totalDocs > 0,
    };
  }),
  checkSiteAvailability: baseProcedure
    .input(
      z.object({
        subdomain: z.string().trim(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const raw = input.subdomain;
      const normalized = normalizeSubdomain(raw);

      const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
        process.env.ROOT_DOMAIN ??
        "ofpuri.com";

      if (normalized.length === 0) {
        return {
          status: "invalid" as const,
          subdomain: normalized,
          fullDomain: null,
          message: "Enter a name to check if your free domain is available.",
          suggestions: [] as string[],
        };
      }

      if (normalized.length < MIN_SUBDOMAIN_LENGTH) {
        return {
          status: "invalid" as const,
          subdomain: normalized,
          fullDomain: null,
          message: "Use at least 3 characters to keep your domain memorable.",
          suggestions: [] as string[],
        };
      }

      if (normalized.length > MAX_SUBDOMAIN_LENGTH) {
        return {
          status: "invalid" as const,
          subdomain: normalized,
          fullDomain: null,
          message: "Shorten the name to 63 characters or fewer.",
          suggestions: [] as string[],
        };
      }

      if (!SUBDOMAIN_PATTERN.test(normalized)) {
        return {
          status: "invalid" as const,
          subdomain: normalized,
          fullDomain: null,
          message:
            "Letters, numbers, and single hyphens only. Start and end with a letter or number.",
          suggestions: generateSubdomainSuggestions(
            normalized.replace(/[^a-z0-9-]/g, "")
          ),
        };
      }

      if (RESERVED_SUBDOMAINS.has(normalized)) {
        return {
          status: "unavailable" as const,
          subdomain: normalized,
          fullDomain: null,
          message: "That name is reserved. Try a short variation instead.",
          suggestions: generateSubdomainSuggestions(normalized),
        };
      }

      const siteResult = await ctx.db.find({
        collection: "sites",
        where: {
          slug: {
            equals: normalized,
          },
        },
        limit: 1,
        pagination: false,
        depth: 0,
      });

      if (siteResult.docs.length > 0) {
        return {
          status: "unavailable" as const,
          subdomain: normalized,
          fullDomain: null,
          message:
            "Already claimed. Try another name or add a new word to make it yours.",
          suggestions: generateSubdomainSuggestions(normalized),
        };
      }

      return {
        status: "available" as const,
        subdomain: normalized,
        fullDomain: `${normalized}.${rootDomain}`,
        message: "Nice! This free domain is ready whenever you are.",
        suggestions: [] as string[],
      };
    }),
});
