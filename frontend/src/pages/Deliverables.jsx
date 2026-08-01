import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, List, Columns3, Calendar, X,
  ArrowUpDown, Clock, CheckCircle2,
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const KANBAN_COLUMNS = [
  { key: 'PENDING', label: 'Pending', color: 'bg-gray-100 text-gray-600 border-gray-300' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { key: 'REVIEW', label: 'Review', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
];

const KANBAN_KEYS = KANBAN_COLUMNS.map(c => c.key);

const categoryColors = {
  Governance: 'bg-purple-100 text-purple-700 border-purple-200',
  Functional: 'bg-blue-100 text-blue-700 border-blue-200',
  Technical: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Compliance: 'bg-amber-100 text-amber-700 border-amber-200',
};

function getPriority(d) {
  if (d.status === 'DONE' || d.status === 'COMPLETED') return { label: 'Done', color: 'text-gray-400 bg-gray-50 border-gray-200' };
  if (d.computedStatus === 'overdue') return { label: 'High', color: 'text-red-700 bg-red-50 border-red-200' };
  if (d.computedStatus === 'due_soon') return { label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Low', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
}

function getStatusStyle(status) {
  const map = {
    PENDING: 'text-gray-600 bg-gray-100 border-gray-200',
    IN_PROGRESS: 'text-blue-700 bg-blue-50 border-blue-200',
    REVIEW: 'text-purple-700 bg-purple-50 border-purple-200',
    COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    DONE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };
  return map[status] || 'text-gray-500 bg-gray-50 border-gray-200';
}

const STATUS_LABELS = {
  PENDING: 'Pending', IN_PROGRESS: 'In Progress', REVIEW: 'Review',
  COMPLETED: 'Completed', DONE: 'Done',
};

function getComputedStyle(status) {
  const map = {
    overdue: 'text-red-700 bg-red-50 border-red-200',
    due_soon: 'text-amber-700 bg-amber-50 border-amber-200',
    valid: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };
  return map[status] || 'text-gray-400 bg-gray-50 border-gray-200';
}

const COMPUTED_LABELS = { overdue: 'Overdue', due_soon: 'Due Soon', valid: 'On Track' };

function getProgress(d) {
  if (d.status === 'DONE' || d.status === 'COMPLETED') return { value: 100, color: '#10B981' };
  if (!d.nextDate) return { value: 0, color: '#94A3B8' };
  const daysTotal = d.reminderDays || 30;
  const daysLeft = Math.ceil((new Date(d.nextDate) - new Date()) / 86400000);
  const pct = Math.max(0, Math.min(100, ((daysTotal - daysLeft) / daysTotal) * 100));
  const color = d.computedStatus === 'overdue' ? '#EF4444' : d.computedStatus === 'due_soon' ? '#F59E0B' : '#10B981';
  return { value: pct, color };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function KanbanCard({ d, onEdit, onDelete, onMarkDone }) {
  const priority = getPriority(d);
  const progress = getProgress(d);
  const daysLeft = d.nextDate ? Math.ceil((new Date(d.nextDate) - new Date()) / 86400000) : null;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(d.id));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-gray-900 leading-snug flex-1">{d.name}</p>
        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${priority.color}`}>
          {priority.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getComputedStyle(d.computedStatus)}`}>
          {COMPUTED_LABELS[d.computedStatus] || d.computedStatus}
        </span>
        {d.category && (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${categoryColors[d.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {d.category}
          </span>
        )}
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress.value}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress.value}%`, backgroundColor: progress.color }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 min-w-0">
          {d.nextDate && (
            <span className={`flex items-center gap-0.5 ${d.computedStatus === 'overdue' ? 'text-red-500 font-semibold' : d.computedStatus === 'due_soon' ? 'text-amber-600' : ''}`}>
              <Clock className="w-3 h-3" />
              {formatDate(d.nextDate)}
              {daysLeft !== null && daysLeft <= 0 && <span className="ml-0.5">({Math.abs(daysLeft)}d overdue)</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMarkDone(d.id)} className="p-1 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Mark done">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(d)} className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => onDelete(d.id)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
        {d.owner && <span>👤 {d.owner}</span>}
        {d.projectName && <span className="truncate">📁 {d.projectName}</span>}
      </div>
    </div>
  );
}

function TimelineCard({ d }) {
  const progress = getProgress(d);
  const daysLeft = d.nextDate ? Math.ceil((new Date(d.nextDate) - new Date()) / 86400000) : null;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-900 truncate flex-1">{d.name}</p>
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getComputedStyle(d.computedStatus)} shrink-0`}>
          {COMPUTED_LABELS[d.computedStatus] || d.computedStatus}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
        {d.projectName && <span>{d.projectName}</span>}
        {d.owner && <span>· {d.owner}</span>}
        {daysLeft !== null && (
          <span className={`ml-auto ${daysLeft <= 0 ? 'text-red-500 font-semibold' : daysLeft <= 7 ? 'text-amber-600' : ''}`}>
            {daysLeft <= 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
          </span>
        )}
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${progress.value}%`, backgroundColor: progress.color }} />
      </div>
    </div>
  );
}

export default function Deliverables() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isPM = user?.role === 'PM';
  const canManage = isAdmin || isPM;

  const [deliverables, setDeliverables] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('nextDate');
  const [sortDir, setSortDir] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', category: '', scope: '', frequency: 'SINGLE', projectId: '' });
  const [filters, setFilters] = useState({
    status: '', priority: '', projectId: '', owner: '', dueDateFrom: '', dueDateTo: '',
  });
  const [hostColumn, setHostColumn] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  const projectMap = useMemo(() => {
    const m = {};
    projects.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [projects]);

  const fetchDeliverables = useCallback(async () => {
    try {
      const [delRes, projRes] = await Promise.all([
        api.get('/project-deliverables'),
        api.get('/projects').catch(() => ({ data: [] })),
      ]);
      const mapped = (delRes.data || []).map(d => ({
        ...d,
        projectName: projectMap[d.projectId] || `Project #${d.projectId}`,
      }));
      setDeliverables(mapped);
      setProjects(projRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  }, [projectMap]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchDeliverables(); }, []);

  const allOwners = useMemo(() => [...new Set(deliverables.map(d => d.owner).filter(Boolean))], [deliverables]);
  const allCategories = useMemo(() => [...new Set(deliverables.map(d => d.category).filter(Boolean))], [deliverables]);

  const filteredDeliverables = useMemo(() => {
    let list = [...deliverables];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.owner?.toLowerCase().includes(q) ||
        d.scope?.toLowerCase().includes(q) ||
        d.projectName?.toLowerCase().includes(q)
      );
    }
    if (filters.status) {
      if (KANBAN_KEYS.includes(filters.status) || filters.status === 'DONE') {
        list = list.filter(d => d.status === filters.status);
      } else if (filters.status === 'overdue') {
        list = list.filter(d => d.computedStatus === 'overdue');
      } else if (filters.status === 'due_soon') {
        list = list.filter(d => d.computedStatus === 'due_soon');
      } else if (filters.status === 'valid') {
        list = list.filter(d => d.computedStatus === 'valid');
      }
    }
    if (filters.priority) {
      list = list.filter(d => getPriority(d).label === filters.priority);
    }
    if (filters.projectId) {
      list = list.filter(d => String(d.projectId) === filters.projectId);
    }
    if (filters.owner) {
      list = list.filter(d => d.owner === filters.owner);
    }
    if (filters.dueDateFrom) {
      list = list.filter(d => d.nextDate && new Date(d.nextDate) >= new Date(filters.dueDateFrom));
    }
    if (filters.dueDateTo) {
      list = list.filter(d => d.nextDate && new Date(d.nextDate) <= new Date(filters.dueDateTo));
    }
    return list;
  }, [deliverables, search, filters]);

  const sortedDeliverables = useMemo(() => {
    const list = [...filteredDeliverables];
    list.sort((a, b) => {
      const getVal = (d) => {
        if (sortKey === 'nextDate' || sortKey === 'lastDate') return d[sortKey] || '';
        if (sortKey === 'name') return (d.name || '').toLowerCase();
        if (sortKey === 'priority') return ['High', 'Medium', 'Low', 'Done'].indexOf(getPriority(d).label);
        if (sortKey === 'computedStatus') return d.computedStatus || '';
        if (sortKey === 'projectName') return (d.projectName || '').toLowerCase();
        return (d[sortKey] || '').toLowerCase();
      };
      const va = getVal(a), vb = getVal(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDeliverables, sortKey, sortDir]);

  const kanbanData = useMemo(() => {
    const groups = {};
    KANBAN_KEYS.forEach(k => { groups[k] = []; });
    deliverables.forEach(d => {
      const key = KANBAN_KEYS.includes(d.status) ? d.status : 'PENDING';
      groups[key].push(d);
    });
    return KANBAN_COLUMNS.map(col => ({ ...col, items: groups[col.key] }));
  }, [deliverables]);

  const timelineData = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = -1; i <= 11; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { key, label: m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), items: [] };
    }
    sortedDeliverables.filter(d => d.nextDate).forEach(d => {
      const dt = new Date(d.nextDate);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) months[key].items.push(d);
    });
    return Object.values(months).filter(m => m.items.length > 0);
  }, [sortedDeliverables]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortHeader = ({ label, sortKey: sk, className }) => (
    <th className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 ${className || ''}`} onClick={() => handleSort(sk)}>
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sk ? (
          <ArrowUpDown className={`w-3 h-3 text-indigo-500 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300" />
        )}
      </div>
    </th>
  );

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredColumn(colKey);
  };

  const handleDrop = async (e, colKey) => {
    e.preventDefault();
    setHoveredColumn(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    setHostColumn(colKey);
    try {
      await api.patch(`/project-deliverables/${id}`, { status: colKey });
      fetchDeliverables();
    }     catch (err) { console.error(err); }
    setHostColumn(null);
  };

  const handleMarkDone = async (id) => {
    try { await api.post(`/project-deliverables/${id}/done`); fetchDeliverables(); }
    catch (err) { console.error(err); alert('Failed to mark deliverable'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deliverable?')) return;
    try { await api.delete(`/project-deliverables/${id}`); fetchDeliverables(); }
    catch (err) { console.error(err); alert('Failed to delete'); }
  };

  const openAdd = () => {
    setEditing(null); setCreating(true);
    setEditForm({ name: '', category: '', scope: '', frequency: 'SINGLE', projectId: '' });
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d); setCreating(false);
    setEditForm({ name: d.name, category: d.category || '', scope: d.scope || '', frequency: d.frequency || 'SINGLE', projectId: d.projectId || '' });
    setModalOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm, projectId: editForm.projectId ? Number(editForm.projectId) : undefined };
      if (creating) await api.post('/project-deliverables', payload);
      else await api.patch(`/project-deliverables/${editing.id}`, payload);
      setModalOpen(false);
      fetchDeliverables();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save deliverable'); }
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', projectId: '', owner: '', dueDateFrom: '', dueDateTo: '' });
    setSearch('');
  };

  const filtersActive = Object.values(filters).some(v => v) || search;

  const renderTable = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <SortHeader label="Name" sortKey="name" />
              <SortHeader label="Project" sortKey="projectName" />
              <SortHeader label="Status" sortKey="status" />
              <SortHeader label="Priority" sortKey="priority" />
              <SortHeader label="Progress" sortKey="computedStatus" />
              <SortHeader label="Due Date" sortKey="nextDate" />
              <SortHeader label="Owner" sortKey="owner" className="hidden md:table-cell" />
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedDeliverables.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-16 text-center text-gray-400">No deliverables match your filters</td></tr>
            ) : sortedDeliverables.map(d => {
              const priority = getPriority(d);
              const progress = getProgress(d);
              const daysLeft = d.nextDate ? Math.ceil((new Date(d.nextDate) - new Date()) / 86400000) : null;
              return (
                <tr key={d.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                    {d.scope && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{d.scope}</p>}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{d.projectName || `Project #${d.projectId}`}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle(d.status)}`}>
                      {STATUS_LABELS[d.status] || d.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${priority.color}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress.value}%`, backgroundColor: progress.color }} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 w-6 text-right tabular-nums">{progress.value}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs ${daysLeft !== null && daysLeft <= 0 ? 'text-red-600 font-semibold' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(d.nextDate)}
                      </span>
                      {daysLeft !== null && daysLeft <= 0 && (
                        <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-1 py-0.5 rounded">{Math.abs(daysLeft)}d</span>
                      )}
                      {daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && (
                        <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1 py-0.5 rounded">{daysLeft}d</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 hidden md:table-cell">{d.owner || '—'}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleMarkDone(d.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark done">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kanbanData.map(col => (
        <div
          key={col.key}
          onDragOver={(e) => handleDragOver(e, col.key)}
          onDragLeave={() => setHoveredColumn(null)}
          onDrop={(e) => handleDrop(e, col.key)}
          className={`rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col transition-colors duration-200 ${hoveredColumn === col.key ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-200' : ''}`}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 ${col.color.split(' ')[0]} rounded-t-xl`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${col.key === 'PENDING' ? 'bg-gray-400' : col.key === 'IN_PROGRESS' ? 'bg-blue-500' : col.key === 'REVIEW' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{col.label}</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">{col.items.length}</span>
          </div>
          <div className="flex-1 p-3 space-y-3 min-h-[200px] overflow-auto">
            {col.items.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-gray-400">No items</div>
            ) : col.items.map(d => (
              <KanbanCard key={d.id} d={d} onEdit={openEdit} onDelete={handleDelete} onMarkDone={handleMarkDone} />
            ))}
          </div>
          {hostColumn === col.key && (
            <div className="px-3 pb-3">
              <div className="rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-center text-xs text-indigo-500 animate-pulse">
                Dropping...
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTimeline = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {timelineData.length === 0 ? (
        <div className="py-16 text-center text-gray-400">No deliverable due dates to show on timeline</div>
      ) : (
        <div className="overflow-auto">
          <div className="flex gap-0 min-w-max p-4">
            {timelineData.map(month => (
              <div key={month.key} className="flex-shrink-0 w-64">
                <div className="px-3 py-2 bg-indigo-50 rounded-t-lg border border-indigo-100 mb-2">
                  <p className="text-xs font-bold text-indigo-700">{month.label}</p>
                  <p className="text-[10px] text-indigo-400">{month.items.length} deliverable{month.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-2 px-1">
                  {month.items.map(d => <TimelineCard key={d.id} d={d} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Deliverables</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredDeliverables.length} of {deliverables.length} deliverables</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {[
              { key: 'table', icon: List, label: 'Table' },
              { key: 'kanban', icon: Columns3, label: 'Kanban' },
              { key: 'timeline', icon: Calendar, label: 'Timeline' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  view === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          {canManage && (
            <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input type="text" placeholder="Search deliverables..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400" />
            {search && <button onClick={() => setSearch('')} className="p-0.5 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
            <option value="">All Status</option>
            <optgroup label="Kanban">
              {KANBAN_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </optgroup>
            <optgroup label="Health">
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due Soon</option>
              <option value="valid">On Track</option>
            </optgroup>
          </select>
          <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
            <option value="">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={filters.projectId} onChange={e => setFilters(f => ({ ...f, projectId: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filters.owner} onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
            <option value="">All Owners</option>
            {allOwners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="date" value={filters.dueDateFrom} onChange={e => setFilters(f => ({ ...f, dueDateFrom: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" title="Due from" />
          <input type="date" value={filters.dueDateTo} onChange={e => setFilters(f => ({ ...f, dueDateTo: e.target.value }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" title="Due to" />
          {filtersActive && (
            <button onClick={clearFilters} className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {view === 'table' && renderTable()}
      {view === 'kanban' && renderKanban()}
      {view === 'timeline' && renderTimeline()}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={creating ? 'Add Deliverable' : 'Edit Deliverable'}>
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select value={editForm.projectId || ''} onChange={e => setEditForm({ ...editForm, projectId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
                <option value="">Select</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300">
                <option value="SINGLE">Single</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <textarea value={editForm.scope} onChange={e => setEditForm({ ...editForm, scope: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">{creating ? 'Create' : 'Update'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
