import React from "react";

/** Text input with a visible label (placeholders alone aren't accessible labels). */
export function Input({ label, hint, className = "", ...props }) {
  const id = React.useId();
  const input = <input id={id} className={`input ${className}`} {...props} />;
  if (!label) return input;
  return (
    <div className="field">
      <label className="fieldLabel" htmlFor={id}>
        {label}
        {hint ? <span className="fieldHint"> · {hint}</span> : null}
      </label>
      {input}
    </div>
  );
}
