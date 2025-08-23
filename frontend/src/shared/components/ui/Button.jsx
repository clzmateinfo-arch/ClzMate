/* eslint-disable react/prop-types */
import React from "react";

const Button = ({ type = "button", classes = "", onClick, style = {}, children }) => {
  const base = [
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-3",
    "rounded-full",
    "text-lg",
    "px-4",
    "py-3",
    "transition",
    "bg-gradient-to-r",
    "from-[#7a05cf]",
    "via-[#6a00b7]",
    "to-[#7a05cf]",
    "text-white",
    "shadow-md",
    "hover:opacity-95",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
    "focus:ring-[#996bec]",
  ].join(" ");

  const allClasses = `${base} ${classes}`.trim();

  return (
    <button type={type} className={allClasses} onClick={onClick} style={style} aria-label={typeof children === "string" ? children : "Button"}>
      {children}
    </button>
  );
};

export default Button;
