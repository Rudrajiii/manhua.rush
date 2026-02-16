import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudinary images in next/image (if used later)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dsc1cwi5i/**",
      },
    ],
  },
  // Security headers for all routes
  async headers() {
    return [
      {
        // Apply to reader pages — prevent image hotlinking from other sites
        source: "/reader/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Panel API — edge-cached (Vercel CDN), same-origin only
        source: "/api/panels/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
