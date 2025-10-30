import { TRPCError } from "@trpc/server";
import { headers as getHeaders } from "next/headers";

// import { stripe } from "@/lib/stripe";
import { seedTenant } from "@/endpoints/seed";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

import { generateAuthCookie } from "../utils";
import { loginSchema, registerSchema } from "../schemas";

export const authRouter = createTRPCRouter({
  session: baseProcedure.query(async ({ ctx }) => {
    const headers = await getHeaders();

    const session = await ctx.db.auth({ headers });

    return session;
  }),
  register: baseProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const withMongoRetry = async <T>(fn: () => Promise<T>, attempts = 5): Promise<T> => {
        let lastErr: unknown;
        for (let i = 0; i < attempts; i++) {
          try {
            return await fn();
          } catch (err: any) {
            const code = err?.code as number | undefined;
            const labels: string[] | undefined = err?.errorResponse?.errorLabels || err?.errorLabels;
            const isTransient = labels?.includes("TransientTransactionError");
            const isRetryable = isTransient || code === 112 || code === 251; // WriteConflict, NoSuchTransaction
            if (!isRetryable || i === attempts - 1) {
              throw err;
            }
            const delay = 150 * Math.pow(2, i) + Math.floor(Math.random() * 100);
            await new Promise((res) => setTimeout(res, delay));
            lastErr = err;
          }
        }
        // Should never reach here, but TS guard
        throw lastErr;
      };
      const existingData = await ctx.db.find({
        collection: "users",
        limit: 1,
        where: {
          sitename: {
            equals: input.sitename,
          },
        },
      });

      const existingUser = existingData.docs[0];

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sitename already taken",
        });
      }

      // const account = await stripe.accounts.create({});

      // if (!account) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "Failed to create Stripe account",
      //   });
      // }

      const tenant = await ctx.db.create({
        collection: "tenants",
        data: {
          name: input.sitename,
          slug: input.sitename,
          // stripeAccountId: account.id,
        },
      });

      await ctx.db.create({
        collection: "users",
        data: {
          email: input.email,
          sitename: input.sitename,
          password: input.password, // This will be hashed
          tenants: [
            {
              tenant: tenant.id,
            },
          ],
        },
      });

      try {
        await withMongoRetry(() =>
          seedTenant({
            payload: ctx.db,
            tenant: {
              id: tenant.id,
              slug: tenant.slug,
              name: tenant.name,
            },
            ownerEmail: input.email,
          }),
        );
      } catch (error) {
        ctx.db.logger.error({
          err: error,
          message: `Failed to seed starter content for tenant "${tenant.slug}"`,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to provision starter content for your tenant. Please try again.",
        });
      }

      const data = await ctx.db.login({
        collection: "users",
        data: {
          email: input.email,
          password: input.password,
        },
      });

      if (!data.token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Failed to login",
        });
      }

      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: data.token,
      });
    }),
  login: baseProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const data = await ctx.db.login({
      collection: "users",
      data: {
        email: input.email,
        password: input.password,
      },
    });

    if (!data.token) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Failed to login",
      });
    }

    await generateAuthCookie({
      prefix: ctx.db.config.cookiePrefix,
      value: data.token,
    });

    return data;
  }),
});
