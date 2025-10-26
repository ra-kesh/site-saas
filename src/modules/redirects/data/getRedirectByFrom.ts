import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import configPromise from "@payload-config";

import type { Redirect } from "@/payload-types";

const fetchRedirectByFrom = async (from: string): Promise<Redirect | null> => {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "redirects",
    limit: 1,
    pagination: false,
    where: {
      from: {
        equals: from,
      },
    },
  });

  return (result.docs?.[0] as Redirect | undefined) ?? null;
};

export const getRedirectByFrom = async (from: string): Promise<Redirect | null> =>
  unstable_cache(
    () => fetchRedirectByFrom(from),
    ["redirect-by-from", from],
    {
      revalidate: 300,
      tags: ["redirects", `redirect:${from}`],
    }
  )();
