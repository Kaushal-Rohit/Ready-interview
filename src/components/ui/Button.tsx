"use client";

import { motion } from "framer-motion";
import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  glow = false,
  children,
  className = "",
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 cursor-pointer select-none";

  const variants: Record<string, string> = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    outline:
      "bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50",
    danger:
      "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20",
    ghost:
      "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
  };

  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm gap-1.5",
    md: "px-6 py-2.5 text-sm gap-2",
    lg: "px-8 py-3 text-base gap-2",
    xl: "px-10 py-4 text-lg gap-3",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      } ${glow ? "animate-pulse-glow" : ""} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
