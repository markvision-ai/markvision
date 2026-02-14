import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./hooks/useTheme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Version Marker
console.log('%c MarkVision v2026.02.14-Light-Refactor loaded ', 'background: #222; color: #bada55');

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ThemeProvider>
    <TooltipProvider>
      <App />
      {import.meta.env.PROD && <SpeedInsights />}
      {import.meta.env.PROD && <Analytics />}
    </TooltipProvider>
  </ThemeProvider>
  // </React.StrictMode>
);
