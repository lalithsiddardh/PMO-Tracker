import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronRight, ChevronDown, ZoomIn, ZoomOut, Calendar,
  CalendarDays, CalendarRange,
} from 'lucide-react';

const PROJECT_BAR_COLORS = {
  ontrack: { bg: '#10B981', bgLight: '#D1FAE5', border: '#059669' },
  atrisk: { bg: '#F59E0B', bgLight: '#FEF3C7', border: '#D97706' },
  delayed: { bg: '#EF4444', bgLight: '#FEE2E2', border: '#DC2626' },
  onhold: { bg: '#94A3B8', bgLight: '#F1F5F9', border: '#64748B' },
  pending: { bg: '#8B5CF6', bgLight: '#EDE9FE', border: '#7C3AED' },
  completed: { bg: '#0EA5E9', bgLight: '#E0F2FE', border: '#0284C7' },
};

const TASK_BAR_COLORS = {
  overdue: { bg: '#EF4444', bgLight: '#FEE2E2' },
  due_soon: { bg: '#F59E0B', bgLight: '#FEF3C7' },
  valid: { bg: '#10B981', bgLight: '#D1FAE5' },
  done: { bg: '#0EA5E9', bgLight: '#E0F2FE' },
  PENDING: { bg: '#94A3B8', bgLight: '#F1F5F9' },
  IN_PROGRESS: { bg: '#3B82F6', bgLight: '#DBEAFE' },
  REVIEW: { bg: '#8B5CF6', bgLight: '#EDE9FE' },
  COMPLETED: { bg: '#10B981', bgLight: '#D1FAE5' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.ceil((db - da) / 86400000);
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekKey(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

function getQuarterKey(date) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

function getQuarterLabel(key) {
  const [y, q] = key.split('-Q');
  return `Q${q} ${y}`;
}

function getMonthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getWeekLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `Week ${Math.ceil((date.getDate() + new Date(y, m - 1, 1).getDay()) / 7)}`;
}

function getTodayX(timelineStart, totalDays, columnWidth) {
  const today = new Date();
  const daysFromStart = daysBetween(timelineStart, today);
  return (daysFromStart / totalDays) * (totalDays * columnWidth);
}

function TaskTooltip({ task, style }) {
  const daysLeft = task.nextDate ? Math.ceil((new Date(task.nextDate) - new Date()) / 86400000) : null;
  return (
    <div
      className="absolute z-50 bg-gray-900 text-white rounded-lg shadow-xl p-3 pointer-events-none text-xs min-w-[200px]"
      style={{ ...style, transform: 'translateY(-100%)' }}
    >
      <p className="font-semibold text-sm mb-1">{task.name}</p>
      <div className="space-y-0.5 text-gray-300">
        <p>Status: <span className="text-white font-medium">{task.status || 'N/A'}</span></p>
        {task.owner && <p>Owner: <span className="text-white">{task.owner}</span></p>}
        {task.lastDate && <p>Start: <span className="text-white">{formatDate(task.lastDate)}</span></p>}
        {task.nextDate && <p>Due: <span className="text-white">{formatDate(task.nextDate)}</span></p>}
        {daysLeft !== null && (
          <p className={daysLeft <= 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : ''}>
            {daysLeft <= 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GanttChart({
  projects,
  deliverables,
}) {
  const { user } = useAuth();
  const role = user?.role;
  const isTeamMember = role === 'TEAM_MEMBER' || role === 'DEVELOPER' || role === 'TESTER' || role === 'BA' || role === 'QA';
  const canEdit = !isTeamMember;

  const [viewMode, setViewMode] = useState('month');
  const [zoom, setZoom] = useState(1);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [tooltipTask, setTooltipTask] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);

  const timelineRef = useRef(null);
  const dragData = useRef(null);
  const barDragMoveRef = useRef(null);
  const barDragEndRef = useRef(null);
  const resizeMoveRef = useRef(null);
  const resizeEndRef = useRef(null);

  const baseColumnWidth = viewMode === 'month' ? 120 : viewMode === 'week' ? 80 : 160;
  const columnWidth = baseColumnWidth * zoom;
  const rowHeight = 44;
  const taskRowHeight = 28;

  const timelineStart = useMemo(() => {
    if (!projects.length) return new Date();
    const dates = projects.map(p => new Date(p.startDate || p.createdAt)).filter(d => !isNaN(d));
    const min = new Date(Math.min(...dates));
    min.setMonth(min.getMonth() - 1);
    min.setDate(1);
    return min;
  }, [projects]);

  const timelineEnd = useMemo(() => {
    if (!projects.length) return addMonths(new Date(), 1);
    const dates = projects.map(p => new Date(p.endDate || p.startDate || p.createdAt)).filter(d => !isNaN(d));
    const max = new Date(Math.max(...dates));
    max.setMonth(max.getMonth() + 1);
    max.setDate(1);
    return max;
  }, [projects]);

  const totalDays = useMemo(() => Math.max(daysBetween(timelineStart, timelineEnd), 30), [timelineStart, timelineEnd]);

  const timelineColumns = useMemo(() => {
    const cols = [];
    const cursor = new Date(timelineStart);

    if (viewMode === 'month') {
      while (cursor < timelineEnd) {
        const key = getMonthKey(cursor);
        const label = getMonthLabel(key);
        cols.push({ key, label, date: new Date(cursor), daysInUnit: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else if (viewMode === 'week') {
      cursor.setDate(cursor.getDate() - cursor.getDay());
      while (cursor < timelineEnd) {
        const key = getWeekKey(cursor);
        const label = getWeekLabel(key);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        cols.push({ key, label, date: new Date(cursor), daysInUnit: 7 });
        cursor.setDate(cursor.getDate() + 7);
      }
    } else if (viewMode === 'quarter') {
      while (cursor < timelineEnd) {
        const currentQ = Math.floor(cursor.getMonth() / 3);
        const qStart = new Date(cursor.getFullYear(), currentQ * 3, 1);
        const key = getQuarterKey(qStart);
        const label = getQuarterLabel(key);
        cols.push({ key, label, date: new Date(qStart), daysInUnit: 92 });
        cursor.setMonth(cursor.getMonth() + 3);
      }
    }
    return cols;
  }, [timelineStart, timelineEnd, viewMode]);

  const timelineWidth = useMemo(() => totalDays * columnWidth, [totalDays, columnWidth]);

  const getOffsetX = useCallback((dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const daysFromStart = daysBetween(timelineStart, d);
    return Math.max(0, (daysFromStart / totalDays) * timelineWidth);
  }, [timelineStart, totalDays, timelineWidth]);

  const getWidth = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const dur = daysBetween(new Date(startDate), new Date(endDate));
    return Math.max((dur / totalDays) * timelineWidth, 20);
  }, [totalDays, timelineWidth]);

  const projectDeliverableMap = useMemo(() => {
    const map = {};
    deliverables.forEach(d => {
      if (!map[d.projectId]) map[d.projectId] = [];
      map[d.projectId].push(d);
    });
    return map;
  }, [deliverables]);

  const todayX = useMemo(() => getTodayX(timelineStart, totalDays, columnWidth), [timelineStart, totalDays, columnWidth]);

  const toggleExpand = (projectId) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const collapseAll = () => setExpandedProjects(new Set());
  const expandAll = () => setExpandedProjects(new Set(projects.map(p => p.id)));

  useEffect(() => {
    barDragMoveRef.current = () => {
      if (!dragData.current) return;
    };
    barDragEndRef.current = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDragging(null);
      dragData.current = null;
    };
    resizeMoveRef.current = () => {
      if (!dragData.current) return;
    };
    resizeEndRef.current = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setResizing(null);
      dragData.current = null;
    };
  }, []);

  const handleBarDragStart = (e, type, id, projectId) => {
    if (!canEdit) return;
    e.preventDefault();
    dragData.current = { type, id, projectId };
    setDragging({ type, id });
    const onMove = (ev) => barDragMoveRef.current(ev);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      barDragEndRef.current();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleResizeStart = (e, type, id, projectId, side) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    const project = projects.find(p => String(p.id) === String(id));
    if (!project) return;
    dragData.current = { type, id, projectId, side, originalStart: project.startDate, originalEnd: project.endDate };
    setResizing({ type, id, side });
    const onMove = (ev) => resizeMoveRef.current(ev);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      resizeEndRef.current();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const ProjectBar = ({ project }) => {
    const x = getOffsetX(project.startDate);
    const w = getWidth(project.startDate, project.endDate);
    const barColors = PROJECT_BAR_COLORS[project.status?.toLowerCase()] || PROJECT_BAR_COLORS.ontrack;
    const isDragging = dragging?.id === String(project.id);
    const isResizing = resizing?.id === String(project.id);

    return (
      <div className="relative h-full">
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md cursor-pointer group transition-shadow duration-150 ${
            isDragging ? 'shadow-lg ring-2 ring-indigo-400 opacity-80' : 'hover:shadow-md'
          } ${isResizing ? 'ring-2 ring-indigo-500' : ''}`}
          style={{
            left: `${x}px`,
            width: `${Math.max(w, 24)}px`,
            background: `linear-gradient(135deg, ${barColors.bg}, ${barColors.border})`,
            border: `1px solid ${barColors.border}`,
          }}
          onMouseEnter={(e) => {
            setTooltipTask(project);
            const rect = e.currentTarget.getBoundingClientRect();
            const parentRect = timelineRef.current?.getBoundingClientRect();
            setTooltipPos({
              left: rect.left - (parentRect?.left || 0) + rect.width / 2 - 100,
              top: rect.top - (parentRect?.top || 0) - 8,
            });
          }}
          onMouseLeave={() => { setTooltipTask(null); setTooltipPos(null); }}
        >
          <div className="absolute inset-0 rounded-md overflow-hidden">
            <div
              className="h-full bg-white/20 transition-all duration-500"
              style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
            />
          </div>
          {canEdit && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-grab active:cursor-grabbing hover:bg-white/20 rounded-l-md transition-colors z-10"
                onMouseDown={(e) => handleResizeStart(e, 'project', project.id, project.id, 'left')}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-grab active:cursor-grabbing hover:bg-white/20 rounded-r-md transition-colors z-10"
                onMouseDown={(e) => handleResizeStart(e, 'project', project.id, project.id, 'right')}
              />
              <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing z-5"
                onMouseDown={(e) => handleBarDragStart(e, 'project', project.id, project.id)}
              />
            </>
          )}
          {!canEdit && <div className="absolute inset-0 cursor-default z-5" />}
        </div>
        {w > 60 && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white truncate pointer-events-none z-10"
            style={{
              left: `${x + 6}px`,
              maxWidth: `${Math.max(w - 12, 20)}px`,
            }}
          >
            {project.progress || 0}%
          </span>
        )}
      </div>
    );
  };

  const TaskBar = ({ task }) => {
    const startDate = task.lastDate || task.nextDate;
    const endDate = task.nextDate;
    const x = getOffsetX(startDate);
    const w = getWidth(startDate, endDate);
    const isMilestone = !startDate || !endDate || daysBetween(new Date(startDate), new Date(endDate)) === 0;

    let barColors = TASK_BAR_COLORS[task.computedStatus] || TASK_BAR_COLORS[task.status] || TASK_BAR_COLORS.valid;
    if (task.status === 'DONE' || task.status === 'COMPLETED') barColors = TASK_BAR_COLORS.done;

    const daysLeft = task.nextDate ? Math.ceil((new Date(task.nextDate) - new Date()) / 86400000) : null;

    const progressValue = task.status === 'DONE' || task.status === 'COMPLETED' ? 100
      : task.computedStatus === 'overdue' ? 75
      : task.computedStatus === 'due_soon' ? 50
      : 25;

    if (isMilestone) {
      return (
        <div className="relative h-full flex items-center">
          <div
            style={{
              left: `${x - 6}px`,
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: `12px solid ${barColors.bg}`,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
            }}
            onMouseEnter={(e) => {
              setTooltipTask(task);
              const rect = e.currentTarget.getBoundingClientRect();
              const parentRect = timelineRef.current?.getBoundingClientRect();
              setTooltipPos({
                left: rect.left - (parentRect?.left || 0) - 80,
                top: rect.top - (parentRect?.top || 0) - 8,
              });
            }}
            onMouseLeave={() => { setTooltipTask(null); setTooltipPos(null); }}
          />
        </div>
      );
    }

    return (
      <div className="relative h-full">
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-sm cursor-pointer group transition-all duration-150 hover:shadow-md hover:-translate-y-2.5`}
          style={{
            left: `${x}px`,
            width: `${Math.max(w, 12)}px`,
            background: barColors.bgLight,
            border: `1.5px solid ${barColors.bg}`,
          }}
          onMouseEnter={(e) => {
            setTooltipTask(task);
            const rect = e.currentTarget.getBoundingClientRect();
            const parentRect = timelineRef.current?.getBoundingClientRect();
            setTooltipPos({
              left: rect.left - (parentRect?.left || 0) + rect.width / 2 - 100,
              top: rect.top - (parentRect?.top || 0) - 8,
            });
          }}
          onMouseLeave={() => { setTooltipTask(null); setTooltipPos(null); }}
        >
          <div
            className="h-full rounded-sm transition-all duration-500"
            style={{ width: `${progressValue}%`, background: barColors.bg }}
          />
          {daysLeft !== null && daysLeft <= 0 && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
          )}
        </div>
        {w > 40 && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[9px] font-medium truncate pointer-events-none"
            style={{
              left: `${x + 4}px`,
              maxWidth: `${Math.max(w - 8, 10)}px`,
              color: barColors.bg,
            }}
          >
            {task.name?.substring(0, Math.floor(w / 7))}
          </span>
        )}
      </div>
    );
  };

  let rowIndex = 0;
  const renderRows = () => {
    const rows = [];
    projects.forEach((project) => {
      const isExpanded = expandedProjects.has(project.id);
      const tasks = projectDeliverableMap[project.id] || [];
      const tasksToShow = tasks.slice(0, 10);
      const hasMore = tasks.length > 10;

      rows.push(
        <div key={`project-${project.id}`} className="flex" style={{ minHeight: rowHeight }}>
          <div
            className="flex items-center gap-1.5 px-3 border-r border-b border-gray-100 bg-white hover:bg-indigo-50/20 cursor-pointer transition-colors shrink-0 sticky left-0 z-10"
            style={{ width: 280 }}
            onClick={() => toggleExpand(project.id)}
          >
            {tasks.length > 0 ? (
              isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            ) : <div className="w-3.5 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{project.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{project.bu} · {project.spoc || '—'}</p>
            </div>
          </div>
          <div className="flex-1 relative border-b border-gray-100 bg-white" style={{ minHeight: rowHeight }}>
            <ProjectBar project={project} rowIndex={rowIndex} isExpanded={isExpanded} />
            {todayX > 0 && todayX < timelineWidth && (
              <div className="absolute top-0 bottom-0 w-px bg-red-400 z-20 pointer-events-none" style={{ left: `${todayX}px` }}>
                <div className="w-2 h-2 bg-red-500 rounded-full -ml-[3.5px]" />
              </div>
            )}
          </div>
        </div>
      );
      rowIndex++;

      if (isExpanded && tasksToShow.length > 0) {
        tasksToShow.forEach((task) => {
          rows.push(
            <div key={`task-${task.id}`} className="flex" style={{ minHeight: taskRowHeight }}>
              <div
                className="flex items-center gap-2 px-3 pl-8 border-r border-b border-gray-50 bg-gray-50/30 shrink-0 sticky left-0 z-10"
                style={{ width: 280 }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  backgroundColor: (TASK_BAR_COLORS[task.computedStatus] || TASK_BAR_COLORS.valid).bg,
                }} />
                <p className="text-[11px] text-gray-600 truncate flex-1">{task.name}</p>
                <span className={`text-[9px] font-medium px-1 py-px rounded shrink-0 ${
                  task.computedStatus === 'overdue' ? 'text-red-600 bg-red-50' :
                  task.computedStatus === 'due_soon' ? 'text-amber-600 bg-amber-50' :
                  task.status === 'DONE' || task.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50' :
                  'text-gray-400 bg-gray-100'
                }`}>
                  {task.status === 'DONE' || task.status === 'COMPLETED' ? 'Done' :
                   task.computedStatus === 'overdue' ? 'Overdue' :
                   task.computedStatus === 'due_soon' ? 'Soon' : 'On Track'}
                </span>
              </div>
              <div className="flex-1 relative border-b border-gray-50 bg-gray-50/10" style={{ minHeight: taskRowHeight }}>
                <TaskBar task={task} />
              </div>
            </div>
          );
          rowIndex++;
        });

        if (hasMore) {
          rows.push(
            <div key={`more-${project.id}`} className="flex" style={{ minHeight: 24 }}>
              <div className="flex items-center px-3 pl-8 border-r border-b border-gray-50 bg-gray-50/50 shrink-0 sticky left-0 z-10" style={{ width: 280 }}>
                <p className="text-[10px] text-gray-400 italic">+{tasks.length - 10} more deliverables</p>
              </div>
              <div className="flex-1 border-b border-gray-50 bg-gray-50/50" />
            </div>
          );
          rowIndex++;
        }
      }
    });
    return rows;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {[
              { key: 'month', icon: Calendar, label: 'Month' },
              { key: 'week', icon: CalendarDays, label: 'Week' },
              { key: 'quarter', icon: CalendarRange, label: 'Quarter' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === v.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              disabled={zoom <= 0.4}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-500 w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.2))}
              disabled={zoom >= 2}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{projects.length} projects · {deliverables.length} deliverables</span>
          <div className="w-px h-4 bg-gray-200" />
          <button onClick={collapseAll} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors">Collapse</button>
          <button onClick={expandAll} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors">Expand</button>
          {!canEdit && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">Read-only</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden" ref={timelineRef}>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)', minWidth: `${280 + timelineWidth}px` }}>
          <div className="flex flex-col">
            <div className="flex shrink-0 sticky top-0 z-20">
              <div
                className="sticky left-0 z-20 border-r border-b border-gray-200 bg-white"
                style={{ width: 280 }}
              >
                <div className="h-10 flex items-center px-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Project / Task</span>
                </div>
              </div>
              <div className="relative shrink-0" style={{ width: `${timelineWidth}px`, minHeight: 40 }}>
                {timelineColumns.map((col) => (
                  <div
                    key={col.key}
                    className="absolute top-0 h-10 flex items-center justify-start px-2 border-r border-b border-gray-200 bg-white"
                    style={{
                      left: `${(daysBetween(timelineStart, col.date) / totalDays) * timelineWidth}px`,
                      width: `${(col.daysInUnit / totalDays) * timelineWidth}px`,
                    }}
                  >
                    <span className="text-[11px] font-semibold text-gray-600 truncate">{col.label}</span>
                  </div>
                ))}
                {todayX > 0 && todayX < timelineWidth && (
                  <div className="absolute top-0 h-10 flex items-center z-20 pointer-events-none" style={{ left: `${todayX}px` }}>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white rounded text-[9px] font-bold leading-none">
                      Today
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              {renderRows()}
            </div>

            {projects.length === 0 && (
              <div className="flex items-center justify-center py-20 text-gray-400 text-sm" style={{ width: `${280 + timelineWidth}px` }}>
                No projects to display on Gantt chart
              </div>
            )}
          </div>
        </div>
      </div>

      {tooltipTask && tooltipPos && (
        <TaskTooltip task={tooltipTask} style={{ left: tooltipPos.left, top: tooltipPos.top }} />
      )}

      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#10B981' }} />
          <span className="text-[10px] text-gray-500">On Track</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#F59E0B' }} />
          <span className="text-[10px] text-gray-500">At Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#EF4444' }} />
          <span className="text-[10px] text-gray-500">Delayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#94A3B8' }} />
          <span className="text-[10px] text-gray-500">On Hold</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-px h-3 bg-gray-200" />
          <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #8B5CF6' }} />
          <span className="text-[10px] text-gray-500">Milestone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-px bg-red-400 border-t border-dashed border-red-400" />
          <span className="text-[10px] text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}
