export interface Milestone {
  name: string;
  status: 'complete' | 'progress' | 'warning' | 'overdue' | 'notstarted';
  x: number;
  label?: string;
}

export interface TimelinePhase {
  color: string;
  x: number;
  width: number;
}

export interface Campaign {
  name: string;
  indicator: string;
  subtitle: string;
  phases: TimelinePhase[];
  milestones: Milestone[];
}

export interface Task {
  id: string;
  name: string;
  dueDate: string;
  campaign: string;
  status: string;
  statusColor: string;
  dateColor?: string;
}

export interface Comment {
  author: string;
  avatarColor: string;
  time: string;
  body: string;
}

// --- Timeline constants ---
export const PIXELS_PER_DAY = 14;
const YEAR_START = new Date(2026, 0, 1);
export const TOTAL_DAYS = 365;
export const TIMELINE_WIDTH = TOTAL_DAYS * PIXELS_PER_DAY + 60;

export function dateToX(date: Date): number {
  const diff = date.getTime() - YEAR_START.getTime();
  return Math.round(diff / 86400000) * PIXELS_PER_DAY;
}

export const TODAY_X = dateToX(new Date(2026, 2, 7));

// --- Calendar data for all of 2026 ---
export interface CalendarMonth {
  name: string;
  startX: number;
  width: number;
  mondays: { label: string; x: number; isFirstOfMonth: boolean }[];
}

export function getCalendarData(): CalendarMonth[] {
  const result: CalendarMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(2026, m, 1);
    const nextMonthStart = new Date(2026, m + 1, 1);

    const mondays: { label: string; x: number; isFirstOfMonth: boolean }[] = [];
    const d = new Date(2026, m, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    while (d.getMonth() === m) {
      mondays.push({
        label: d.getDate().toString(),
        x: dateToX(d),
        isFirstOfMonth: d.getDate() <= 7,
      });
      d.setDate(d.getDate() + 7);
    }

    result.push({
      name: monthStart.toLocaleString('en-US', { month: 'long' }).toUpperCase() + ' 2026',
      startX: dateToX(monthStart),
      width: dateToX(nextMonthStart) - dateToX(monthStart),
      mondays,
    });
  }
  return result;
}

export const calendarData = getCalendarData();

// --- Campaign builder ---
const milestoneNames = ['Brief','Audience','Kickoff','Console','Import','DAB Form','Send DAB','Monitor','Review','Approve','Block Chrt','Lock','Send K.','Traffic','Input','Approve TS','Setup','Execute','Monitor','Report','Share'];

function ms(name: string, status: string, x: number, label?: string): Milestone {
  return { name, status: status as Milestone['status'], x, label };
}

function buildCampaign(
  name: string,
  indicator: string,
  subtitle: string,
  startDate: Date,
  endDate: Date,
  statusFn: (i: number) => { status: string; label?: string },
): Campaign {
  const totalMs = milestoneNames.length;
  const startTime = startDate.getTime();
  const totalDuration = endDate.getTime() - startTime;
  const spacing = totalDuration / (totalMs - 1);

  const milestones = milestoneNames.map((n, i) => {
    const date = new Date(startTime + i * spacing);
    const { status, label } = statusFn(i);
    return ms(n, status, dateToX(date), label);
  });

  // Phases: Make (0-3), Mine (3-12), Manage (12-20)
  const phases: TimelinePhase[] = [
    { color: 'var(--phase-make)', x: milestones[0].x, width: milestones[3].x - milestones[0].x },
    { color: 'var(--phase-mine)', x: milestones[3].x, width: milestones[12].x - milestones[3].x },
    { color: 'var(--phase-manage)', x: milestones[12].x, width: milestones[20].x - milestones[12].x },
  ];

  return { name, indicator, subtitle, phases, milestones };
}

