"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = props.value !== undefined && props.value !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            {icon}
          </div>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={`w-full bg-white border rounded-xl px-4 py-3 text-slate-900 
            placeholder-transparent transition-all duration-300 outline-none
            ${icon ? "pl-12" : ""}
            ${focused ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm" : "border-slate-200 hover:border-slate-300"}
            ${error ? "border-red-400 ring-2 ring-red-400/10" : ""}
          `}
          placeholder={label}
        />
        <label
          className={`absolute transition-all duration-300 pointer-events-none
            ${icon ? "left-12" : "left-4"}
            ${focused || hasValue
              ? "-top-2.5 text-xs px-2 bg-white rounded"
              : "top-3 text-sm"
            }
            ${focused ? "text-indigo-600" : "text-slate-400"}
            ${error ? "text-red-500" : ""}
          `}
        >
          {label}
        </label>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1.5 ml-1"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
