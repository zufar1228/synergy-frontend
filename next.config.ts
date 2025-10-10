import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
  },

  // Enable compression
  compress: true,
};

export default nextConfig;
