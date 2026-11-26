import React from "react";

export function Button({ variant = "primary", className = "", type = "button", ...props }) {
  return <button type={type} className={`btn btn--${variant} ${className}`} {...props} />;
}
