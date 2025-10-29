import type { AccessArgs } from "payload";

import { isSuperAdmin } from "@/lib/access";
import type { Tenant, User } from "@/payload-types";

type SiteWithTenant = {
  id?: string;
  slug?: string | null;
  status?: string | null;
  tenant?: Tenant | string | null;
};

type RelationLike =
  | string
  | {
      id?: string;
      value?: string | { id?: string | null } | null;
    }
  | null
  | undefined;

function extractRelationId(relation: RelationLike): string | null {
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

async function resolveCandidateSiteId({
  payload,
  user,
}: {
  payload: AccessArgs<User>["req"]["payload"];
  user: User | null;
}): Promise<string | null> {
  if (!user || !payload) {
    return null;
  }

  const siteRelation = (user as User & { sites?: { site?: RelationLike }[] })
    .sites?.[0]?.site;
  const siteId = extractRelationId(siteRelation);

  if (siteId) {
    return siteId;
  }

  const tenantRelation = user.tenants?.[0]?.tenant;
  const tenantId = extractRelationId(tenantRelation);

  if (!tenantId) {
    return null;
  }

  try {
    const siteResult = await payload.find({
      collection: "sites",
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        tenant: {
          equals: tenantId,
        },
      },
    });

    return (siteResult.docs?.[0] as { id?: string } | undefined)?.id ?? null;
  } catch (error) {
    payload.logger?.warn({
      err: error,
      message: `Unable to resolve site for tenant "${tenantId}" when checking access for "${user.email}"`,
    });

    return null;
  }
}

function ensureActiveTenant(tenant: Tenant | string | null | undefined) {
  if (!tenant) {
    return false;
  }

  if (typeof tenant === "string") {
    return true;
  }

  return tenant.status === "active";
}

export const activeSiteOnly = async ({ req }: AccessArgs<User>) => {
  const user = req.user as User | null;

  if (!user) {
    return false;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  const siteId = await resolveCandidateSiteId({
    payload: req.payload,
    user,
  });

  if (!siteId) {
    return false;
  }

  try {
    const site = await req.payload?.findByID({
      collection: "sites",
      depth: 1,
      id: siteId,
    });

    if (!site) {
      return false;
    }

    const typedSite = site as SiteWithTenant;

    if (typedSite.status !== "active") {
      return false;
    }

    if (!ensureActiveTenant(typedSite.tenant)) {
      if (req.payload?.logger) {
        req.payload.logger.debug?.(
          `Blocked access: owning tenant for site "${typedSite.slug}" is not active`
        );
      }

      return false;
    }

    return true;
  } catch (error) {
    req.payload?.logger.warn({
      err: error,
      message: `Unable to verify site status for user "${user.email}"`,
    });

    return false;
  }
};
