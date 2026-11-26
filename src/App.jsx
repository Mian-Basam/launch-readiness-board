import React from "react";
import { AppProviders } from "./app/providers/AppProviders.jsx";
import { AppShell } from "./app/shell/AppShell.jsx";

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}