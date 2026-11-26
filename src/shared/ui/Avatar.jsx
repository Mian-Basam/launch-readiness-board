import React from "react";
import { Icon } from "./Icon.jsx";
import { hueFor, initials } from "../lib/visual.js";

/** Round avatar with initials; renders a dashed placeholder for "Unassigned". */
export function Avatar({ person, size = 24, online, label }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (!person) {
    return (
      <span className="avatar avatar--empty" style={style} title={label} role="img" aria-label={label}>
        <Icon name="user" size={Math.round(size * 0.58)} />
      </span>
    );
  }
  return (
    <span
      className="avatar"
      style={{ ...style, "--hue": hueFor(person.name) }}
      title={person.name}
      role="img"
      aria-label={person.name}
    >
      <span aria-hidden="true">{initials(person.name)}</span>
      {online !== undefined ? (
        <span className={`avatarStatus ${online ? "avatarStatus--on" : ""}`} aria-hidden="true" />
      ) : null}
    </span>
  );
}
