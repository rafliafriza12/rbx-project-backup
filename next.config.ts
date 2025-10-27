import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove trailingSlash or set to false to avoid API route issues
  // trailingSlash: true,
  // skipTrailingSlashRedirect: true,
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  images: {
    domains: [
      "images.unsplash.com",
      "res.cloudinary.com",
      "cloudinary.com",
      "localhost",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
