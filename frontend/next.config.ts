import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Menu photos are sent as base64 to the API route; allow a generous body limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
