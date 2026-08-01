import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProjectWorkspaceDrawer from '../components/ProjectWorkspaceDrawer';
import GanttChart from '../components/GanttChart';
import * as XLSX from 'xlsx';
import {
  Search, ChevronDown, ChevronUp, ChevronsUpDown, Download, FileSpreadsheet,
  Plus, Filter, X, Columns3, ArrowLeft, ArrowRight, List, GanttChartSquare,
} from 'lucide-react';

const ALL_COLUMNS = [
  { key: 'name', label: 'Name', defaultVisible: true, width: 220, minWidth: 100, sortable: true, filterable: 'text' },
  { key: 'bu', label: 'BU', defaultVisible: true, width: 120, minWidth: 80, sortable: true, filterable: 'text' },
  { key: 'type', label: 'Type', defaultVisible: true, width: 130, minWidth: 80, sortable: true, filterable: 'text' },
  { key: 'progress', label: 'Progress', defaultVisible: true, width: 140, minWidth: 100, sortable: true, filterable: false },
  { key: 'status', label: 'Status', defaultVisible: true, width: 130, minWidth: 100, sortable: true, filterable: 'select' },
  { key: 'spoc', label: 'SPOC', defaultVisible: true, width: 140, minWidth: 80, sortable: true, filterable: 'text' },
  { key: 'startDate', label: 'Start Date', defaultVisible: true, width: 130, minWidth: 100, sortable: true, filterable: false },
  { key: 'endDate', label: 'End Date', defaultVisible: true, width: 130, minWidth: 100, sortable: true, filterable: false },
  { key: 'teamSize', label: 'Team', defaultVisible: true, width: 80, minWidth: 60, sortable: true, filterable: false },
  { key: 'budget', label: 'Budget', defaultVisible: false, width: 130, minWidth: 100, sortable: true, filterable: false },
  { key: 'infraManagedBy', label: 'Infra', defaultVisible: false, width: 130, minWidth: 80, sortable: true, filterable: 'text' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}

function formatCurrency(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const s = map[status] || 'bg-gray-100 text-gray-500 border-gray-200';
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${s}`}>{status?.replace(/_/g, ' ') || 'N/A'}</span>;
}

function ProgressBar({ value }) {
  const v = Math.min(Math.max(value || 0, 0), 100);
  const color = v >= 70 ? '#22C55E' : v >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${v}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium text-gray-500 tabular-nums w-8 text-right">{v}%</span>
    </div>
  );
}

function formatCellValue(row, col) {
  if (col.key === 'progress') return <ProgressBar value={row.progress} />;
  if (col.key === 'status') return <StatusBadge status={row.status} />;
  if (col.key === 'startDate' || col.key === 'endDate') return formatDate(row[col.key]);
  if (col.key === 'budget') return formatCurrency(row.budget);
  if (col.key === 'teamSize') return row.teamSize ?? '—';
  return row[col.key] || '—';
}

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [projects, setProjects] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('table');

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({});
  const [activeFilterCol, setActiveFilterCol] = useState(null);
  const [columnWidths, setColumnWidths] = useState(() =>
    Object.fromEntries(ALL_COLUMNS.map(c => [c.key, c.width]))
  );
  const [visibleColumns, setVisibleColumns] = useState(() =>
    new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [workspaceProject, setWorkspaceProject] = useState(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const headerRef = useRef(null);

  const fetchProjects = useCallback(async () => {
    try {
      const [projRes, delRes] = await Promise.all([
        api.get('/projects'),
        api.get('/project-deliverables').catch(() => ({ data: [] })),
      ]);
      setProjects(projRes.data);
      setDeliverables(delRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openWorkspace = (project) => {
    setWorkspaceProject(project);
    setWorkspaceOpen(true);
  };

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        ALL_COLUMNS.some(col => {
          const val = p[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    Object.entries(filters).forEach(([key, val]) => {
      if (!val) return;
      list = list.filter(p => {
        const cell = (p[key] || '').toLowerCase();
        return cell.includes(val.toLowerCase());
      });
    });
    list.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'budget' || sortKey === 'teamSize') {
        va = Number(va) || 0; vb = Number(vb) || 0;
      } else if (sortKey === 'startDate' || sortKey === 'endDate') {
        va = va || ''; vb = vb || '';
      } else {
        va = (va || '').toLowerCase();
        vb = (vb || '').toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [projects, search, sortKey, sortDir, filters]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleResizeStart = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = columnWidths[colKey];
    const minW = ALL_COLUMNS.find(c => c.key === colKey)?.minWidth || 60;

    const handleMouseMove = (ev) => {
      const diff = ev.clientX - startX;
      const newW = Math.max(minW, startW + diff);
      setColumnWidths(prev => ({ ...prev, [colKey]: newW }));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  const exportCSV = () => {
    const cols = ALL_COLUMNS.filter(c => visibleColumns.has(c.key));
    const rows = filtered.map(p => {
      const row = {};
      cols.forEach(c => {
        if (c.key === 'progress') row[c.label] = `${p.progress || 0}%`;
        else if (c.key === 'status') row[c.label] = p.status || '';
        else if (c.key === 'startDate' || c.key === 'endDate') row[c.label] = formatDate(p[c.key]);
        else if (c.key === 'budget') row[c.label] = formatCurrency(p.budget);
        else row[c.label] = p[c.key] || '';
      });
      return row;
    });
    const header = cols.map(c => c.label).join(',');
    const body = rows.map(r => cols.map(c => {
      let v = r[c.label];
      if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `projects_export.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const cols = ALL_COLUMNS.filter(c => visibleColumns.has(c.key));
    const data = filtered.map(p => {
      const row = {};
      cols.forEach(c => {
        if (c.key === 'progress') row[c.label] = p.progress || 0;
        else if (c.key === 'status') row[c.label] = p.status || '';
        else if (c.key === 'startDate' || c.key === 'endDate') row[c.label] = p[c.key] || '';
        else if (c.key === 'budget') row[c.label] = p.budget || 0;
        else row[c.label] = p[c.key] || '';
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_col(C) + '1';
      if (ws[addr]) ws[addr].s = { font: { bold: true } };
    }
    ws['!cols'] = cols.map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, 'projects_export.xlsx');
  };

  const uniqueStatuses = [...new Set(projects.map(p => p.status).filter(Boolean))];

  const visibleCols = ALL_COLUMNS.filter(c => visibleColumns.has(c.key) || c.key === 'actions');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4F46E5]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">{isAdmin ? 'Manage your project portfolio' : 'View your assigned projects'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'table', icon: List, label: 'Table' },
                { key: 'gantt', icon: GanttChartSquare, label: 'Gantt' },
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
            <button onClick={exportCSV} className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={exportExcel} className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          {isAdmin && (
            <button onClick={() => openWorkspace({ _new: true })} className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338CA] transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Project
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {view === 'gantt' && (
        <GanttChart projects={filtered} deliverables={deliverables} onRefresh={fetchProjects} />
      )}

      {view === 'table' && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-1 max-w-md focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition-shadow">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
            />
            {search && <button onClick={() => setSearch('')} className="p-0.5 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveFilterCol(activeFilterCol ? null : '_menu')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${Object.keys(filters).length > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
            </button>
            {activeFilterCol === '_menu' && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-30 min-w-[200px]">
                <p className="text-xs font-semibold text-gray-400 uppercase px-2 py-1">Column Filters</p>
                {ALL_COLUMNS.filter(c => c.filterable).map(col => (
                  <div key={col.key} className="px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600 mb-1">{col.label}</p>
                    {col.filterable === 'select' ? (
                      <select
                        value={filters[col.key] || ''}
                        onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="">All</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={`Filter ${col.label}`}
                        value={filters[col.key] || ''}
                        onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                      />
                    )}
                  </div>
                ))}
                {Object.keys(filters).length > 0 && (
                  <button onClick={() => setFilters({})} className="w-full text-xs text-red-600 font-semibold px-2 py-1.5 mt-1 hover:bg-red-50 rounded-lg">Clear All</button>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveFilterCol(activeFilterCol === '_cols' ? null : '_cols')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${visibleColumns.size < ALL_COLUMNS.length ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Columns3 className="w-3.5 h-3.5" /> Columns
            </button>
            {activeFilterCol === '_cols' && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-30 min-w-[180px]">
                <p className="text-xs font-semibold text-gray-400 uppercase px-2 py-1">Toggle Columns</p>
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.key)}
                      onChange={e => {
                        setVisibleColumns(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(col.key);
                          else next.delete(col.key);
                          return next;
                        });
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
                    />
                    <span className="text-xs text-gray-700">{col.label}</span>
                  </label>
                ))}
                <button onClick={() => setVisibleColumns(new Set(ALL_COLUMNS.map(c => c.key)))} className="w-full text-xs text-indigo-600 font-semibold px-2 py-1.5 mt-1 hover:bg-indigo-50 rounded-lg">Show All</button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-330px)]" ref={headerRef}>
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {visibleCols.map(col => (
                  <th
                    key={col.key}
                    className="relative px-4 py-3 select-none border-r border-gray-100 last:border-r-0"
                    style={{ width: columnWidths[col.key] || col.width, minWidth: col.minWidth }}
                  >
                    <div className="flex items-center gap-1">
                      {col.sortable !== false ? (
                        <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-gray-800 transition-colors flex-1">
                          {col.label}
                          {sortKey === col.key ? (
                            sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-500" /> : <ChevronDown className="w-3 h-3 text-indigo-500" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </button>
                      ) : (
                        <span>{col.label}</span>
                      )}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400 hover:w-1.5 transition-colors z-10"
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                    />
                  </th>
                ))}
                <th className="px-4 py-3 text-right sticky right-0 bg-gray-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]" style={{ width: 80, minWidth: 80 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">{search || Object.keys(filters).length > 0 ? 'No projects match your search' : 'No projects found'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                    onClick={() => openWorkspace(p)}
                  >
                    {visibleCols.map(col => (
                      <td key={col.key} className="px-4 py-3 text-gray-700 border-r border-gray-50 last:border-r-0 truncate" style={{ maxWidth: columnWidths[col.key] || col.width }}>
                        {formatCellValue(p, col)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-indigo-50/30 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      <button
                        onClick={(e) => { e.stopPropagation(); openWorkspace(p); }}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {filtered.length} of {projects.length} projects
            </span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${page === pageNum ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      <ProjectWorkspaceDrawer
        open={workspaceOpen}
        onClose={() => { setWorkspaceOpen(false); setWorkspaceProject(null); fetchProjects(); }}
        project={workspaceProject}
        isNew={workspaceProject?._new}
      />
    </div>
  );
}
