const ASANA_BASE = 'https://app.asana.com/api/1.0';

function getToken(): string {
  const token = process.env.ASANA_ACCESS_TOKEN;
  if (!token) throw new Error('ASANA_ACCESS_TOKEN not set');
  return token;
}

async function asanaFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ASANA_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Asana API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data as T;
}

// --- Types ---

export interface AsanaProject {
  gid: string;
  name: string;
  start_on: string | null;
  due_on: string | null;
  owner: { gid: string; name: string } | null;
  custom_fields: AsanaCustomField[];
}

interface AsanaCustomField {
  gid: string;
  name: string;
  display_value: string | null;
  date_value?: { date: string | null } | null;
}

export interface AsanaTask {
  gid: string;
  name: string;
  due_on: string | null;
  completed: boolean;
  completed_at: string | null;
  resource_subtype: 'default_task' | 'milestone';
  assignee: { gid: string; name: string } | null;
  memberships: { section: { gid: string; name: string } }[];
}

export interface AsanaSection {
  gid: string;
  name: string;
}

// --- Section → Phase mapping ---

const MAKE_SECTIONS = ['Client Business Planning', 'Media Strategy'];
const MINE_SECTIONS = ['Media Planning', 'Buying Strategy', 'Approvals', 'Placement / Platform Setup'];
const MANAGE_SECTIONS = ['QA / Launch', 'Reporting & Optimization', 'Financial Reconciliation'];

export type Phase = 'make' | 'mine' | 'manage';

export function sectionToPhase(sectionName: string): Phase | null {
  if (MAKE_SECTIONS.includes(sectionName)) return 'make';
  if (MINE_SECTIONS.includes(sectionName)) return 'mine';
  if (MANAGE_SECTIONS.includes(sectionName)) return 'manage';
  // Handle sections with slightly different names (e.g. "Media Plan Approvals", "Pre-Live Campaign Checks")
  if (sectionName.includes('Approv')) return 'mine';
  if (sectionName.includes('Launch') || sectionName.includes('Live') || sectionName.includes('QA') || sectionName.includes('DPA')) return 'manage';
  if (sectionName.includes('Media Plan')) return 'mine';
  return null;
}

// --- API functions ---

export async function getProject(projectGid: string): Promise<AsanaProject> {
  return asanaFetch<AsanaProject>(`/projects/${projectGid}`, {
    opt_fields: 'name,start_on,due_on,owner.name,custom_fields',
  });
}

export async function getProjectSections(projectGid: string): Promise<AsanaSection[]> {
  return asanaFetch<AsanaSection[]>(`/projects/${projectGid}/sections`, {
    opt_fields: 'name',
  });
}

export async function getProjectTasks(projectGid: string): Promise<AsanaTask[]> {
  return asanaFetch<AsanaTask[]>(`/tasks`, {
    project: projectGid,
    opt_fields: 'name,due_on,completed,completed_at,resource_subtype,assignee.name,memberships.section.name',
    limit: '100',
  });
}

// --- Task detail (notes + permalink) ---

export interface AsanaTaskDetail {
  gid: string;
  notes: string;
  permalink_url: string;
}

export async function getTaskDetail(taskGid: string): Promise<AsanaTaskDetail> {
  return asanaFetch<AsanaTaskDetail>(`/tasks/${taskGid}`, {
    opt_fields: 'notes,permalink_url',
  });
}

// --- Task comments (stories) ---

export interface AsanaComment {
  gid: string;
  created_at: string;
  text: string;
  created_by: { gid: string; name: string } | null;
  type: string;
}

export async function getTaskComments(taskGid: string): Promise<AsanaComment[]> {
  const stories = await asanaFetch<AsanaComment[]>(`/tasks/${taskGid}/stories`, {
    opt_fields: 'created_at,text,created_by.name,type',
  });
  // Only return actual comments, not system stories
  return stories.filter((s) => s.type === 'comment');
}

export interface CampaignMilestone {
  gid: string;
  name: string;
  dueDate: string | null;
  completed: boolean;
  overdue: boolean;
  phase: Phase | null;
  section: string;
}

export interface CampaignData {
  gid: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  launchDate: string | null;
  owner: string | null;
  milestones: CampaignMilestone[];
  tasks: {
    gid: string;
    name: string;
    dueDate: string | null;
    completed: boolean;
    overdue: boolean;
    assignee: string | null;
    section: string;
  }[];
}

export async function getCampaignData(projectGid: string): Promise<CampaignData> {
  const [project, tasks] = await Promise.all([
    getProject(projectGid),
    getProjectTasks(projectGid),
  ]);

  const today = new Date().toISOString().split('T')[0];

  const launchField = project.custom_fields.find(f => f.name === 'Launch Date');
  const launchDate = launchField?.date_value?.date ?? null;

  const milestones: CampaignMilestone[] = [];
  const regularTasks: CampaignData['tasks'] = [];

  for (const task of tasks) {
    const sectionName = task.memberships[0]?.section?.name ?? '';
    if (sectionName === 'Untitled section') continue;
    // Skip template/emoji header tasks
    if (task.name.startsWith('✨')) continue;

    const isOverdue = !task.completed && task.due_on != null && task.due_on < today;

    if (task.resource_subtype === 'milestone') {
      milestones.push({
        gid: task.gid,
        name: task.name,
        dueDate: task.due_on,
        completed: task.completed,
        overdue: isOverdue,
        phase: sectionToPhase(sectionName),
        section: sectionName,
      });
    } else {
      regularTasks.push({
        gid: task.gid,
        name: task.name,
        dueDate: task.due_on,
        completed: task.completed,
        overdue: isOverdue,
        assignee: task.assignee?.name ?? null,
        section: sectionName,
      });
    }
  }

  return {
    gid: project.gid,
    name: project.name,
    startDate: project.start_on,
    endDate: project.due_on,
    launchDate,
    owner: project.owner?.name ?? null,
    milestones,
    tasks: regularTasks,
  };
}
