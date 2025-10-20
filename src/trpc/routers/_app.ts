import { tenantsRouter } from "@/modules/tenants/server/procedures";
import { createTRPCRouter } from "../init";

import { authRouter } from "@/modules/auth/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  tenants: tenantsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
