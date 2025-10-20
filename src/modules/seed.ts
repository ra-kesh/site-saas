import { getPayload } from "payload";
import config from "@payload-config";

const seed = async () => {
  const payload = await getPayload({ config });

  // const adminAccount = await stripe.accounts.create({});

  // Create admin tenant
  const adminTenant = await payload.create({
    collection: "tenants",
    data: {
      name: "admin",
      slug: "admin",
      // stripeAccountId: adminAccount.id,
    },
  });

  // Create admin user
  await payload.create({
    collection: "users",
    data: {
      email: "admin@demo.com",
      password: "demo",
      roles: ["super-admin"],
      sitename: "demo",
      tenants: [
        {
          tenant: adminTenant.id,
        },
      ],
    },
  });
};

try {
  await seed();
  console.log("Seeding completed successfully");
  process.exit(0);
} catch (error) {
  console.error("Error during seeding:", error);
  process.exit(1); // Exit with error code
}
