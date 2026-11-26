import React from "react";
import { QueryProvider } from "./QueryProvider.jsx";
import { I18nProvider } from "./I18nProvider.jsx";
import { ThemeProvider } from "./ThemeProvider.jsx";
import { ToastProvider } from "./ToastProvider.jsx";
import { SyncProvider } from "./SyncProvider.jsx";

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider>
            <SyncProvider>{children}</SyncProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
