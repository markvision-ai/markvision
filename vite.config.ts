import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,

    // 🔥 PROXY ДЛЯ N8N (убирает CORS и Failed to fetch)
    proxy: {
      "/n8n": {
        target: "https://n8n.zapoinov.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/n8n/, ""),
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    compression(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "pwa-icons/*.png"],
      manifest: {
        name: "MarkVision AI",
        short_name: "MarkVision",
        description: "AI-платформа для управления маркетингом медицинских клиник",
        theme_color: "#1a1f2e",
        background_color: "#0f1117",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["business", "productivity", "medical"],
        icons: [
          { src: "/logo-vector-blue.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/pwa-icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "maskable any" },
          { src: "/pwa-icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" },
        ],
        screenshots: [
          {
            src: "/pwa-icons/screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "MarkVision AI Dashboard",
          },
          {
            src: "/pwa-icons/screenshot-mobile.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "MarkVision AI Mobile",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
          'date-vendor': ['date-fns'],
          'pdf-vendor': ['html2canvas', 'jspdf'],
          'supabase-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          // Large components
          'reports': ['./src/components/reports/ReportGenerator.tsx'],
          'crm': ['./src/components/crm/CRMPage.tsx'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
}));
