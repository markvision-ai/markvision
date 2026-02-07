import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./hooks/useTheme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
        <SpeedInsights />
        <Analytics />
      </TooltipProvider>
    </ThemeProvider>
  // </React.StrictMode>
);
