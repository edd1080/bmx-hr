import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mis Gestiones — BIA Café MX",
    short_name: "Mis Gestiones",
    description: "Vacaciones, metas, organigrama y más — todo en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6FA",
    theme_color: "#1C3565",
    lang: "es-MX",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
