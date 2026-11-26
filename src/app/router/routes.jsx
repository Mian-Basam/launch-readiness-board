import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { BoardPage } from "../../features/board/components/BoardPage.jsx";
import { useI18n } from "../providers/hooks.js";

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="card cardPad">
      <p>{t("notFound")}</p>
      <Link to="/board">{t("backToBoard")}</Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/board" replace />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
