"use client";

import { motion } from "framer-motion";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export default function Card({
  children,
  className = "",
  hover = true,
  delay = 0,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -2 } : undefined}
      className={`bg-white border border-slate-200 rounded-2xl p-6 card-shadow
        transition-all duration-300 
        ${hover ? "hover:card-shadow-hover hover:border-slate-300" : ""}
        ${className}`}
    >
      {children}
    </motion.div>
  );
}
