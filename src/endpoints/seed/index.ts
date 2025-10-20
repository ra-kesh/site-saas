import type { Payload, PayloadRequest } from "payload";

export const seed = async ({ payload }: { payload: Payload; req: PayloadRequest }) => {
  payload.logger.warn("Seed endpoint is not implemented for the multi-tenant setup yet.");
};
