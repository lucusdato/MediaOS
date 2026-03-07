import React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionHeader({
  children,
  className = "",
}: SectionHeaderProps) {
  return (
    <h2
      className={`text-xl uppercase ${className}`}
      style={{
        fontFamily: "'League Gothic', sans-serif",
        letterSpacing: "1.5px",
        color: "var(--text-primary)",
      }}
    >
      {children}
    </h2>
  );
}
