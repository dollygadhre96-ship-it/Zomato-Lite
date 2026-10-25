import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        // Only /photo-<id> paths are expected; no coverage beyond that.
        pathname: "/photo-**",
      },
    ],
  },
};

export default nextConfig;
