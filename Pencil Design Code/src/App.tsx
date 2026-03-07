import { useState, useRef } from 'react';
import { ArrowUpDown, SlidersHorizontal, User, ListChecks, X, MessageCircle, TriangleAlert, CalendarClock, ExternalLink } from 'lucide-react';
import { campaigns, tasks, taskDetail, comments, calendarData, TIMELINE_WIDTH, TODAY_X, type Task, type Campaign, type Milestone } from './data';

const statusColorMap: Record<string, string> = {
  complete: '#10B981',
  progress: '#3B82F6',
  warning: '#F59E0B',
  overdue: '#EF4444',
  notstarted: '#D1D5DB',
};

function Diamond({ color }: { color: string }) {
  return (
    <div
      className="shrink-0"
      style={{
        width: 16,
        height: 16,
        backgroundColor: color,
        borderRadius: 3,
        transform: 'rotate(45deg)',
      }}
    />
  );
}

function MilestoneNode({ milestone }: { milestone: Milestone }) {
  const color = statusColorMap[milestone.status] || '#D1D5DB';
  // The diamond is 16x16 rotated 45°, bounding box ≈ 22.6px.
  // We use translate(-50%) to perfectly center the node on milestone.x
  return (
    <div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: milestone.x,
        top: 50,
        transform: 'translateX(-50%)',
      }}
    >
      <Diamond color={color} />
      {milestone.label && (
        <span
          className="text-center"
          style={{
            fontFamily: "'Aldine721 BT', serif",
            fontSize: 11,
            fontWeight: 500,
            width: 56,
            color: '#000',
          }}
        >
          {milestone.label}
        </span>
      )}
    </div>
  );
}


function CalendarHeader() {
  return (
    <div
      className="relative shrink-0"
      style={{
        height: 56,
        width: TIMELINE_WIDTH,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      {/* Month labels */}
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
            color: 'var(--text-primary)',
          }}
        >
          {month.name}
        </span>
      ))}
      {/* Monday day numbers */}
      {calendarData.flatMap((month) =>
        month.mondays.map((monday) => (
          <span
            key={`d-${monday.x}`}
            className="absolute text-center"
            style={{
              left: monday.x - 15,
              top: 32,
              width: 30,
              fontFamily: "'Aldine721 BT', serif",
              fontSize: 12,
              fontWeight: monday.isFirstOfMonth ? 700 : 'normal',
              color: monday.isFirstOfMonth ? '#2563EB' : 'var(--text-muted)',
            }}
          >
            {monday.label}
          </span>
        ))
      )}
      {/* Monday tick marks */}
      {calendarData.flatMap((month) =>
        month.mondays.map((monday) => (
          <div
            key={`tick-${monday.x}`}
            className="absolute"
            style={{
              left: monday.x,
              top: 48,
              width: 1,
              height: 8,
              backgroundColor: 'var(--border-light)',
            }}
          />
        ))
      )}
    </div>
  );
}

function SidebarEntry({ name, subtitle, indicatorColor }: { name: string; subtitle: string; indicatorColor: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center shrink-0"
      style={{
        width: 170,
        height: 100,
        padding: 14,
        gap: 4,
        borderRight: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: '#FFFFFF',
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
            color: 'var(--text-primary)',
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
          color: '#000',
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}

function Widget({ icon, label, count, subtitle, color }: { icon: React.ReactNode; label: string; count: number; subtitle: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        backgroundColor: color,
        borderRadius: 8,
        padding: '12px 14px',
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
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
      <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 32, color: '#FFFFFF', lineHeight: 1 }}>
        {count}
      </span>
      <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 10, color: '#FFFFFF' }}>
        {subtitle}
      </span>
    </div>
  );
}

function TaskRow({ task, isSelected, onClick }: { task: Task; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      className="flex items-center cursor-pointer hover:bg-gray-50"
      onClick={onClick}
      style={{
        height: 48,
        padding: '0 20px',
        backgroundColor: isSelected ? '#F3F4F6' : '#FFFFFF',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: 'var(--text-primary)', flex: '1 1 0', minWidth: 0 }}>
        {task.name}
      </span>
      <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: task.dateColor || 'var(--text-primary)', width: 100, flexShrink: 0 }}>
        {task.dueDate}
      </span>
      <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: 'var(--text-primary)', width: 150, flexShrink: 0 }}>
        {task.campaign}
      </span>
      <span className="flex items-center gap-1.5" style={{ width: 120, flexShrink: 0 }}>
        <div className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: task.statusColor }} />
        <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: task.statusColor }}>{task.status}</span>
      </span>
    </div>
  );
}

