import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IoT Warehouse Monitoring System",
    short_name: "Warehouse Monitor",
    description:
      "Real-time IoT monitoring system that surfaces incidents, analytics, and device status for warehouse operations.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/window.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/file.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
