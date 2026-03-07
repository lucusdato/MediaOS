import React from "react";

type Status = "complete" | "progress" | "warning" | "overdue" | "notstarted";

interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
}

const statusColors: Record<Status, string> = {
  complete: "var(--status-complete)",
  progress: "var(--status-progress)",
  warning: "var(--status-warning)",
  overdue: "var(--status-overdue)",
  notstarted: "var(--status-notstarted)",
};

export default function StatusBadge({
  status,
  label,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm ${className}`}
      style={{ fontFamily: "'Aldine721 BT', serif" }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColors[status] }}
        aria-hidden="true"
      />
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
    </span>
  );
}