function InlineTaskDetail() {
  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        width: 420,
        flexShrink: 0,
        borderLeft: '1px solid var(--border-light)',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Task info */}
      <div
        className="flex flex-col gap-5"
        style={{ padding: 24, borderBottom: '1px solid var(--border-light)' }}
      >
        <div className="flex flex-col gap-2">
          <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 26, letterSpacing: 1.2, color: 'var(--text-primary)' }}>
            {taskDetail.name}
          </span>
          <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: 'var(--text-primary)' }}>
            {taskDetail.campaign}
          </span>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Due Date</span>
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: 'var(--text-primary)' }}>{taskDetail.dueDate}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Status</span>
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: taskDetail.statusColor }} />
              <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: taskDetail.statusColor }}>{taskDetail.status}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Assignee</span>
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 14, color: 'var(--text-primary)' }}>{taskDetail.assignee}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        className="flex flex-col gap-3"
        style={{ padding: 24, borderBottom: '1px solid var(--border-light)' }}
      >
        <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 16, letterSpacing: 1.2, color: 'var(--text-primary)' }}>
          DESCRIPTION
        </span>
        <p style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
          {taskDetail.description}
        </p>
      </div>

      {/* Comments */}
      <div className="flex flex-col gap-4 flex-1" style={{ padding: 24 }}>
        <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 16, letterSpacing: 1.2, color: 'var(--text-primary)' }}>
          COMMENTS
        </span>
        {comments.map((c, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 w-full">
              <div className="rounded-full shrink-0" style={{ width: 28, height: 28, backgroundColor: c.avatarColor }} />
              <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {c.author}
              </span>
              <span className="flex-1" />
              <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, color: 'var(--text-primary)' }}>
                {c.time}
              </span>
            </div>
            <p style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandedTaskDetail() {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        width: 400,
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 36,
          padding: '0 16px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-light)',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 13, letterSpacing: 1.5, color: 'var(--text-primary)' }}>
          TASK DETAILS
        </span>
        <X size={14} className="cursor-pointer" style={{ color: 'var(--text-primary)' }} />
      </div>

      {/* Task info */}
      <div className="flex flex-col gap-4" style={{ padding: 20, borderBottom: '1px solid var(--border-light)' }}>
        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 20, letterSpacing: 1, color: 'var(--text-primary)' }}>
            REVIEW CREATIVE BRIEF
          </span>
          <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 11, color: 'var(--text-primary)' }}>
            Hellmann's Mayo
          </span>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 9, fontWeight: 700, color: 'var(--text-primary)' }}>Due Date</span>
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 11, color: 'var(--text-primary)' }}>March 12, 2026</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 9, fontWeight: 700, color: 'var(--text-primary)' }}>Status</span>
            <div className="flex items-center gap-1">
              <div className="rounded-full" style={{ width: 6, height: 6, backgroundColor: '#3B82F6' }} />
              <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 11, color: '#3B82F6' }}>In Progress</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 9, fontWeight: 700, color: 'var(--text-primary)' }}>Assignee</span>
            <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 11, color: 'var(--text-primary)' }}>Lucus Dato</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2" style={{ padding: 20, borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 12, letterSpacing: 1, color: 'var(--text-primary)' }}>
          DESCRIPTION
        </span>
        <p style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 10, lineHeight: 1.5, color: 'var(--text-primary)' }}>
          {taskDetail.description}
        </p>
      </div>

      {/* Comments */}
      <div className="flex flex-col gap-3 flex-1" style={{ padding: 20 }}>
        <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 12, letterSpacing: 1, color: 'var(--text-primary)' }}>
          COMMENTS
        </span>
        {comments.map((c, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 w-full">
              <div className="rounded-full shrink-0" style={{ width: 20, height: 20, backgroundColor: c.avatarColor }} />
              <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>{c.author}</span>
              <span className="flex-1" />
              <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 9, color: 'var(--text-primary)' }}>{c.time}</span>
            </div>
            <p style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 10, lineHeight: 1.5, color: 'var(--text-primary)' }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* Open in Asana button */}
      <div
        className="flex items-center justify-center"
        style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)' }}
      >
        <a
          href="#"
          className="flex items-center justify-center gap-1.5 no-underline"
          style={{
            backgroundColor: '#F06A6A',
            color: '#FFFFFF',
            borderRadius: 6,
            padding: '8px 20px',
            fontFamily: "'Aldine721 BT', serif",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <ExternalLink size={12} color="#FFFFFF" />
          Open in Asana
        </a>
      </div>
    </div>
  );
}