export const campaigns: Campaign[] = [
  buildCampaign(
    "HELLMANN'S MAYO", 'var(--status-warning)', "Hellmann's",
    new Date(2026, 1, 1), new Date(2026, 6, 15),
    (i) => {
      if (i < 8) return { status: 'complete' };
      if (i === 8) return { status: 'warning', label: 'Review' };
      if (i === 9) return { status: 'notstarted', label: 'Approve' };
      if (i >= 10 && i <= 12) return { status: 'notstarted' };
      if (i === 13) return { status: 'progress', label: 'Traffic' };
      if (i === 14) return { status: 'notstarted', label: 'Input' };
      return { status: 'notstarted' };
    },
  ),
  buildCampaign(
    'KNORR RECIPE', 'var(--status-overdue)', 'Knorr',
    new Date(2026, 0, 15), new Date(2026, 5, 1),
    (i) => {
      if (i < 4) return { status: 'complete' };
      if (i === 4) return { status: 'overdue', label: 'Import' };
      if (i === 5) return { status: 'notstarted', label: 'DAB Form' };
      return { status: 'notstarted' };
    },
  ),
  buildCampaign(
    'OLLY VITAMIN', 'var(--status-overdue)', 'OLLY',
    new Date(2026, 2, 1), new Date(2026, 7, 15),
    (i) => {
      if (i < 4) return { status: 'complete' };
      if (i === 4) return { status: 'overdue' };
      if (i === 5) return { status: 'overdue', label: 'DAB Form' };
      if (i === 6) return { status: 'notstarted', label: 'Send DAB' };
      if (i >= 7 && i <= 9) return { status: 'notstarted' };
      if (i === 10) return { status: 'overdue', label: 'Block Chrt' };
      if (i === 11) return { status: 'notstarted', label: 'Lock' };
      if (i >= 12 && i <= 18) return { status: 'notstarted' };
      if (i === 19) return { status: 'warning', label: 'Report' };
      if (i === 20) return { status: 'notstarted', label: 'Share' };
      return { status: 'notstarted' };
    },
  ),
  buildCampaign(
    'LIQUID IV', 'var(--status-complete)', 'Liquid IV',
    new Date(2026, 0, 5), new Date(2026, 3, 15),
    () => ({ status: 'complete' }),
  ),
];

export const tasks: Task[] = [
  { id: '1', name: 'Review Creative Brief', dueDate: 'Mar 12', campaign: "Hellmann's Mayo", status: 'In Progress', statusColor: 'var(--status-progress)' },
  { id: '2', name: 'Upload DAB Form', dueDate: 'Mar 15', campaign: 'Knorr Recipe', status: 'Overdue', statusColor: 'var(--status-overdue)', dateColor: 'var(--status-overdue)' },
  { id: '3', name: 'Approve Block Chart', dueDate: 'Mar 20', campaign: 'OLLY Vitamin', status: 'Pending', statusColor: 'var(--status-warning)' },
  { id: '4', name: 'Send Traffic Sheet', dueDate: 'Mar 18', campaign: "Hellmann's Mayo", status: 'Not Started', statusColor: 'var(--text-primary)' },
  { id: '5', name: 'Review Campaign Report', dueDate: 'Apr 5', campaign: 'OLLY Vitamin', status: 'Not Started', statusColor: 'var(--text-primary)' },
];

export const taskDetail = {
  name: 'Review Creative Brief',
  campaign: "Hellmann's Mayo",
  dueDate: 'March 12, 2026',
  status: 'In Progress',
  statusColor: 'var(--status-progress)',
  assignee: 'Lucus Dato',
  description: "Review the creative brief for the Hellmann's Mayo spring campaign. Ensure all brand guidelines are followed, target audience is correctly defined, and KPIs align with the overall media strategy. Flag any concerns before the kickoff meeting.",
};

export const comments: Comment[] = [
  { author: 'Henna Parekh', avatarColor: '#7DD3E8', time: '2h ago', body: "I've reviewed the target audience section — looks good. Can we add a note about the Gen Z segment we discussed last week?" },
  { author: 'Lucus Dato', avatarColor: '#F59E0B', time: '1h ago', body: "Good call. I'll update the brief with the Gen Z insights from the research deck. Should have it ready by EOD." },
  { author: 'Danielle Cheung', avatarColor: '#8B5CF6', time: '30m ago', body: "Also flagging — the KPI targets need to be updated per the new quarterly goals. I'll share the revised numbers in Slack." },
];
