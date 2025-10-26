import configPromise from "@payload-config";
import { getPayload } from "payload";
import { cacheLife, cacheTag } from "next/cache";

export async function getRedirects(depth = 1) {
  const payload = await getPayload({ config: configPromise });

  const { docs: redirects } = await payload.find({
    collection: "redirects",
    depth,
    limit: 0,
    pagination: false,
  });

  return redirects;
}

export async function getCachedRedirects(depth = 1) {
  'use cache'

  cacheLife("redirects");
  cacheTag("redirects");

  return getRedirects(depth);
}
