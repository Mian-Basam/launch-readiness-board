import React from "react";
import { AppRoutes } from "../router/routes.jsx";
import { ControlsBar } from "../../features/settings/components/ControlsBar.jsx";
import { SyncStatus } from "../../features/settings/components/SyncStatus.jsx";

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lm)" />
      <rect x="7" y="8" width="4.5" height="16" rx="1.6" fill="#fff" />
      <rect x="13.75" y="8" width="4.5" height="11" rx="1.6" fill="#fff" opacity=".82" />
      <rect x="20.5" y="8" width="4.5" height="7" rx="1.6" fill="#fff" opacity=".64" />
    </svg>
  );
}

export function AppShell() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <LogoMark />
            <span className="brandName">DevPath</span>
            <span className="brandSep" aria-hidden="true" />
            <span className="brandProduct">Launch Readiness</span>
          </div>
          <div className="topbarRight">
            <SyncStatus />
            <ControlsBar />
          </div>
        </div>
      </header>
      <main className="appMain">
        <AppRoutes />
      </main>
    </div>
  );
}
