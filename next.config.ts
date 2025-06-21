import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    WXFLOWS_ENDPOINT: process.env.WXFLOWS_ENDPOINT,
    WXFLOWS_API_KEY: process.env.WXFLOWS_API_KEY,
  },
};

export default nextConfig;
