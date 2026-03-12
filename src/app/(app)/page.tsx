"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { flushSync } from "react-dom";
import {
  ListChecks,
  X,
  MessageCircle,
  TriangleAlert,
  CalendarClock,
  ExternalLink,
  Loader2,
  ArrowUpDown,
  CheckCircle2,
  Circle,
  AlignLeft,
  ListTree,
} from "lucide-react";
import type { CampaignData, CampaignMilestone } from "@/lib/asana";
import { useFilters } from "@/lib/filter-context";

// --- Timeline helpers ---

const PIXELS_PER_DAY_BASE = 14;
const DIAMOND_SIZE = 14;
const ROW_HEIGHT = 100;
// The vertical center of the phase bar inside each row
const PHASE_BAR_Y = Math.round(ROW_HEIGHT / 2);

// Zoom constraints
const MIN_ZOOM = 1;
const MAX_ZOOM = 5; // At 5x, ~70px/day — 14 days fills ~980px
const ZOOM_STEP = 0.15;

function dateToX(date: Date, yearStart: Date, pixelsPerDay: number): number {
  const diff = date.getTime() - yearStart.getTime();
  return Math.round(diff / 86400000) * pixelsPerDay;
}

interface CalendarDay {
  label: string;
  x: number;
  isFirstOfMonth: boolean;
  isWeekend: boolean;
  dayOfWeek: string;
}

interface CalendarMonth {
  name: string;
  startX: number;
  width: number;
  days: CalendarDay[];
}

function getCalendarData(yearStart: Date, pixelsPerDay: number): CalendarMonth[] {
  const year = yearStart.getFullYear();
  const showAllDays = pixelsPerDay >= 35; // Show individual days when zoomed in ~2.5x+
  const result: CalendarMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1);
    const nextMonthStart = new Date(year, m + 1, 1);
    const days: CalendarDay[] = [];

    if (showAllDays) {
      // Show every day in the month
      const d = new Date(year, m, 1);
      while (d.getMonth() === m) {
        const dayOfWeek = d.getDay();
        days.push({
          label: d.getDate().toString(),
          x: dateToX(d, yearStart, pixelsPerDay),
          isFirstOfMonth: d.getDate() === 1,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          dayOfWeek: d.toLocaleString("en-US", { weekday: "narrow" }),
        });
        d.setDate(d.getDate() + 1);
      }
    } else {
      // Show only Mondays (original behavior)
      const d = new Date(year, m, 1);
      while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
      while (d.getMonth() === m) {
        days.push({
          label: d.getDate().toString(),
          x: dateToX(d, yearStart, pixelsPerDay),
          isFirstOfMonth: d.getDate() <= 7,
          isWeekend: false,
          dayOfWeek: "M",
        });
        d.setDate(d.getDate() + 7);
      }
    }

    result.push({
      name: monthStart
        .toLocaleString("en-US", { month: "long" })
        .toUpperCase(),
      startX: dateToX(monthStart, yearStart, pixelsPerDay),
      width:
        dateToX(nextMonthStart, yearStart, pixelsPerDay) - dateToX(monthStart, yearStart, pixelsPerDay),
      days,
    });
  }
  return result;
}

// --- Phase colors ---
const PHASE_COLORS = {
  make: "var(--phase-make)",
  mine: "var(--phase-mine)",
  manage: "var(--phase-manage)",
};

// --- Status colors ---
function milestoneStatusColor(m: CampaignMilestone): string {
  if (m.completed) return "var(--status-complete)";
  if (m.overdue) return "var(--status-overdue)";
  return "var(--status-notstarted)";
}

// --- Short display name from full Asana project name ---
function shortCampaignName(fullName: string): { name: string; brand: string } {
  const parts = fullName.split("-");
  if (parts.length >= 6) {
    const tail = parts.slice(5).join("-").trim();
    const brand = parts[4]?.trim() ?? "";
    return { name: tail.toUpperCase(), brand };
  }
  return { name: fullName.toUpperCase(), brand: "" };
}

// --- Diamond milestone marker ---
function Diamond({ color }: { color: string }) {
  return (
    <div
      className="shrink-0"
      style={{
        width: DIAMOND_SIZE,
        height: DIAMOND_SIZE,
        backgroundColor: color,
        border: "none",
        borderRadius: 2,
        transform: "rotate(45deg)",
      }}
    />
  );
}

// --- Resizable handle hook ---
function useResizable(
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
  direction: "left" | "right" = "right"
) {
  const [width, setWidth] = useState(initialWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta =
          direction === "right"
            ? ev.clientX - startX.current
            : startX.current - ev.clientX;
        const newWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startWidth.current + delta)
        );
        setWidth(newWidth);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, minWidth, maxWidth, direction]
  );

  return { width, onMouseDown };
}

