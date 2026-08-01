import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban, Activity, AlertTriangle, TrendingUp,
  Clock, Users, FileText, PlusCircle, Upload, UserPlus, BarChart3,
  ChevronRight, Layers, Calendar,
} from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeleton';

const COLORS = {
  indigo: '#4F46E5', sky: '#0EA5E9', emerald: '#10B981',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  purple: '#8B5CF6', pink: '#EC4899', gray: '#94A3B8',
  teal: '#14B8A6', slate: '#6B7280',
};

const CHART_COLORS = [COLORS.indigo, COLORS.sky, COLORS.emerald, COLORS.green, COLORS.amber, COLORS.red, COLORS.purple, COLORS.pink, COLORS.teal, COLORS.gray];

const STATUS_LABELS = {
  ontrack: 'On Track', atrisk: 'At Risk', delayed: 'Delayed',
  completed: 'Completed', onhold: 'On Hold', pending: 'Pending',
  cancelled: 'Cancelled', active: 'Active', valid: 'Valid',
  dueSoon: 'Due Soon', overdue: 'Overdue',
};

const PORTFOLIO_CATEGORIES = ['On Track', 'Delayed', 'At Risk', 'On Hold', 'Completed'];
const PORTFOLIO_COLORS = [COLORS.green, COLORS.amber, COLORS.red, COLORS.gray, COLORS.teal];

function aggregateProjectStatus(projects) {
  const counts = { 'On Track': 0, 'Delayed': 0, 'At Risk': 0, 'On Hold': 0, 'Completed': 0 };
  (projects || []).forEach(p => {
    const key = (p.status || '').toLowerCase().replace(/[\s_]+/g, '');
    if (key === 'active' || key === 'ontrack') counts['On Track']++;
    else if (key === 'delayed') counts['Delayed']++;
    else if (key === 'atrisk') counts['At Risk']++;
    else if (key === 'onhold') counts['On Hold']++;
    else if (key === 'completed') counts['Completed']++;
  });
  return PORTFOLIO_CATEGORIES.map(name => ({ name, value: counts[name] }));
}

