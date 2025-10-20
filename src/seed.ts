import { getPayload } from "payload";
import config from "@payload-config";

const seed = async () => {
  const payload = await getPayload({ config });

  // Create admin user
  await payload.create({
    collection: "users",
    data: {
      email: "admin@demo.com",
      password: "demo",
      roles: ["super-admin"],
      sitename: "demo",
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
