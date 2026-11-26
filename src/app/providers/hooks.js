import { useContext } from "react";
import { ThemeContext, I18nContext, ToastContext, SyncContext } from "./contexts.js";

function useRequiredContext(ctx, name) {
  const value = useContext(ctx);
  if (!value) throw new Error(`${name} must be used within its provider`);
  return value;
}

export const useTheme = () => useRequiredContext(ThemeContext, "useTheme");
export const useI18n = () => useRequiredContext(I18nContext, "useI18n");
export const useToast = () => useRequiredContext(ToastContext, "useToast");
export const useSync = () => useRequiredContext(SyncContext, "useSync");
