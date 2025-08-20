import React from "react";
import clsx from "clsx";

export const Badge = ({ children, className }) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-gray-100 text-gray-800", // Default styling
        className // Custom styles
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
