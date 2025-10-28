'use server';

import { logout } from "@payloadcms/next/auth";
import config from "@payload-config";

export async function logoutAction() {
  try {
    await logout({
      config,
      allSessions: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown logout error";
    throw new Error(`Logout failed: ${message}`);
  }
}
