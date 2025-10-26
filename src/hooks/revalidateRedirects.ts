import type { CollectionAfterChangeHook } from "payload";

import { revalidateTag } from "next/cache";

export const revalidateRedirects: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  payload.logger.info(`Revalidating redirects`);

  revalidateTag("redirects", "max");

  const currentFrom = typeof doc?.from === "string" ? doc.from : undefined;
  const previousFrom = typeof previousDoc?.from === "string" ? previousDoc.from : undefined;

  if (currentFrom) {
    revalidateTag(`redirect:${currentFrom}`, "max");
  }

  if (previousFrom && previousFrom !== currentFrom) {
    revalidateTag(`redirect:${previousFrom}`, "max");
  }

  return doc;
};