const sidebarCampaigns = [
  { name: 'BACK TO SCHOOL', subtitle: "Hellmann's", indicatorColor: '#F59E0B' },
  { name: 'LOCAL STAR STORY', subtitle: 'Knorr', indicatorColor: '#EF4444' },
  { name: 'SUMMER', subtitle: 'OLLY', indicatorColor: '#EF4444' },
  { name: 'SUGAR FREE', subtitle: 'Liquid IV', indicatorColor: '#10B981' },
];

export default function App() {
  const [selectedTask, setSelectedTask] = useState<string | null>('1');
  const [showDetail, setShowDetail] = useState(true);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col overflow-hidden" style={{ width: '100vw', height: '100vh', backgroundColor: '#FFFFFF' }}>
      <div
        className="flex flex-col overflow-hidden flex-1"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            height: 52,
            padding: '0 28px',
            background: 'linear-gradient(180deg, #D4EEF5 0%, #7DD3E8 100%)',
          }}
        >
          <img src="/mediaos-logo.png" alt="MEDIAOS" style={{ height: 44 }} />
          <div className="flex items-center gap-4">
            {[
              { icon: <ArrowUpDown size={16} color="#FFF" strokeWidth={2.5} />, label: 'Sort' },
              { icon: <SlidersHorizontal size={16} color="#FFF" strokeWidth={2.5} />, label: 'Filters' },
              { icon: <User size={16} color="#FFF" strokeWidth={2.5} />, label: 'Lucus Dato' },
            ].map((btn, i) => (
              <button
                key={i}
                className="flex items-center justify-center border-0 cursor-pointer"
                style={{
                  backgroundColor: '#000',
                  borderRadius: 4,
                  padding: '6px 16px',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {btn.icon}
                <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 13, fontWeight: 500, color: '#FFF' }}>
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main body */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Campaign timeline area: fixed sidebar + scrollable timeline */}
          <div className="flex shrink-0">
            {/* Fixed sidebar column */}
            <div className="flex flex-col shrink-0" style={{ width: 170 }}>
              {/* Sidebar header */}
              <div
                className="flex items-center"
                style={{
                  height: 56,
                  padding: '0 14px',
                  backgroundColor: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-light)',
                  borderRight: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 17, letterSpacing: 1.5, color: '#000' }}>
                  CAMPAIGNS
                </span>
              </div>
              {/* Sidebar entries */}
              {sidebarCampaigns.map((sc, i) => (
                <SidebarEntry key={i} name={sc.name} subtitle={sc.subtitle} indicatorColor={sc.indicatorColor} />
              ))}
            </div>
            {/* Scrollable timeline column */}
            <div className="flex-1 overflow-x-auto" ref={timelineScrollRef}>
              <div style={{ width: TIMELINE_WIDTH }}>
                <CalendarHeader />
                {campaigns.map((c, i) => (
                  <div
                    key={i}
                    className="relative"
                    style={{
                      height: 100,
                      width: TIMELINE_WIDTH,
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    {/* Today label */}
                    {i === 0 && (
                      <span
                        className="absolute"
                        style={{
                          left: TODAY_X - 16,
                          top: 4,
                          fontFamily: "'League Gothic', sans-serif",
                          fontSize: 11,
                          letterSpacing: 0.5,
                          color: '#EF4444',
                        }}
                      >
                        TODAY
                      </span>
                    )}
                    {/* Today line */}
                    <div
                      className="absolute"
                      style={{
                        left: TODAY_X,
                        top: 0,
                        width: 2,
                        height: 100,
                        backgroundColor: '#EF4444',
                        opacity: 0.4,
                      }}
                    />
                    {/* Weekly gridlines */}
                    {calendarData.flatMap((month) =>
                      month.mondays.map((monday) => (
                        <div
                          key={`grid-${monday.x}`}
                          className="absolute"
                          style={{
                            left: monday.x,
                            top: 0,
                            width: 1,
                            height: 100,
                            backgroundColor: 'var(--border-light)',
                            opacity: 0.25,
                          }}
                        />
                      ))
                    )}
                    {/* Phase bars */}
                    {c.phases.map((phase, pi) => (
                      <div
                        key={pi}
                        className="absolute"
                        style={{
                          left: phase.x,
                          top: 57,
                          width: phase.width,
                          height: 3,
                          backgroundColor: phase.color,
                          borderRadius: 1,
                        }}
                      />
                    ))}
                    {/* Milestones */}
                    {c.milestones.map((ms, mi) => (
                      <MilestoneNode key={mi} milestone={ms} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom section: widgets + task overview */}
          <div className="flex flex-1 overflow-hidden">
            {/* Widget sidebar area */}
            <div
              className="flex flex-col shrink-0"
              style={{
                width: 170,
                backgroundColor: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-light)',
                padding: 14,
                gap: 12,
                justifyContent: 'flex-start',
              }}
            >
              <Widget
                icon={<MessageCircle size={16} color="#FFF" />}
                label="PENDING RESPONSE"
                count={3}
                subtitle="tasks awaiting your reply"
                color="#FDBA74"
              />
              <Widget
                icon={<TriangleAlert size={16} color="#FFF" />}
                label="OVERDUE"
                count={5}
                subtitle="tasks past due date"
                color="#F87171"
              />
              <Widget
                icon={<CalendarClock size={16} color="#FFF" />}
                label="DUE THIS WEEK"
                count={8}
                subtitle="tasks due within 7 days"
                color="#60A5FA"
              />
            </div>

            {/* Task overview */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Shared header row spanning full width */}
              <div
                className="flex shrink-0"
                style={{
                  height: 48,
                  backgroundColor: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-light)',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                {/* Upcoming Tasks header */}
                <div
                  className="flex items-center flex-1"
                  style={{ paddingLeft: 22, paddingRight: 16 }}
                >
                  <ListChecks size={16} style={{ color: 'var(--text-primary)' }} />
                  <span
                    style={{
                      marginLeft: 10,
                      fontFamily: "'League Gothic', sans-serif",
                      fontSize: 17,
                      letterSpacing: 1.5,
                      color: 'var(--text-primary)',
                    }}
                  >
                    UPCOMING TASKS
                  </span>
                  <span className="flex-1" />
                  <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, color: 'var(--text-primary)' }}>
                    {tasks.length} tasks
                  </span>
                </div>
                {/* Task Details header */}
                {showDetail && (
                  <div
                    className="flex items-center justify-between shrink-0"
                    style={{
                      width: 420,
                      padding: '0 20px',
                      borderLeft: '1px solid var(--border-light)',
                    }}
                  >
                    <span style={{ fontFamily: "'League Gothic', sans-serif", fontSize: 17, letterSpacing: 1.5, color: 'var(--text-primary)' }}>
                      TASK DETAILS
                    </span>
                    <X size={18} className="cursor-pointer" style={{ color: 'var(--text-primary)' }} onClick={() => setShowDetail(false)} />
                  </div>
                )}
              </div>

              {/* Content row */}
              <div className="flex flex-1 overflow-hidden">
              {/* Task list */}
              <div className="flex flex-col flex-1 overflow-y-auto">

                {/* Column header */}
                <div
                  className="flex items-center"
                  style={{
                    height: 36,
                    padding: '0 20px',
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: '1 1 0', minWidth: 0 }}>Task</span>
                  <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 100, flexShrink: 0 }}>Due Date</span>
                  <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 150, flexShrink: 0 }}>Campaign</span>
                  <span style={{ fontFamily: "'Aldine721 BT', serif", fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 120, flexShrink: 0 }}>Status</span>
                </div>

                {/* Task rows */}
                {tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    isSelected={selectedTask === t.id}
                    onClick={() => {
                      setSelectedTask(t.id);
                      setShowDetail(true);
                    }}
                  />
                ))}
              </div>

              {/* Inline task detail */}
              {showDetail && (
                <InlineTaskDetail />
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
