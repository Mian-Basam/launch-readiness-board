import React from "react";
import { useI18n, useSync } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";

export function SyncStatus() {
  const { t } = useI18n();
  const { isOnline, queue } = useSync();

  return (
    <div className="syncStatus">
      <span className={`statusChip ${isOnline ? "statusChip--on" : "statusChip--off"}`}>
        <Icon name={isOnline ? "wifi" : "wifiOff"} size={14} />
        {isOnline ? t("online") : t("offline")}
      </span>
      <span className={`statusChip ${queue.length ? "statusChip--warn" : ""}`}>
        <Icon name={queue.length ? "clock" : "check"} size={14} />
        {queue.length > 0 ? t("queued", { n: queue.length }) : t("noQueue")}
      </span>
    </div>
  );
}
