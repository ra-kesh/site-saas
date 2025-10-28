import z from "zod";
import { TRPCError } from "@trpc/server";
import { Media, Tenant, User } from "@/payload-types";

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

function normalizeSubdomain(raw: string) {
  return raw.trim().toLowerCase();
}

function resolvePrimaryTenantId(user: User | null): string | null {
  const tenantRelation = user?.tenants?.[0]?.tenant;

  if (!tenantRelation) {
    return null;
  }

  if (typeof tenantRelation === "string") {
    return tenantRelation;
  }

  if (typeof tenantRelation === "object" && tenantRelation.id) {
    return tenantRelation.id;
  }

  return null;
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

export const tenantsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantsData = await ctx.db.find({
        collection: "tenants",
        depth: 1, // "tenant.image" is a type of "Media"
        where: {
          slug: {
            equals: input.slug,
          },
        },
        limit: 1,
        pagination: false,
      });

      const tenant = tenantsData.docs[0];

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
      }

      return tenant as Tenant & { image: Media | null };
    }),
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = resolvePrimaryTenantId(ctx.session.user as User);

    if (!tenantId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No tenant found for the current user.",
      });
    }

    const tenant = await ctx.db.findByID({
      collection: "tenants",
      id: tenantId,
      depth: 1,
    });

    if (!tenant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tenant record is missing.",
      });
    }

    return tenant as Tenant & { image: Media | null };
  }),
  checkAvailability: baseProcedure
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

      const tenantsData = await ctx.db.find({
        collection: "tenants",
        where: {
          slug: {
            equals: normalized,
          },
        },
        limit: 1,
        pagination: false,
        depth: 0,
      });

      if (tenantsData.docs.length > 0) {
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