// --- Resize handle component ---
function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 self-stretch cursor-col-resize group/resize"
      style={{ width: 9, position: "relative", zIndex: 1 }}
    >
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 opacity-0 group-hover/resize:opacity-100 group-active/resize:opacity-100 transition-opacity"
        style={{
          width: 2,
          backgroundColor: "var(--border-medium)",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

// --- Column resize hook ---
type ColumnKey = "assignee" | "dueDate" | "campaign";

const COLUMN_DEFAULTS: Record<ColumnKey, number> = {
  assignee: 140,
  dueDate: 110,
  campaign: 150,
};

const COLUMN_MINS: Record<ColumnKey, number> = {
  assignee: 80,
  dueDate: 80,
  campaign: 80,
};

const COLUMN_MAXES: Record<ColumnKey, number> = {
  assignee: 300,
  dueDate: 200,
  campaign: 300,
};

const COL_WIDTHS_KEY = "mediaos-task-col-widths";

function useColumnResize() {
  const [widths, setWidths] = useState<Record<ColumnKey, number>>(() => {
    if (typeof window === "undefined") return { ...COLUMN_DEFAULTS };
    try {
      const stored = localStorage.getItem(COL_WIDTHS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.assignee && parsed.dueDate && parsed.campaign) return parsed;
      }
    } catch {}
    return { ...COLUMN_DEFAULTS };
  });

  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const activeColRef = useRef<ColumnKey>("assignee");
  const invertedRef = useRef(false);

  const handleResizeStart = useCallback(
    (column: ColumnKey, inverted: boolean) => (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = widths[column];
      activeColRef.current = column;
      invertedRef.current = inverted;

      const min = COLUMN_MINS[column];
      const max = COLUMN_MAXES[column];

      const onMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const rawDelta = ev.clientX - startXRef.current;
        const delta = invertedRef.current ? rawDelta : -rawDelta;
        const newWidth = Math.min(max, Math.max(min, startWidthRef.current + delta));
        setWidths((prev) => ({ ...prev, [activeColRef.current]: newWidth }));
      };

      const onMouseUp = () => {
        draggingRef.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setWidths((current) => {
          try {
            localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(current));
          } catch {}
          return current;
        });
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [widths]
  );

  return { widths, handleResizeStart };
}

// --- Calendar header ---
function CalendarHeader({
  calendarData,
  timelineWidth,
  showAllDays,
}: {
  calendarData: CalendarMonth[];
  timelineWidth: number;
  showAllDays: boolean;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{
        height: showAllDays ? 64 : 56,
        width: timelineWidth,
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {calendarData.map((month, i) => (
        <span
          key={`m-${i}`}
          className="absolute text-center"
          style={{
            left: month.startX,
            top: 6,
            width: month.width,
            fontFamily: "'League Gothic', sans-serif",
            fontSize: 16,
            letterSpacing: 1.2,
            color: "var(--text-primary)",
          }}
        >
          {month.name}
        </span>
      ))}
      {calendarData.flatMap((month) =>
        month.days.map((day) => (
          <span
            key={`d-${day.x}`}
            className="absolute text-center"
            style={{
              left: day.x - 15,
              top: showAllDays ? 26 : 32,
              width: 30,
              fontFamily: "'Aldine721 BT', serif",
              fontSize: showAllDays ? 10 : 12,
              fontWeight: day.isFirstOfMonth ? 700 : "normal",
              color: day.isWeekend
                ? "var(--border-medium)"
                : day.isFirstOfMonth
                  ? "#2563EB"
                  : "var(--text-muted)",
            }}
          >
            {day.label}
          </span>
        ))
      )}
      {showAllDays &&
        calendarData.flatMap((month) =>
          month.days.map((day) => (
            <span
              key={`dow-${day.x}`}
              className="absolute text-center"
              style={{
                left: day.x - 15,
                top: 40,
                width: 30,
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 8,
                color: day.isWeekend
                  ? "var(--border-medium)"
                  : "var(--text-muted)",
                letterSpacing: 0.5,
              }}
            >
              {day.dayOfWeek}
            </span>
          ))
        )}
      {calendarData.flatMap((month) =>
        month.days.map((day) => (
          <div
            key={`tick-${day.x}`}
            className="absolute"
            style={{
              left: day.x,
              top: showAllDays ? 54 : 48,
              width: 1,
              height: 8,
              backgroundColor: day.isWeekend
                ? "var(--border-light)"
                : "var(--border-light)",
            }}
          />
        ))
      )}
    </div>
  );
}

// --- Sidebar campaign entry ---
function SidebarEntry({
  name,
  subtitle,
  indicatorColor,
  width,
}: {
  name: string;
  subtitle: string;
  indicatorColor: string;
  width: number;
}) {
  return (
    <div
      className="flex flex-col justify-center shrink-0"
      style={{
        width,
        height: ROW_HEIGHT,
        padding: 14,
        gap: 4,
        borderRight: "1px solid var(--border-light)",
        borderBottom: "1px solid var(--border-light)",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <div className="flex items-center gap-2 w-full">
        <div
          className="shrink-0 rounded-full"
          style={{ width: 8, height: 8, backgroundColor: indicatorColor }}
        />
        <span
          style={{
            fontFamily: "'League Gothic', sans-serif",
            fontSize: 17,
            letterSpacing: 1.2,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
      </div>
      <span
        className="w-full"
        style={{
          fontFamily: "'Aldine721 BT', serif",
          fontSize: 12,
          color: "#000",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}

// --- Widget ---
function Widget({
  icon,
  label,
  count,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        backgroundColor: color,
        borderRadius: 8,
        padding: "12px 14px",
        gap: 4,
        border: `1px solid ${color}`,
      }}
    >
      <div className="flex items-center justify-center gap-2 w-full">
        {icon}
        <span
          style={{
            fontFamily: "'League Gothic', sans-serif",
            fontSize: 12,
            letterSpacing: 1,
            color: "#FFFFFF",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'League Gothic', sans-serif",
          fontSize: 32,
          color: "#FFFFFF",
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: "'Aldine721 BT', serif",
          fontSize: 10,
          color: "#FFFFFF",
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}

// --- Task detail types ---
interface TaskComment {
  gid: string;
  text: string;
  author: string;
  createdAt: string;
}

interface TaskDetail {
  notes: string;
  permalink_url: string;
  comments: TaskComment[];
}

// --- Task row ---
interface TaskItem {
  gid: string;
  name: string;
  dueDate: string | null;
  campaign: string;
  completed: boolean;
  overdue: boolean;
  assignee: string | null;
  section: string;
  notes: string;
  numSubtasks: number;
  commentCount?: number;
}

function TaskRow({
  task,
  isSelected,
  onClick,
  cachedCommentCount,
  columnWidths,
  columnResizeStart,
}: {
  task: TaskItem;
  isSelected: boolean;
  onClick: () => void;
  cachedCommentCount?: number;
  columnWidths: Record<ColumnKey, number>;
  columnResizeStart: (column: ColumnKey, inverted: boolean) => (e: React.MouseEvent) => void;
}) {
  const statusLabel = task.completed
    ? "Complete"
    : task.overdue
      ? "Overdue"
      : "Open";
  const statusColor = task.completed
    ? "var(--status-complete)"
    : task.overdue
      ? "var(--status-overdue)"
      : "#6B7280";

  const formattedDate = task.dueDate
    ? new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "\u2014";

  // Truncate description to first line / ~120 chars
  const descPreview = task.notes
    ? task.notes.split("\n")[0].slice(0, 140) + (task.notes.length > 140 ? "..." : "")
    : "";

  const commentCount = task.commentCount ?? cachedCommentCount;

  return (
    <div
      className="flex cursor-pointer transition-colors"
      onClick={onClick}
      style={{
        padding: "10px 20px",
        backgroundColor: isSelected ? "#F0F4FF" : "#FFFFFF",
        borderBottom: "1px solid var(--border-light)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAFA";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFFFF";
      }}
    >
      {/* Left: task info (flex) */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Row 1: Checkbox + Task name + inline metadata */}
        <div className="flex items-center gap-3">
          {/* Completion indicator */}
          <div className="shrink-0" style={{ width: 20 }}>
            {task.completed ? (
              <CheckCircle2 size={18} style={{ color: "var(--status-complete)" }} />
            ) : task.overdue ? (
              <Circle size={18} style={{ color: "var(--status-overdue)" }} />
            ) : (
              <Circle size={18} style={{ color: "#D1D5DB" }} />
            )}
          </div>

          {/* Task name */}
          <span
            className="truncate flex-1 min-w-0"
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {task.name}
          </span>

          {/* Inline chips */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Subtask count */}
            {task.numSubtasks > 0 && (
              <span
                className="flex items-center gap-1"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 12,
                  color: "#9CA3AF",
                }}
                title={`${task.numSubtasks} subtask${task.numSubtasks !== 1 ? "s" : ""}`}
              >
                <ListTree size={13} />
                {task.numSubtasks}
              </span>
            )}

            {/* Comment count (when cached) */}
            {commentCount != null && commentCount > 0 && (
              <span
                className="flex items-center gap-1"
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 12,
                  color: "#9CA3AF",
                }}
                title={`${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
              >
                <MessageCircle size={13} />
                {commentCount}
              </span>
            )}

          </div>
        </div>

        {/* Row 2: Description preview */}
        {descPreview && (
          <div
            className="truncate"
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 12,
              color: "#9CA3AF",
              marginTop: 3,
              paddingLeft: 32,
              lineHeight: 1.4,
            }}
          >
            <AlignLeft
              size={11}
              className="inline-block mr-1"
              style={{ color: "#D1D5DB", verticalAlign: "middle", marginTop: -1 }}
            />
            {descPreview}
          </div>
        )}

        {/* Row 3: Status + Section */}
        <div
          className="flex items-center gap-2"
          style={{ marginTop: 4, paddingLeft: 32 }}
        >
          <span
            className="flex items-center gap-1"
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 11,
              color: statusColor,
            }}
          >
            <div
              className="rounded-full shrink-0"
              style={{ width: 6, height: 6, backgroundColor: statusColor }}
            />
            {statusLabel}
          </span>

          <span style={{ color: "#E5E7EB", fontSize: 11 }}>&middot;</span>

          <span
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 11,
              color: "#9CA3AF",
            }}
          >
            {task.section}
          </span>
        </div>
      </div>

      {/* Handle: Task Name | Assignee boundary */}
      <ResizeHandle onMouseDown={columnResizeStart("assignee", false)} />

      {/* Assignee column */}
      <div
        className="flex items-center shrink-0"
        style={{ width: columnWidths.assignee, alignSelf: "center" }}
      >
        <span
          className="truncate"
          style={{
            fontFamily: "'Aldine721 BT', serif",
            fontSize: 13,
            color: task.assignee ? "var(--text-primary)" : "#D1D5DB",
          }}
        >
          {task.assignee ?? "Unassigned"}
        </span>
      </div>

      {/* Handle: Assignee | Due Date boundary */}
      <ResizeHandle onMouseDown={columnResizeStart("assignee", false)} />

      {/* Due Date column */}
      <div
        className="flex items-center shrink-0"
        style={{ width: columnWidths.dueDate, alignSelf: "center" }}
      >
        <span
          className="flex items-center gap-1"
          style={{
            fontFamily: "'Aldine721 BT', serif",
            fontSize: 13,
            color: task.overdue ? "var(--status-overdue)" : "var(--text-primary)",
            fontWeight: task.overdue ? 600 : 400,
          }}
        >
          {formattedDate}
        </span>
      </div>

      {/* Handle: Due Date | Campaign boundary */}
      <ResizeHandle onMouseDown={columnResizeStart("dueDate", false)} />

      {/* Campaign column */}
      <div
        className="flex items-center shrink-0"
        style={{ width: columnWidths.campaign, alignSelf: "center" }}
      >
        <span
          className="truncate"
          style={{
            fontFamily: "'Aldine721 BT', serif",
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        >
          {task.campaign}
        </span>
      </div>

      {/* Handle: Campaign right edge */}
      <ResizeHandle onMouseDown={columnResizeStart("campaign", false)} />
    </div>
  );
}

// --- Task detail panel ---
function TaskDetailPanel({
  task,
  detail,
  detailLoading,
}: {
  task: TaskItem;
  detail: TaskDetail | null;
  detailLoading: boolean;
}) {
  const formattedDate = task.dueDate
    ? new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No date";

  const statusLabel = task.completed
    ? "Complete"
    : task.overdue
      ? "Overdue"
      : "Open";
  const statusColor = task.completed
    ? "var(--status-complete)"
    : task.overdue
      ? "var(--status-overdue)"
      : "var(--text-primary)";

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Header: name, campaign, metadata */}
      <div
        className="flex flex-col gap-5 shrink-0"
        style={{ padding: 24, borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex flex-col gap-2">
          <span
            style={{
              fontFamily: "'League Gothic', sans-serif",
              fontSize: 26,
              letterSpacing: 1.2,
              color: "var(--text-primary)",
            }}
          >
            {task.name.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 14,
              color: "var(--text-primary)",
            }}
          >
            {task.campaign}
          </span>
        </div>
        <div className="flex gap-8 flex-wrap">
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Due Date
            </span>
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 14,
                color: task.overdue
                  ? "var(--status-overdue)"
                  : "var(--text-primary)",
              }}
            >
              {formattedDate}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Status
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: statusColor,
                }}
              />
              <span
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 14,
                  color: statusColor,
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          {task.assignee && (
            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Assignee
              </span>
              <span
                style={{
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 14,
                  color: "var(--text-primary)",
                }}
              >
                {task.assignee}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Section
            </span>
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            >
              {task.section}
            </span>
          </div>
        </div>
      </div>

      {/* Loading state for details */}
      {detailLoading && (
        <div
          className="flex items-center gap-2 shrink-0"
          style={{ padding: "16px 24px" }}
        >
          <Loader2
            size={14}
            className="animate-spin"
            style={{ color: "var(--text-muted)" }}
          />
          <span
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            Loading details from Asana...
          </span>
        </div>
      )}

      {/* Description */}
      {detail && detail.notes && (
        <div
          className="flex flex-col gap-3 shrink-0"
          style={{ padding: 24, borderBottom: "1px solid var(--border-light)" }}
        >
          <span
            style={{
              fontFamily: "'League Gothic', sans-serif",
              fontSize: 16,
              letterSpacing: 1.2,
              color: "var(--text-primary)",
            }}
          >
            DESCRIPTION
          </span>
          <p
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {detail.notes}
          </p>
        </div>
      )}

      {/* Comments */}
      {detail && (
        <div
          className="flex flex-col gap-4 shrink-0"
          style={{ padding: 24, borderBottom: "1px solid var(--border-light)" }}
        >
          <span
            style={{
              fontFamily: "'League Gothic', sans-serif",
              fontSize: 16,
              letterSpacing: 1.2,
              color: "var(--text-primary)",
            }}
          >
            COMMENTS{" "}
            <span
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 12,
                fontWeight: "normal",
                letterSpacing: 0,
                color: "var(--text-muted)",
              }}
            >
              ({detail.comments.length})
            </span>
          </span>
          {detail.comments.length === 0 ? (
            <p
              style={{
                fontFamily: "'Aldine721 BT', serif",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              No comments yet
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {detail.comments.map((c) => (
                <div
                  key={c.gid}
                  className="flex flex-col gap-1"
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: 6,
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{
                        fontFamily: "'Aldine721 BT', serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {c.author}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Aldine721 BT', serif",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Aldine721 BT', serif",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--text-secondary)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Open in Asana link */}
      {detail?.permalink_url && (
        <div className="shrink-0" style={{ padding: "16px 24px" }}>
          <a
            href={detail.permalink_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            style={{
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 13,
              color: "#2563EB",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={13} />
            Open in Asana
          </a>
        </div>
      )}
    </div>
  );
}

// --- Campaign timeline row ---
function CampaignTimelineRow({
  campaign,
  yearStart,
  todayX,
  timelineWidth,
  calendarData,
  isFirst,
  pixelsPerDay,
  showAllDays,
}: {
  campaign: CampaignData;
  yearStart: Date;
  todayX: number;
  timelineWidth: number;
  calendarData: CalendarMonth[];
  isFirst: boolean;
  pixelsPerDay: number;
  showAllDays: boolean;
}) {
  const datedMilestones = campaign.milestones
    .filter((m) => m.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  // Build phase bars from milestones
  const phaseGroups: Record<string, { minX: number; maxX: number }> = {};
  for (const m of datedMilestones) {
    if (!m.phase || !m.dueDate) continue;
    const x = dateToX(new Date(m.dueDate + "T00:00:00"), yearStart, pixelsPerDay);
    if (!phaseGroups[m.phase]) {
      phaseGroups[m.phase] = { minX: x, maxX: x };
    } else {
      phaseGroups[m.phase].minX = Math.min(phaseGroups[m.phase].minX, x);
      phaseGroups[m.phase].maxX = Math.max(phaseGroups[m.phase].maxX, x);
    }
  }

  // Project start/end for overall bar
  const startX = campaign.startDate
    ? dateToX(new Date(campaign.startDate + "T00:00:00"), yearStart, pixelsPerDay)
    : datedMilestones.length > 0
      ? dateToX(
          new Date(datedMilestones[0].dueDate! + "T00:00:00"),
          yearStart, pixelsPerDay
        )
      : 0;
  const endX = campaign.endDate
    ? dateToX(new Date(campaign.endDate + "T00:00:00"), yearStart, pixelsPerDay)
    : datedMilestones.length > 0
      ? dateToX(
          new Date(
            datedMilestones[datedMilestones.length - 1].dueDate! + "T00:00:00"
          ),
          yearStart, pixelsPerDay
        )
      : 0;

  return (
    <div
      className="relative"
      style={{
        height: ROW_HEIGHT,
        width: timelineWidth,
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {isFirst && (
        <span
          className="absolute"
          style={{
            left: todayX - 16,
            top: 4,
            fontFamily: "'League Gothic', sans-serif",
            fontSize: 11,
            letterSpacing: 0.5,
            color: "#EF4444",
          }}
        >
          TODAY
        </span>
      )}
      <div
        className="absolute"
        style={{
          left: todayX,
          top: 0,
          width: 2,
          height: ROW_HEIGHT,
          backgroundColor: "#EF4444",
          opacity: 0.4,
        }}
      />
      {/* Weekend shading when zoomed in */}
      {showAllDays &&
        calendarData.flatMap((month) =>
          month.days
            .filter((day) => day.isWeekend)
            .map((day) => (
              <div
                key={`wknd-${day.x}`}
                className="absolute"
                style={{
                  left: day.x,
                  top: 0,
                  width: pixelsPerDay,
                  height: ROW_HEIGHT,
                  backgroundColor: "var(--border-light)",
                  opacity: 0.12,
                }}
              />
            ))
        )}
      {calendarData.flatMap((month) =>
        month.days.map((day) => (
          <div
            key={`grid-${day.x}`}
            className="absolute"
            style={{
              left: day.x,
              top: 0,
              width: 1,
              height: ROW_HEIGHT,
              backgroundColor: "var(--border-light)",
              opacity: day.isWeekend && showAllDays ? 0.15 : 0.25,
            }}
          />
        ))
      )}
      {/* Overall campaign bar — centered on PHASE_BAR_Y */}
      {startX > 0 && endX > startX && (
        <div
          className="absolute"
          style={{
            left: startX,
            top: PHASE_BAR_Y - 1,
            width: endX - startX,
            height: 2,
            backgroundColor: "var(--border-medium)",
            borderRadius: 1,
          }}
        />
      )}
      {/* Phase bars — centered on PHASE_BAR_Y */}
      {(["make", "mine", "manage"] as const).map((phase) => {
        const group = phaseGroups[phase];
        if (!group) return null;
        return (
          <div
            key={phase}
            className="absolute"
            style={{
              left: group.minX,
              top: PHASE_BAR_Y - 2,
              width: Math.max(group.maxX - group.minX, 4),
              height: 4,
              backgroundColor: PHASE_COLORS[phase],
              borderRadius: 2,
            }}
          />
        );
      })}
      {/* Milestones — diamond centered on PHASE_BAR_Y, label only on next upcoming */}
      {(() => {
        const today = new Date().toISOString().split("T")[0];
        // Show label on first incomplete milestone: prioritize overdue, then next upcoming
        const firstOverdue = datedMilestones.find(
          (m) => !m.completed && m.dueDate! < today
        );
        const nextUpcoming = firstOverdue ?? datedMilestones.find(
          (m) => !m.completed && m.dueDate! >= today
        );
        return datedMilestones.map((m) => {
          const x = dateToX(new Date(m.dueDate! + "T00:00:00"), yearStart, pixelsPerDay);
          const color = milestoneStatusColor(m);
          const diamondTop = PHASE_BAR_Y - DIAMOND_SIZE / 2 - 2;
          const alwaysShowLabel = nextUpcoming?.gid === m.gid;
          const formattedDate = m.dueDate
            ? new Date(m.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "";
          return (
            <div
              key={m.gid}
              className="absolute flex flex-col items-center group/ms"
              style={{
                left: x,
                top: diamondTop,
                transform: "translateX(-50%)",
                zIndex: alwaysShowLabel ? 2 : 1,
              }}
            >
              <div className="cursor-pointer" style={{ padding: 2 }}>
                <Diamond color={color} />
              </div>
              {/* Always-visible label for next upcoming milestone */}
              {alwaysShowLabel && (
                <span
                  className="text-center mt-1"
                  style={{
                    fontFamily: "'Aldine721 BT', serif",
                    fontSize: 9,
                    width: 64,
                    color: "var(--text-primary)",
                    lineHeight: 1.15,
                  }}
                >
                  {m.name.length > 22
                    ? m.name.substring(0, 20) + "\u2026"
                    : m.name}
                </span>
              )}
              {/* Hover tooltip for all milestones */}
              <div
                className="invisible group-hover/ms:visible absolute pointer-events-none"
                style={{
                  top: DIAMOND_SIZE + 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  padding: "4px 8px",
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.85)",
                  zIndex: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Aldine721 BT', serif",
                    fontSize: 11,
                    color: "#FFFFFF",
                    lineHeight: 1.3,
                  }}
                >
                  {m.name}
                </span>
                {formattedDate && (
                  <span
                    style={{
                      fontFamily: "'Aldine721 BT', serif",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.6)",
                      marginLeft: 6,
                    }}
                  >
                    {formattedDate}
                  </span>
                )}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}

// === MAIN DASHBOARD ===
export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const { campaignDateSort: dueDateSort } = useFilters();
  const [taskSort, setTaskSort] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailCacheRef = useRef<Map<string, TaskDetail>>(new Map());
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const syncingScroll = useRef(false);

  // Fetch task detail (notes + comments) when a task is selected, with cache
  useEffect(() => {
    if (!selectedTask) {
      setTaskDetail(null);
      return;
    }
    const gid = selectedTask.gid;
    const cached = detailCacheRef.current.get(gid);
    if (cached) {
      setTaskDetail(cached);
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setTaskDetail(null);
    fetch(`/api/tasks/${gid}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          detailCacheRef.current.set(gid, data);
          setTaskDetail(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedTask?.gid]);

  // Resizable panels
  const sidebar = useResizable(170, 120, 350, "right");
  const detailPanel = useResizable(520, 320, 800, "left");
  const columns = useColumnResize();

  // Resizable timeline height
  const [timelineHeight, setTimelineHeight] = useState(260);
  const timelineDragRef = useRef({ dragging: false, startY: 0, startH: 0 });
  const onTimelineResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      timelineDragRef.current = {
        dragging: true,
        startY: e.clientY,
        startH: timelineHeight,
      };

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientY - timelineDragRef.current.startY;
        const newH = Math.min(
          600,
          Math.max(120, timelineDragRef.current.startH + delta)
        );
        setTimelineHeight(newH);
      };

      const onMouseUp = () => {
        timelineDragRef.current.dragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [timelineHeight]
  );

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (data.campaigns) setCampaigns(data.campaigns);
      })
      .finally(() => setLoading(false));
  }, []);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const pixelsPerDay = PIXELS_PER_DAY_BASE * zoomLevel;
  const showAllDays = pixelsPerDay >= 35;

  const yearStart = useMemo(() => new Date(2026, 0, 1), []);
  const calendarData = useMemo(
    () => getCalendarData(yearStart, pixelsPerDay),
    [yearStart, pixelsPerDay]
  );
  const totalDays = 365;
  const timelineWidth = totalDays * pixelsPerDay + 60;
  const todayX = dateToX(new Date(), yearStart, pixelsPerDay);

  // Zoom via Ctrl+scroll or pinch — keeps the date under cursor stable
  // Must use a native event listener to prevent default on non-passive wheel events
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  useEffect(() => {
    const container = timelineScrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const cursorXInContainer = e.clientX - rect.left;
      const cursorXInContent = container.scrollLeft + cursorXInContainer;
      const currentZoom = zoomLevelRef.current;
      const oldPpd = PIXELS_PER_DAY_BASE * currentZoom;
      const dayUnderCursor = cursorXInContent / oldPpd;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      // Round to 2 decimal places to avoid floating-point drift
      const newZoom = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + delta)) * 100) / 100;

      if (newZoom === currentZoom) return;

      // flushSync forces the DOM to update synchronously so we can
      // set scrollLeft in the same tick — no frame gap, no jitter
      flushSync(() => setZoomLevel(newZoom));

      const newPpd = PIXELS_PER_DAY_BASE * newZoom;
      const newCursorXInContent = dayUnderCursor * newPpd;
      container.scrollLeft = newCursorXInContent - cursorXInContainer;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [loading]);

  // Flatten tasks from all campaigns
  const sortedCampaigns = useMemo(() => {
    if (!dueDateSort) return campaigns;
    return [...campaigns].sort((a, b) => {
      const aDate = a.endDate ?? "";
      const bDate = b.endDate ?? "";
      if (!aDate) return 1;
      if (!bDate) return -1;
      return dueDateSort === "asc"
        ? aDate.localeCompare(bDate)
        : bDate.localeCompare(aDate);
    });
  }, [campaigns, dueDateSort]);

  const allTasks: TaskItem[] = useMemo(() => {
    const items: TaskItem[] = [];
    for (const c of campaigns) {
      const { name: shortName } = shortCampaignName(c.name);
      for (const t of c.tasks) {
        if (!t.dueDate || t.completed) continue;
        items.push({
          gid: t.gid,
          name: t.name,
          dueDate: t.dueDate,
          campaign: shortName,
          completed: t.completed,
          overdue: t.overdue,
          assignee: t.assignee,
          section: t.section,
          notes: t.notes ?? "",
          numSubtasks: t.numSubtasks ?? 0,
        });
      }
    }
    return items.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return taskSort === "asc"
        ? a.dueDate.localeCompare(b.dueDate)
        : b.dueDate.localeCompare(a.dueDate);
    });
  }, [campaigns, taskSort]);

  // Widget counts
  const overdueCount = allTasks.filter((t) => t.overdue).length;
  const dueThisWeek = allTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate + "T00:00:00");
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);
    return due >= now && due <= weekFromNow;
  }).length;

  function campaignIndicator(c: CampaignData): string {
    const hasOverdue =
      c.milestones.some((m) => m.overdue) || c.tasks.some((t) => t.overdue);
    if (hasOverdue) return "var(--status-overdue)";
    const allComplete =
      c.milestones.length > 0 && c.milestones.every((m) => m.completed);
    if (allComplete) return "var(--status-complete)";
    const hasProgress = c.milestones.some((m) => m.completed);
    if (hasProgress) return "var(--status-warning)";
    return "var(--status-progress)";
  }

  // Scroll timeline to today on mount (only on initial load)
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (timelineScrollRef.current && todayX > 0 && !hasScrolledRef.current && !loading) {
      timelineScrollRef.current.scrollLeft = Math.max(0, todayX - 300);
      hasScrolledRef.current = true;
    }
  }, [todayX, loading]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center flex-1"
        style={{
          fontFamily: "'Aldine721 BT', serif",
          color: "var(--text-secondary)",
        }}
      >
        Loading campaigns from Asana...
      </div>
    );
  }

  return (
    <>
      {/* Campaign timeline area */}
      <div className="flex shrink-0" style={{ height: timelineHeight, overflow: "hidden", borderBottom: "1px solid var(--border-light)" }}>
        {/* Resizable sidebar column */}
        <div className="flex shrink-0">
          <div
            className="flex flex-col shrink-0"
            style={{ width: sidebar.width, overflow: "hidden" }}
          >
            <div
              className="flex items-center justify-between shrink-0"
              style={{
                height: 56,
                padding: "0 14px",
                backgroundColor: "var(--bg-surface)",
                borderBottom: "1px solid var(--border-light)",
                borderRight: "1px solid var(--border-light)",
              }}
            >
              <span
                style={{
                  fontFamily: "'League Gothic', sans-serif",
                  fontSize: 17,
                  letterSpacing: 1.5,
                  color: "#000",
                }}
              >
                CAMPAIGNS
              </span>
              {zoomLevel > MIN_ZOOM && (
                <button
                  onClick={() => {
                    setZoomLevel(MIN_ZOOM);
                    // Scroll to today after zoom resets
                    requestAnimationFrame(() => {
                      if (timelineScrollRef.current) {
                        const todayXReset = dateToX(new Date(), yearStart, PIXELS_PER_DAY_BASE * MIN_ZOOM);
                        timelineScrollRef.current.scrollLeft = Math.max(0, todayXReset - 300);
                      }
                    });
                  }}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                  style={{
                    padding: "2px 6px",
                    borderRadius: 4,
                    backgroundColor: "rgba(0,0,0,0.06)",
                    fontFamily: "'Aldine721 BT', serif",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    border: "none",
                    lineHeight: 1.4,
                  }}
                  title="Reset zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
              )}
            </div>
            <div
              ref={sidebarScrollRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
              onScroll={() => {
                if (syncingScroll.current) return;
                syncingScroll.current = true;
                const el = sidebarScrollRef.current;
                const tl = timelineScrollRef.current;
                if (el && tl) tl.scrollTop = el.scrollTop;
                syncingScroll.current = false;
              }}
            >
              {sortedCampaigns.map((c) => {
                const { name, brand } = shortCampaignName(c.name);
                return (
                  <SidebarEntry
                    key={c.gid}
                    name={name}
                    subtitle={brand}
                    indicatorColor={campaignIndicator(c)}
                    width={sidebar.width}
                  />
                );
              })}
            </div>
          </div>
          <ResizeHandle onMouseDown={sidebar.onMouseDown} />
        </div>
        {/* Scrollable timeline */}
        <div
          className="flex-1 overflow-auto relative"
          ref={timelineScrollRef}
          onScroll={() => {
            if (syncingScroll.current) return;
            syncingScroll.current = true;
            const tl = timelineScrollRef.current;
            const el = sidebarScrollRef.current;
            if (tl && el) el.scrollTop = tl.scrollTop;
            syncingScroll.current = false;
          }}
        >
          <div style={{ width: timelineWidth }}>
            <CalendarHeader
              calendarData={calendarData}
              timelineWidth={timelineWidth}
              showAllDays={showAllDays}
            />
            {sortedCampaigns.map((c, i) => (
              <CampaignTimelineRow
                key={c.gid}
                campaign={c}
                yearStart={yearStart}
                todayX={todayX}
                timelineWidth={timelineWidth}
                calendarData={calendarData}
                isFirst={i === 0}
                pixelsPerDay={pixelsPerDay}
                showAllDays={showAllDays}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Resize edge between timeline and tasks */}
      <div
        onMouseDown={onTimelineResizeDown}
        className="shrink-0 cursor-row-resize group/hresize"
        style={{
          height: 5,
          position: "relative",
        }}
      >
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/hresize:opacity-100 group-active/hresize:opacity-100 transition-opacity"
          style={{
            height: 2,
            backgroundColor: "var(--border-medium)",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Bottom section: widgets + task overview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Widget sidebar — matches campaign sidebar width */}
        <div
          className="flex flex-col shrink-0"
          style={{
            width: sidebar.width + 5,
            backgroundColor: "var(--bg-surface)",
            borderRight: "1px solid var(--border-light)",
            padding: 14,
            gap: 12,
            justifyContent: "flex-start",
          }}
        >
          <Widget
            icon={<MessageCircle size={16} color="#FFF" />}
            label="PENDING RESPONSE"
            count={0}
            subtitle="tasks awaiting your reply"
            color="#FDBA74"
          />
          <Widget
            icon={<TriangleAlert size={16} color="#FFF" />}
            label="OVERDUE"
            count={overdueCount}
            subtitle="tasks past due date"
            color="#F87171"
          />
          <Widget
            icon={<CalendarClock size={16} color="#FFF" />}
            label="DUE THIS WEEK"
            count={dueThisWeek}
            subtitle="tasks due within 7 days"
            color="#60A5FA"
          />
        </div>

        {/* Task overview */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header row */}
          <div
            className="flex shrink-0"
            style={{
              height: 48,
              backgroundColor: "var(--bg-surface)",
              borderBottom: "1px solid var(--border-light)",
              borderTop: "1px solid var(--border-light)",
            }}
          >
            <div
              className="flex items-center flex-1"
              style={{ paddingLeft: 22, paddingRight: 20 }}
            >
              <ListChecks
                size={16}
                style={{ color: "var(--text-primary)" }}
              />
              <span
                style={{
                  marginLeft: 10,
                  fontFamily: "'League Gothic', sans-serif",
                  fontSize: 17,
                  letterSpacing: 1.5,
                  color: "var(--text-primary)",
                }}
              >
                UPCOMING TASKS
              </span>
              <span className="flex-1" />
              {/* Column labels aligned with task row columns */}
              <ResizeHandle onMouseDown={columns.handleResizeStart("assignee", false)} />
              <span
                style={{
                  width: columns.widths.assignee,
                  flexShrink: 0,
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Assignee
              </span>
              <ResizeHandle onMouseDown={columns.handleResizeStart("assignee", false)} />
              <button
                onClick={() => setTaskSort((prev) => (prev === "asc" ? "desc" : "asc"))}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer"
                style={{
                  width: columns.widths.dueDate,
                  flexShrink: 0,
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
                title={taskSort === "asc" ? "Earliest due first" : "Latest due first"}
              >
                Due Date
                <ArrowUpDown size={11} style={{ color: "var(--text-muted)" }} />
              </button>
              <ResizeHandle onMouseDown={columns.handleResizeStart("dueDate", false)} />
              <span
                style={{
                  width: columns.widths.campaign,
                  flexShrink: 0,
                  fontFamily: "'Aldine721 BT', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Campaign
              </span>
              <ResizeHandle onMouseDown={columns.handleResizeStart("campaign", false)} />
            </div>
            {showDetail && (
              <div
                className="flex items-center justify-between shrink-0"
                style={{
                  width: detailPanel.width,
                  padding: "0 20px",
                  borderLeft: "1px solid var(--border-light)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'League Gothic', sans-serif",
                    fontSize: 17,
                    letterSpacing: 1.5,
                    color: "var(--text-primary)",
                  }}
                >
                  TASK DETAILS
                </span>
                <X
                  size={18}
                  className="cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                  onClick={() => setShowDetail(false)}
                />
              </div>
            )}
          </div>

          {/* Content row */}
          <div className="flex flex-1 overflow-hidden">
            {/* Task list */}
            <div className="flex flex-col flex-1 overflow-y-auto">
              {allTasks.map((t) => {
                const cached = detailCacheRef.current.get(t.gid);
                return (
                  <TaskRow
                    key={t.gid}
                    task={t}
                    isSelected={selectedTask?.gid === t.gid}
                    onClick={() => {
                      setSelectedTask(t);
                      setShowDetail(true);
                    }}
                    cachedCommentCount={cached?.comments?.length}
                    columnWidths={columns.widths}
                    columnResizeStart={columns.handleResizeStart}
                  />
                );
              })}
              {allTasks.length === 0 && (
                <div
                  className="flex items-center justify-center py-12"
                  style={{
                    fontFamily: "'Aldine721 BT', serif",
                    color: "var(--text-muted)",
                  }}
                >
                  No upcoming tasks
                </div>
              )}
            </div>

            {/* Resizable detail panel */}
            {showDetail && selectedTask && (
              <div className="flex shrink-0" style={{ borderLeft: "1px solid var(--border-light)" }}>
                <ResizeHandle onMouseDown={detailPanel.onMouseDown} />
                <div style={{ width: detailPanel.width - 5, overflow: "hidden" }}>
                  <TaskDetailPanel
                    task={selectedTask}
                    detail={taskDetail}
                    detailLoading={detailLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
