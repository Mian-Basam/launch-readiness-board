import React from "react";
import { usePresence } from "../hooks/usePresence.js";
import { useI18n } from "../../../app/providers/hooks.js";
import { Avatar } from "../../../shared/ui/Avatar.jsx";

export function PresenceBar() {
  const { users } = usePresence();
  const { t } = useI18n();
  const onlineCount = users.filter((u) => u.online).length;

  return (
    <section className="panel">
      <header className="panelHead">
        <h3 className="panelTitle">{t("presence")}</h3>
        <span className="panelMeta">{t("teamOnline", { n: onlineCount, total: users.length })}</span>
      </header>
      <ul className="presenceList">
        {users.map((u) => (
          <li key={u.id} className={`person ${u.online ? "" : "person--away"}`}>
            <Avatar person={u} size={32} online={u.online} />
            <span className="personText">
              <span className="personName">{u.name}</span>
              <span className="personRole">
                {u.typing && u.online ? (
                  <span className="typing">
                    <span className="typingDots" aria-hidden="true"><i /><i /><i /></span>
                    {t("typing")}
                  </span>
                ) : (
                  u.role
                )}
              </span>
            </span>
            <span className="srOnly">{u.online ? t("online") : t("offline")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
