import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    tenantPages: {
      revalidate: 60 * 30,
    },
    tenantPosts: {
      revalidate: 60 * 30,
    },
    redirects: {
      revalidate: 60 * 60,
    },
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  reactCompiler: true,
};

export default withPayload(nextConfig);
