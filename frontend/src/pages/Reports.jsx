import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, CheckCircle2, AlertTriangle, Upload, Users, HardDrive,
  Clock, Download, FileText, Activity, ChevronDown, Loader2,
} from 'lucide-react';
import { exportCSV, exportExcel } from '../utils/reportExport';

const C = {
  indigo: '#4F46E5', sky: '#0EA5E9', emerald: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
  pink: '#EC4899', gray: '#94A3B8', teal: '#14B8A6',
  violet: '#7C3AED', cyan: '#06B6D4', orange: '#F97316',
};

const PALETTE = [C.indigo, C.sky, C.emerald, C.amber, C.red, C.purple, C.pink, C.teal, C.violet, C.cyan, C.orange];

const SEV_COLORS = { CRITICAL: C.red, HIGH: C.amber, MEDIUM: C.amber, LOW: C.sky, UNKNOWN: C.gray };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

function getMonthLabel(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl text-sm">
      {label && <p className="font-semibold text-gray-900 mb-1">{label}</p>}
      {payload.map((e, i) => (
        <p key={i} className="text-gray-600 mt-0.5 flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
          {e.name}: <span className="font-medium text-gray-900">{e.value}{e.payload?.suffix || ''}</span>
        </p>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden dark:bg-[#1e293b] dark:border-gray-700">
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14`, color }}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums dark:text-white">{value}</div>
        {subtitle && <p className="text-[11px] text-gray-400 mt-1 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
      {Icon && <Icon className="w-10 h-10 mb-3 text-gray-200 dark:text-gray-600" />}
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}

const reportExportBtn = (onClick, label, color, bg) =>
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 ${bg} ${color} border rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity`}>
    <Download className="w-3.5 h-3.5" /> {label}
  </button>;

export default function Reports() {
  useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(r => {
        const list = r.data || [];
        setProjects(list);
        if (list.length > 0) setSelectedId(list[0].id);
        else setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      api.get(`/projects/${selectedId}/documents`).catch(() => ({ data: [] })),
      api.get('/project-deliverables').catch(() => ({ data: [] })),
      api.get(`/security/tasks?projectId=${selectedId}`).catch(() => ({ data: [] })),
      api.get(`/risks?projectId=${selectedId}`).catch(() => ({ data: [] })),
      api.get(`/projects/${selectedId}/documents/audit`).catch(() => ({ data: [] })),
      api.get('/team').catch(() => ({ data: [] })),
    ]).then(([docs, dels, tasks, risks, audit, team]) => {
      const deliverables = (dels.data || []).filter(
        d => d.projectId === selectedId || d.projectId == selectedId
      );
      setRaw({ documents: docs.data || [], deliverables, tasks: tasks.data || [], risks: risks.data || [], audit: audit.data || [], team: team.data || [] });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedId]);

  const project = useMemo(() => projects.find(p => p.id === selectedId), [projects, selectedId]);

  const kpiDeliverables = useMemo(() => {
    if (!raw) return { done: 0, total: 0 };
    const total = raw.deliverables.length;
    const done = raw.deliverables.filter(d => d.status === 'DONE' || d.status === 'COMPLETED').length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [raw]);

  const kpiTasks = useMemo(() => {
    if (!raw) return { open: 0, inProgress: 0, done: 0 };
    const tasks = raw.tasks || [];
    return {
      open: tasks.filter(t => t.status === 'OPEN' || t.status === 'PENDING').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done: tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED' || t.status === 'CLOSED').length,
    };
  }, [raw]);

  const kpiRisks = useMemo(() => {
    if (!raw) return { open: 0, critical: 0 };
    const risks = raw.risks || [];
    return {
      open: risks.filter(r => r.status === 'OPEN').length,
      critical: risks.filter(r => r.impact === 'CRITICAL' || r.impact === 'HIGH').length,
      mitigated: risks.filter(r => r.status === 'MITIGATED' || r.status === 'CLOSED').length,
    };
  }, [raw]);

  const teamContrib = useMemo(() => {
    if (!raw) return [];
    const { documents, tasks, team } = raw;
    const uploadCount = {};
    (documents || []).forEach(d => {
      const name = d.uploadedBy || 'Unknown';
      uploadCount[name] = (uploadCount[name] || 0) + 1;
    });
    const taskCount = {};
    (tasks || []).forEach(t => {
      const name = t.assignee || 'Unassigned';
      taskCount[name] = (taskCount[name] || 0) + 1;
    });
    const result = [];
    team.forEach(m => {
      const name = m.name || 'Unknown';
      result.push({ name, uploads: uploadCount[name] || 0, tasks: taskCount[name] || 0 });
    });
    Object.keys(uploadCount).forEach(n => {
      if (!result.find(r => r.name === n)) result.push({ name: n, uploads: uploadCount[n], tasks: taskCount[n] || 0 });
    });
    result.sort((a, b) => (b.uploads + b.tasks) - (a.uploads + a.tasks));
    return result.slice(0, 8);
  }, [raw]);

  const uploadedDocsTimeline = useMemo(() => {
    if (!raw?.documents?.length) return [];
    const byMonth = {};
    raw.documents.forEach(d => {
      const date = d.createdAt || d.uploadTimestamp;
      if (date) {
        const m = getMonthLabel(date);
        byMonth[m] = (byMonth[m] || 0) + 1;
      }
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([name, value]) => ({ name, value }));
  }, [raw]);

  const storageByType = useMemo(() => {
    if (!raw?.documents?.length) return [];
    const byType = {};
    raw.documents.forEach(d => {
      const ext = (d.fileType || (d.originalFilename || '').split('.').pop() || 'unknown').toUpperCase();
      byType[ext] = (byType[ext] || 0) + (d.fileSize || 0);
    });
    const total = Object.values(byType).reduce((s, v) => s + v, 0);
    return Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value, suffix: total > 0 ? ` (${Math.round((value / total) * 100)}%)` : '' }));
  }, [raw]);

  const deliverableByCategory = useMemo(() => {
    if (!raw?.deliverables?.length) return [];
    const byCat = {};
    raw.deliverables.forEach(d => {
      const cat = d.category || 'General';
      byCat[cat] = (byCat[cat] || 0) + 1;
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [raw]);

  const taskDist = useMemo(() => {
    if (!raw?.tasks?.length) return [];
    const byStatus = {};
    raw.tasks.forEach(t => {
      const s = t.status ? t.status.toLowerCase().replace(/_/g, '_') : 'unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    return Object.entries(byStatus).map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value }));
  }, [raw]);

  const riskBySeverity = useMemo(() => {
    if (!raw?.risks?.length) return [];
    const bySev = {};
    raw.risks.forEach(r => {
      const sev = (r.impact || 'UNKNOWN').toUpperCase();
      bySev[sev] = (bySev[sev] || 0) + 1;
    });
    return Object.entries(bySev).map(([name, value]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), value }));
  }, [raw]);

  const timeline = useMemo(() => {
    const entries = [];
    (raw?.audit || []).forEach(a => {
      entries.push({
        id: `audit-${a.id}`,
        time: a.timestamp,
        icon: Upload,
        color: C.indigo,
        text: a.details || `${a.action} ${a.entityType || 'item'}`,
        user: a.userId ? `User #${a.userId}` : 'System',
      });
    });
    (raw?.tasks || []).filter(t => t.completedDate || t.updatedAt).slice(0, 10).forEach(t => {
      entries.push({
        id: `task-${t.id}`,
        time: t.completedDate || t.updatedAt,
        icon: CheckCircle2,
        color: C.emerald,
        text: `Task "${t.title || 'Untitled'}" ${t.status === 'COMPLETED' || t.status === 'DONE' ? 'completed' : 'updated'}`,
        user: t.assignee || '—',
      });
    });
    (raw?.deliverables || []).filter(d => d.status === 'DONE' || d.status === 'COMPLETED').slice(0, 10).forEach(d => {
      entries.push({
        id: `del-${d.id}`,
        time: d.lastDate || d.updatedAt,
        icon: FileText,
        color: C.purple,
        text: `Deliverable "${d.name || 'Untitled'}" completed`,
        user: d.owner || '—',
      });
    });
    (raw?.risks || []).filter(r => r.status === 'MITIGATED' || r.status === 'CLOSED').slice(0, 10).forEach(r => {
      entries.push({
        id: `risk-${r.id}`,
        time: r.updatedAt,
        icon: AlertTriangle,
        color: C.emerald,
        text: `Risk "${r.title || 'Untitled'}" ${r.status.toLowerCase()}`,
        user: r.owner || '—',
      });
    });
    entries.sort((a, b) => new Date(b.time) - new Date(a.time));
    return entries.slice(0, 20);
  }, [raw]);

  const storageTotal = useMemo(() => {
    if (!raw?.documents?.length) return 0;
    return raw.documents.reduce((s, d) => s + (d.fileSize || 0), 0);
  }, [raw]);

  const [pdfError, setPdfError] = useState('');

  const handleExport = (type) => {
    if (!raw || !project) return;
    setExporting(true);
    const filename = `Report_${project.name}_${new Date().toISOString().slice(0, 10)}`;
    const data = {
      'Project Name': project.name,
      'Progress': `${project.progress || 0}%`,
      'Status': project.status || '—',
      'Deliverables Completed': `${kpiDeliverables.done}/${kpiDeliverables.total}`,
      'Open Tasks': kpiTasks.open,
      'Open Risks': kpiRisks.open,
      'Team Members': raw.team.length,
      'Total Documents': raw.documents.length,
      'Storage Used': formatSize(storageTotal),
    };
    const table = [data];
    if (type === 'csv') exportCSV(table, filename);
    else if (type === 'excel') exportExcel(table, filename);
    setExporting(false);
  };

  const handleExportPdf = useCallback(async () => {
    if (!project) return;
    setExporting(true);
    setPdfError('');
    try {
      const res = await api.get(`/reports/project/${project.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${project.name}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setPdfError(err.response?.data?.message || 'Failed to generate PDF report');
    } finally {
      setExporting(false);
    }
  }, [project]);

  if (!projects.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <TrendingUp className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-600" />
        <p className="text-base font-medium text-gray-600 dark:text-gray-400">No projects available</p>
        <p className="text-sm mt-1">Create a project to view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pdfError && (
        <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200">
          {pdfError}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project Reports</h1>
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(Number(e.target.value))}
              className="appearance-none rounded-lg border border-gray-200 bg-white dark:bg-[#1e293b] dark:border-gray-700 dark:text-white pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPdf} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-50">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? 'Generating...' : 'PDF'}
          </button>
          {reportExportBtn(() => handleExport('excel'), 'Excel', 'text-emerald-700', 'bg-emerald-50 border-emerald-200')}
          {reportExportBtn(() => handleExport('csv'), 'CSV', 'text-gray-700 dark:text-gray-300', 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600')}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
        </div>
      ) : !raw ? (
        <EmptyState icon={TrendingUp} message="Select a project to view reports" />
      ) : (
        <div id="report-content" className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={TrendingUp} label="Progress" value={project?.progress != null ? `${project.progress}%` : '—'} color={project?.progress >= 75 ? C.emerald : project?.progress >= 40 ? C.amber : C.red} subtitle={project?.status || '—'} />
            <KpiCard icon={FileText} label="Deliverables Completed" value={`${kpiDeliverables.done}/${kpiDeliverables.total}`} color={C.indigo} subtitle={kpiDeliverables.pct > 0 ? `${kpiDeliverables.pct}% completion rate` : 'No deliverables'} />
            <KpiCard icon={Activity} label="Open Tasks" value={kpiTasks.open} color={kpiTasks.open > 0 ? C.amber : C.emerald} subtitle={`${kpiTasks.done} completed, ${kpiTasks.inProgress} in progress`} />
            <KpiCard icon={AlertTriangle} label="Active Risks" value={kpiRisks.open} color={kpiRisks.critical > 0 ? C.red : kpiRisks.open > 0 ? C.amber : C.emerald} subtitle={`${kpiRisks.critical} critical/high, ${kpiRisks.mitigated} mitigated`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Project Progress</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{project?.name || 'Selected project'} — overall completion</p>
              </div>
              <div className="p-2">
                <ResponsiveContainer width="100%" height={260}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={18} data={[{ name: 'Progress', value: project?.progress || 0, fill: project?.progress >= 75 ? C.emerald : project?.progress >= 40 ? C.amber : C.red }]} startAngle={180} endAngle={0}>
                    <RadialBar dataKey="value" cornerRadius={10} background />
                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold" fill="#374151">{project?.progress || 0}%</text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-xs" fill="#9CA3AF">complete</text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Deliverables by Category</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{kpiDeliverables.done} of {kpiDeliverables.total} completed</p>
              </div>
              <div className="p-2">
                {deliverableByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deliverableByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 5 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {deliverableByCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={FileText} message="No deliverables found for this project" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Task Status</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{kpiTasks.open} open, {kpiTasks.done} completed</p>
              </div>
              <div className="p-2">
                {taskDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={taskDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                        {taskDist.map((_, i) => <Cell key={i} fill={[C.amber, C.sky, C.emerald, C.gray][i % 4]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={Activity} message="No tasks for this project" />}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Risk Severity</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{kpiRisks.open} open risks, {kpiRisks.critical} critical/high</p>
              </div>
              <div className="p-2">
                {riskBySeverity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={riskBySeverity} margin={{ top: 10, right: 10, left: -10, bottom: 5 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {riskBySeverity.map((e, i) => <Cell key={i} fill={SEV_COLORS[e.name.toUpperCase()] || C.gray} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={AlertTriangle} message="No risks recorded for this project" />}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Team Contribution</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Uploads & tasks per member</p>
              </div>
              <div className="p-2">
                {teamContrib.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={teamContrib} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="uploads" name="Uploads" stackId="a" fill={C.indigo} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="tasks" name="Tasks" stackId="a" fill={C.sky} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={Users} message="No team contribution data" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Files Uploaded Over Time</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{raw?.documents?.length || 0} total files</p>
              </div>
              <div className="p-2">
                {uploadedDocsTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={uploadedDocsTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.indigo} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" stroke={C.indigo} strokeWidth={2} fill="url(#uploadGrad)" dot={{ r: 3, fill: C.indigo }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={Upload} message="No files uploaded yet" />}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
              <div className="px-5 pt-4 pb-1">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Storage Usage by File Type</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(storageTotal)} total</p>
              </div>
              <div className="p-2">
                {storageByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={storageByType} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name">
                        {storageByType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} formatter={(value) => formatSize(value)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={HardDrive} message="No storage data available" />}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-[#1e293b] dark:border-gray-700">
            <div className="px-5 pt-4 pb-1">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">Recent Activity Timeline</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Latest actions across documents, tasks, deliverables, and risks</p>
            </div>
            <div className="px-5 pb-4">
              {timeline.length > 0 ? (
                <div className="space-y-0">
                  {timeline.map((e, i) => {
                    const Icon = e.icon;
                    return (
                      <div key={e.id} className="flex gap-3 py-2.5 relative">
                        {i < timeline.length - 1 && <div className="absolute left-[17px] top-10 bottom-0 w-px bg-gray-200 dark:bg-gray-600" />}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${e.color}14`, color: e.color }}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{e.text}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{e.user}</p>
                          </div>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">{timeAgo(e.time)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Clock} message="No recent activity" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
