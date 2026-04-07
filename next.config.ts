import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      { hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

export default nextConfig;
