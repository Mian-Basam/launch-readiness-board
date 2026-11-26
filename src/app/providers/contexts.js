import { createContext } from "react";

// Contexts live in their own module so provider files export only components
// (keeps React Fast Refresh working).
export const ThemeContext = createContext(null);
export const I18nContext = createContext(null);
export const ToastContext = createContext(null);
export const SyncContext = createContext(null);
