import type { AccessArgs } from "payload";

import type { User } from "@/payload-types";
import { isSuperAdmin } from "@/lib/access";

export const activeTenantOnly = async ({ req }: AccessArgs<User>) => {
  const user = req.user as User | null;

  if (!user) {
    return false;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  const tenantRelation = user.tenants?.[0]?.tenant;

  if (!tenantRelation) {
    return false;
  }

  const tenantId =
    typeof tenantRelation === "string"
      ? tenantRelation
      : typeof tenantRelation === "object" && tenantRelation.id
        ? tenantRelation.id
        : null;

  if (!tenantId) {
    return false;
  }

  try {
    const tenant = await req.payload?.findByID({
      collection: "tenants",
      id: tenantId,
      depth: 0,
    });

    if (!tenant) {
      return false;
    }

    return tenant.status === "active";
  } catch (error) {
    req.payload?.logger.warn({
      err: error,
      message: `Unable to verify tenant status for user "${user.email}"`,
    });

    return false;
  }
};
