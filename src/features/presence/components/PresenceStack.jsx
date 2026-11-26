import React from "react";
import { usePresence } from "../hooks/usePresence.js";
import { useI18n } from "../../../app/providers/hooks.js";
import { Avatar } from "../../../shared/ui/Avatar.jsx";

/** Overlapping avatars with online dots, for the board header. */
export function PresenceStack() {
  const { users } = usePresence();
  const { t } = useI18n();
  const online = users.filter((u) => u.online).length;
  return (
    <div className="avatarStack" aria-label={t("teamOnline", { n: online, total: users.length })} role="group">
      {users.map((u) => (
        <span key={u.id} className={`avatarStackItem ${u.online ? "" : "isAway"}`}>
          <Avatar person={u} size={28} online={u.online} />
        </span>
      ))}
    </div>
  );
}