function toPieData(map) {
  return Object.entries(map || {}).map(([name, value]) => ({
    name: STATUS_LABELS[name.toLowerCase()] || name,
    key: name.toLowerCase(),
    value: Number(value),
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3.5 py-2.5 text-sm shadow-xl">
      {label && <p className="font-semibold text-gray-900 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-gray-600 mt-0.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-gray-900">{entry.value}{entry.payload?.suffix || ''}</span>
        </p>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, trend, color, subtitle, delay = 0 }) {
  const trendUp = trend >= 0;
  return (
    <div
      className="card-elevated p-4 relative overflow-hidden group animate-fade-in-up cursor-default"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: `${color}12`, color }}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-end gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{value}</span>
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp className={`w-3 h-3 ${trendUp ? '' : 'rotate-180'}`} />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>}
        <div className="mt-2.5 h-0.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 group-hover:opacity-80" style={{ width: `${Math.min(Math.abs(trend || 0), 100)}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, badge, height = 280, delay = 0 }) {
  return (
    <div className="card-elevated animate-fade-in-up overflow-hidden" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge && <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">{badge}</span>}
      </div>
      <div className="p-1.5">
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <BarChart3 className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{message || 'No data available'}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role || 'USER';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isPM = role === 'PM';

  useEffect(() => {
    const promises = [api.get('/dashboard')];
    if (isPM) {
      promises.push(api.get('/team').catch(() => ({ data: [] })));
      promises.push(api.get('/documents').catch(() => ({ data: [] })));
    }
    Promise.all(promises)
      .then(([dashboardRes, teamRes, docsRes]) => {
        setData(dashboardRes.data);
        if (isPM && teamRes) {
          const pmProjectNames = new Set((dashboardRes.data?.projects || []).map(p => p.name));
          const myTeam = (teamRes.data || []).filter(m =>
            m.projects && m.projects.some(pn => pmProjectNames.has(pn))
          );
          setTeam(myTeam);
        }
        if (isPM && docsRes) {
          setRecentUploads(
            (docsRes.data || [])
              .sort((a, b) => new Date(b.uploadTimestamp || 0) - new Date(a.uploadTimestamp || 0))
              .slice(0, 6)
          );
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const projects = data?.projects ?? [];
  const kpi = data?.kpi || {};
  const projectStatusData = toPieData(data?.projectStatusDistribution);
  const portfolioHealthData = aggregateProjectStatus(projects);
  const projectTypeData = toPieData(data?.projectTypeDistribution);
  const deliverablesData = toPieData(data?.deliverableStatus);
  const buData = Object.entries(data?.projectsByBU || {}).map(([name, value]) => ({ name, value: Math.round(Number(value)) }));
  const totalProjects = Object.values(data?.projectsByBU || {}).reduce((s, v) => s + Number(v), 0);
  const totalDeliverables = deliverablesData.reduce((s, d) => s + d.value, 0);
  const overdueCount = kpi.overdueDeliverables || 0;
  const dueSoonCount = kpi.dueSoonDeliverables || 0;
  const onTrackCount = kpi.onTrackDeliverables || 0;
  const activeProjects = kpi.activeProjects || 0;
  const delayedCount = projectStatusData.find(d => d.key === 'delayed')?.value || 0;
  const atRiskCount = projectStatusData.find(d => d.key === 'atrisk')?.value || 0;
  const teamMembers = [...new Set(projects.map(p => p.spoc).filter(Boolean))].length;
  const uniqueBus = buData.length;

  const monthlyProgressData = (() => {
    const months = {};
    projects.forEach(p => {
      if (p.startDate && p.progress != null) {
        const key = p.startDate.substring(0, 7);
        if (!months[key]) months[key] = { totalProgress: 0, count: 0 };
        months[key].totalProgress += p.progress;
        months[key].count += 1;
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, val]) => ({
        month,
        avgProgress: Math.round(val.totalProgress / val.count),
        projectCount: val.count,
      }));
  })();

  const monthlyDeliverableTrend = (() => {
    const months = {};
    projects.forEach(p => {
      if (p.endDate) {
        const key = p.endDate.substring(0, 7);
        if (!months[key]) months[key] = 0;
        months[key] += 1;
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        deliverables: count,
      }));
  })();

  const activities = (() => {
    const acts = [];
    projects.forEach(p => {
      if (p.updatedAt) {
        acts.push({
          id: `proj-${p.id}`,
          type: 'project',
          action: `updated project`,
          target: p.name,
          user: p.spoc || 'System',
          time: p.updatedAt,
        });
      }
    });
    return acts.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);
  })();

  const upcomingDeadlines = (() => {
    return projects
      .filter(p => p.endDate && p.status && !['completed', 'cancelled'].includes(p.status.toLowerCase()))
      .sort((a, b) => a.endDate.localeCompare(b.endDate))
      .slice(0, 6);
  })();

  const healthScore = totalProjects > 0
    ? Math.round(((onTrackCount + activeProjects) / (totalDeliverables || 1)) * 100)
    : 0;

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="card-elevated p-5 border-red-200 dark:border-red-900/50 animate-fade-in">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // ---- RENDER FUNCTIONS ----
  function renderDoughnut(data, colors, centerInfo) {
    if (data.length === 0) return <EmptyChart message="No data to display yet" />;
    const hasValues = data.some(d => d.value > 0);
    if (!hasValues) return <EmptyChart message="No data to display yet" />;
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%" cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
            animationBegin={200}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="var(--bg-card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={val => <span className="text-gray-600 dark:text-gray-400">{val}</span>} />
        </PieChart>
        {centerInfo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '5%' }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{centerInfo.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{centerInfo.label}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderHorizontalBar(data) {
    if (data.length === 0) return <EmptyChart message="No data to display yet" />;
    const roundedData = data.map(d => ({ ...d, value: Math.round(d.value) }));
    const maxVal = Math.max(...roundedData.map(d => d.value), 1);
    return (
      <BarChart data={roundedData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, maxVal * 1.2]} tickFormatter={v => Math.round(v)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} animationDuration={800} animationEasing="ease-out">
          {roundedData.map((entry, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  }

  function renderPie(data, colors) {
    if (data.length === 0) return <EmptyChart message="No data to display yet" />;
    const hasValues = data.some(d => d.value > 0);
    if (!hasValues) return <EmptyChart message="No data to display yet" />;
    return (
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%" cy="50%"
          outerRadius={100}
          innerRadius={30}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
          animationBegin={200}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={val => <span className="text-gray-600 dark:text-gray-400">{val}</span>} />
      </PieChart>
    );
  }

  function renderArea(data) {
    if (data.length === 0) return <EmptyChart message="No data" />;
    const hasValues = data.some(d => d.avgProgress > 0);
    if (!hasValues) return <EmptyChart message="No data" />;
    return (
      <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.25} />
            <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="avgProgress"
          stroke={COLORS.indigo}
          strokeWidth={2.5}
          fill="url(#progressGradient)"
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={val => <span className="text-gray-600 dark:text-gray-400">{val === 'avgProgress' ? 'Avg Progress (%)' : val}</span>} />
      </AreaChart>
    );
  }

  function renderLineTrend(data) {
    if (data.length === 0) return <EmptyChart message="No data" />;
    return (
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="deliverables"
          stroke={COLORS.teal}
          strokeWidth={2.5}
          dot={{ fill: COLORS.teal, r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }}
          activeDot={{ r: 6, fill: COLORS.teal, strokeWidth: 2, stroke: 'var(--bg-card)' }}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={val => <span className="text-gray-600 dark:text-gray-400">{val === 'deliverables' ? 'Deliverables Count' : val}</span>} />
      </LineChart>
    );
  }

  function activityIcon(type) {
    switch (type) {
      case 'project': return <FolderKanban className="w-4 h-4 text-indigo-500" />;
      case 'deliverable': return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'user': return <UserPlus className="w-4 h-4 text-sky-500" />;
      case 'upload': return <Upload className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  }

  function statusBadgeClass(status) {
    const s = (status || '').toLowerCase();
    const map = {
      ontrack: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      active: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      atrisk: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      delayed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      duesoon: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      onhold: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      pending: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      cancelled: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
    };
    return map[s] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }

  function pmDocIcon(file) {
    const ext = file.fileType || file.originalFilename?.split('.').pop() || '';
    const map = {
      pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
      csv: '📋', ppt: '📽️', pptx: '📽️', txt: '📃',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', zip: '📦',
    };
    return map[ext.toLowerCase()] || '📄';
  }

  // ---- ADMIN KPI ----
  const coreKpiCards = [
    { icon: FolderKanban, label: 'Total Projects', value: totalProjects, trend: 12, color: COLORS.indigo, subtitle: `${uniqueBus} business units`, delay: 0.05 },
    { icon: Activity, label: 'Active Projects', value: activeProjects, trend: 8, color: COLORS.sky, subtitle: `${Math.round((activeProjects / (totalProjects || 1)) * 100)}% of portfolio`, delay: 0.1 },
    { icon: Clock, label: 'Delayed', value: delayedCount, trend: -5, color: COLORS.red, subtitle: `${Math.round((delayedCount / (totalProjects || 1)) * 100)}% of total`, delay: 0.15 },
    { icon: AlertTriangle, label: 'At Risk', value: atRiskCount, trend: -3, color: COLORS.amber, subtitle: `${Math.round((atRiskCount / (totalProjects || 1)) * 100)}% of total`, delay: 0.2 },
    { icon: Layers, label: 'Open Deliv.', value: totalDeliverables, trend: 15, color: COLORS.emerald, subtitle: `${overdueCount} overdue, ${dueSoonCount} due soon`, delay: 0.25 },
    { icon: Users, label: 'Team Members', value: teamMembers, trend: 4, color: COLORS.teal, subtitle: `across ${uniqueBus} BUs`, delay: 0.3 },
  ];

  const pmKpiCards = [
    { icon: FolderKanban, label: 'Assigned Projects', value: kpi.assignedProjects || projects.length, trend: 8, color: COLORS.indigo, subtitle: `${projects.length} projects`, delay: 0.05 },
    { icon: Layers, label: 'Pending Deliv.', value: kpi.totalDeliverables || 0, trend: 12, color: COLORS.sky, subtitle: `${kpi.overdueDeliverables || 0} overdue`, delay: 0.1 },
    { icon: Clock, label: 'Due Soon', value: kpi.dueSoonDeliverables || 0, trend: 5, color: COLORS.amber, subtitle: 'Within reminder window', delay: 0.15 },
    { icon: AlertTriangle, label: 'Overdue', value: kpi.overdueDeliverables || 0, trend: -3, color: COLORS.red, subtitle: 'Past due date', delay: 0.2 },
    { icon: Users, label: 'My Team', value: team.length || 0, trend: 2, color: COLORS.teal, subtitle: `Across ${projects.length} projects`, delay: 0.25 },
  ];

  const pmActivities = (() => {
    const acts = [];
    projects.forEach(p => {
      if (p.updatedAt) {
        acts.push({
          id: `proj-${p.id}`,
          type: 'project',
          action: `updated project`,
          target: p.name,
          user: p.spoc || 'System',
          time: p.updatedAt,
        });
      }
    });
    if (recentUploads.length > 0) {
      recentUploads.forEach(d => {
        acts.push({
          id: `doc-${d.id}`,
          type: 'upload',
          action: 'uploaded document',
          target: d.originalFilename,
          user: d.uploadedByName || 'System',
          time: d.uploadTimestamp,
        });
      });
    }
    return acts.sort((a, b) => b.time?.localeCompare(a.time || '') || 0).slice(0, 10);
  })();

  const pmUpcomingDeadlines = (() => {
    return projects
      .filter(p => p.endDate && p.status && !['completed', 'cancelled'].includes(p.status.toLowerCase()))
      .sort((a, b) => a.endDate.localeCompare(b.endDate))
      .slice(0, 6);
  })();

  const charts = (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <ChartCard title="Portfolio Health" subtitle="project status distribution" badge={`${totalProjects} projects`} height={280} delay={0.05}>
        {renderDoughnut(portfolioHealthData, PORTFOLIO_COLORS, { value: totalProjects, label: 'Total' })}
      </ChartCard>
      <ChartCard title="Projects by Business Unit" subtitle="horizontal distribution" badge={`${uniqueBus} BUs`} height={280} delay={0.1}>
        {renderHorizontalBar(buData)}
      </ChartCard>
      <ChartCard title="Project Type Distribution" subtitle="by project category" badge={`${projectTypeData.length} types`} height={280} delay={0.15}>
        {renderPie(projectTypeData, [COLORS.indigo, COLORS.sky, COLORS.emerald, COLORS.purple, COLORS.amber])}
      </ChartCard>
      <ChartCard title="Monthly Project Progress" subtitle="avg % by start month" badge={monthlyProgressData.length > 0 ? `${monthlyProgressData.length} months` : ''} height={280} delay={0.2}>
        {renderArea(monthlyProgressData)}
      </ChartCard>
      <ChartCard title="Deliverables Status" subtitle="on track, due soon & overdue" badge={`${totalDeliverables} total`} height={280} delay={0.25}>
        {renderPie(deliverablesData, [COLORS.green, COLORS.amber, COLORS.red])}
      </ChartCard>
      <ChartCard title="Monthly Deliverable Trend" subtitle="projects ending per month" badge={monthlyDeliverableTrend.length > 0 ? `${monthlyDeliverableTrend.length} months` : ''} height={280} delay={0.3}>
        {renderLineTrend(monthlyDeliverableTrend)}
      </ChartCard>
    </div>
  );

  const bottomSection = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card-elevated animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.35s' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Recent Activity</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Latest project updates</p>
          </div>
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-5 pb-1">
          {activities.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent dark:from-indigo-800 dark:via-indigo-900/50" />
              {activities.slice(0, 5).map((act, i) => (
                <div key={act.id || i} className="flex items-start gap-3.5 py-2.5 relative animate-fade-in" style={{ animationDelay: `${0.4 + i * 0.05}s` }}>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 relative z-10 ring-2 ring-white dark:ring-gray-900">
                    {activityIcon(act.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{act.user}</span>
                      {' '}{act.action}{' '}
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">"{act.target}"</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(act.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-300 dark:text-gray-600 shrink-0">
                    {/* eslint-disable-next-line react-hooks/purity */}
                    {Math.round((Date.now() - new Date(act.time).getTime()) / 3600000)}h ago
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Activity className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      <div className="card-elevated animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Upcoming Deadlines</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Projects ending soon</p>
          </div>
          <Calendar className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </div>
        <div className="px-5 pb-4">
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-2">
              {upcomingDeadlines.map((p, i) => {
                const daysLeft = Math.ceil((new Date(p.endDate) - new Date()) / 86400000);
                const urgent = daysLeft <= 7;
                const warning = daysLeft <= 30 && daysLeft > 7;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 hover:translate-x-0.5 ${
                      urgent ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10' : warning ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    } animate-fade-in`}
                    style={{ animationDelay: `${0.45 + i * 0.04}s` }}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${urgent ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">{p.bu || '-'}</span>
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusBadgeClass(p.status)}`}>
                          {STATUS_LABELS[(p.status || '').toLowerCase()] || p.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold tabular-nums ${urgent ? 'text-red-600 dark:text-red-400' : warning ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {daysLeft}d
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.endDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Calendar className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---- ROLE-BASED RENDER ----
  if (isAdmin) {
    return (
      <div className="space-y-5 relative pb-20">
        <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-gray-900">PMO Executive Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Enterprise portfolio overview</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 glass px-3 py-1.5 rounded-lg shadow-sm">
              <div className={`w-2 h-2 rounded-full ${healthScore >= 70 ? 'bg-emerald-500' : healthScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
              Health Score: <span className="font-bold text-gray-800 dark:text-gray-200">{healthScore}%</span>
            </div>
            <select className="text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 shadow-sm transition-shadow">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {coreKpiCards.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        {charts}

        {bottomSection}

        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <div className="relative group">
            <button className="w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg hover:shadow-xl hover:bg-indigo-700 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-indigo-200 dark:shadow-indigo-900/30" title="Quick Actions">
              <PlusCircle className="w-5 h-5" />
            </button>
            <div className="absolute bottom-14 right-0 hidden group-hover:block group-focus-within:block animate-fade-in">
              <div className="glass-card p-1.5 min-w-[180px] shadow-xl">
                {[
                  { icon: FolderKanban, label: 'Create Project', color: COLORS.indigo },
                  { icon: Upload, label: 'Upload Document', color: COLORS.sky },
                  { icon: UserPlus, label: 'Assign PM', color: COLORS.emerald },
                  { icon: BarChart3, label: 'Generate Report', color: COLORS.purple },
                ].map(action => (
                  <button key={action.label} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${action.color}14`, color: action.color }}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPM) {
    return (
      <div className="space-y-5 relative pb-20">
        <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-gray-900">PM Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your project management overview</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 glass px-3 py-1.5 rounded-lg shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {projects.length} Projects
            </div>
            <select className="text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 shadow-sm transition-shadow">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {pmKpiCards.map(k => <KpiCard key={k.label} {...k} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="My Projects Status" subtitle="by project status" badge={`${projects.length} projects`} height={280}>
            {renderDoughnut(portfolioHealthData, PORTFOLIO_COLORS, { value: projects.length, label: 'Total' })}
          </ChartCard>
          <ChartCard title="My Deliverables" subtitle="on track, due soon & overdue" badge={`${kpi.totalDeliverables || 0} total`} height={280}>
            {renderDoughnut(deliverablesData, [COLORS.green, COLORS.amber, COLORS.red])}
          </ChartCard>
          <ChartCard title="Project Types" subtitle="by project category" badge={`${projectTypeData.length} types`} height={280}>
            {renderPie(projectTypeData, [COLORS.indigo, COLORS.sky, COLORS.emerald, COLORS.purple, COLORS.amber])}
          </ChartCard>
        </div>

        <ChartCard title="Monthly Progress" subtitle="avg % by start month" badge={monthlyProgressData.length > 0 ? `${monthlyProgressData.length} months` : ''} height={280}>
          {renderArea(monthlyProgressData)}
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-elevated overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Upcoming Deadlines</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Projects ending soon</p>
              </div>
              <Calendar className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="px-5 pb-4">
              {pmUpcomingDeadlines.length > 0 ? (
                <div className="space-y-2">
                  {pmUpcomingDeadlines.map(p => {
                    const daysLeft = Math.ceil((new Date(p.endDate) - new Date()) / 86400000);
                    const urgent = daysLeft <= 7;
                    const warning = daysLeft <= 30 && daysLeft > 7;
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 hover:translate-x-0.5 ${
                        urgent ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10' : warning ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${urgent ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400">{p.bu || '-'}</span>
                            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusBadgeClass(p.status)}`}>
                              {STATUS_LABELS[(p.status || '').toLowerCase()] || p.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold tabular-nums ${urgent ? 'text-red-600 dark:text-red-400' : warning ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>{daysLeft}d</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.endDate}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Calendar className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 card-elevated">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Recent Activity</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Latest updates</p>
              </div>
              <Activity className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="px-5 pb-1">
              {pmActivities.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent dark:from-indigo-800 dark:via-indigo-900/50" />
                  {pmActivities.slice(0, 5).map((act, i) => (
                    <div key={act.id || i} className="flex items-start gap-3.5 py-2.5 relative">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 relative z-10 ring-2 ring-white dark:ring-gray-900">
                        {activityIcon(act.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{act.user}</span>
                          {' '}{act.action}{' '}
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">"{act.target}"</span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {act.time ? new Date(act.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-300 dark:text-gray-600 shrink-0">
                        {/* eslint-disable-next-line react-hooks/purity */}
                        {act.time ? Math.round((Date.now() - new Date(act.time).getTime()) / 3600000) + 'h ago' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Activity className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-elevated">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Recent Uploads</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Latest project documents</p>
              </div>
              <Upload className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="px-5 pb-4">
              {recentUploads.length > 0 ? (
                <div className="space-y-2">
                  {recentUploads.map(d => (
                    <div key={d.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <span className="text-base shrink-0">{pmDocIcon(d)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{d.originalFilename}</p>
                        <p className="text-[10px] text-gray-400">
                          {d.projectName || `Project #${d.projectId}`}
                          {' · '}{d.uploadTimestamp ? new Date(d.uploadTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <Upload className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No recent uploads</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-12 text-center animate-fade-in">
      <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Your project data will appear here once assigned.</p>
    </div>
  );
}
