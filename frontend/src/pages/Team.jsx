import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import {
  Search, X, ArrowUpDown, ChevronRight,
  Mail, Phone, FolderKanban, FileText, Upload, TrendingUp,
  Calendar, Shield, Users,
} from 'lucide-react';

const ROLE_DESIGNATIONS = {
  SUPER_ADMIN: 'System Administrator',
  ADMIN: 'Administrator',
  PM: 'Senior Project Manager',
  DEVELOPER: 'Senior Software Developer',
  TESTER: 'Senior QA Engineer',
  BA: 'Business Analyst',
  QA: 'Quality Assurance Engineer',
  DEVOPS: 'DevOps Engineer',
  DESIGNER: 'UI/UX Designer',
  OTHER: 'Team Member',
};

const ROLE_COLORS = {
  SUPER_ADMIN: { bg: '#7C3AED', light: '#EDE9FE', text: '#6D28D9', label: 'Super Admin' },
  ADMIN: { bg: '#4F46E5', light: '#E0E7FF', text: '#4338CA', label: 'Admin' },
  PM: { bg: '#0EA5E9', light: '#E0F2FE', text: '#0369A1', label: 'Project Manager' },
  DEVELOPER: { bg: '#10B981', light: '#D1FAE5', text: '#047857', label: 'Developer' },
  TESTER: { bg: '#F59E0B', light: '#FEF3C7', text: '#B45309', label: 'Tester' },
  BA: { bg: '#14B8A6', light: '#CCFBF1', text: '#0F766E', label: 'Business Analyst' },
  QA: { bg: '#8B5CF6', light: '#EDE9FE', text: '#6D28D9', label: 'QA' },
  DEVOPS: { bg: '#64748B', light: '#F1F5F9', text: '#475569', label: 'DevOps' },
  DESIGNER: { bg: '#EC4899', light: '#FCE7F3', text: '#BE185D', label: 'Designer' },
  OTHER: { bg: '#94A3B8', light: '#F1F5F9', text: '#64748B', label: 'Other' },
};

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  DISABLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

function formatNumber(n) {
  if (n == null) return 0;
  return n.toLocaleString();
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarGradient(role) {
  const info = ROLE_COLORS[role] || ROLE_COLORS.OTHER;
  return `linear-gradient(135deg, ${info.bg}, ${info.bg}cc)`;
}

function MetricCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 min-w-0">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-800 tabular-nums">{formatNumber(value)}</span>
      {trend !== undefined && (
        <div className="w-full max-w-[60px]">
          <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(trend, 100)}%`, backgroundColor: color }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectBadge({ name }) {
  const colors = [
    'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700',
    'bg-rose-100 text-rose-700', 'bg-purple-100 text-purple-700',
    'bg-teal-100 text-teal-700', 'bg-orange-100 text-orange-700',
  ];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border border-transparent ${colors[hash % colors.length]}`}>
      {name}
    </span>
  );
}

function TeamMemberCard({ member, onClick }) {
  const info = ROLE_COLORS[member.role] || ROLE_COLORS.OTHER;
  const initials = getInitials(member.name);
  const perf = member.completionRate || 0;

  return (
    <div
      onClick={() => onClick(member)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      <div className="relative px-5 pt-5 pb-3" style={{ background: `linear-gradient(180deg, ${info.light} 0%, var(--bg-card) 100%)` }}>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md"
            style={{ background: getAvatarGradient(member.role) }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 truncate">{member.name}</h3>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {member.status === 'ACTIVE' ? 'Active' : member.status}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{member.designation || info.label}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[160px]">{member.email}</span>
              </span>
              {member.phone && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{member.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.light} ${info.text}`} style={{ backgroundColor: info.light, color: info.text, borderColor: `${info.bg}33` }}>
            {info.label}
          </span>
          {member.projectCount > 0 && (
            <span className="text-[10px] text-gray-400">{member.projectCount} project{member.projectCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {member.projects && member.projects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {member.projects.slice(0, 4).map((p, i) => (
              <ProjectBadge key={i} name={p} />
            ))}
            {member.projects.length > 4 && (
              <span className="text-[10px] text-gray-400 px-1">+{member.projects.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3">
        <div className="grid grid-cols-4 gap-2">
          <MetricCard icon={FolderKanban} label="Tasks" value={member.taskCount || 0} color="#4F46E5" />
          <MetricCard icon={FileText} label="Deliver" value={member.deliverableCount || 0} color="#0EA5E9" />
          <MetricCard icon={Upload} label="Docs" value={member.documentCount || 0} color="#10B981" />
          <MetricCard icon={TrendingUp} label="Perf" value={`${perf}%`} color={perf >= 70 ? '#10B981' : perf >= 40 ? '#F59E0B' : '#EF4444'} trend={perf} />
        </div>
      </div>

      <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          Joined {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
        </span>
        <span className="text-[10px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          View Profile <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

function ProfileDrawer({ member, open, onClose }) {
  const info = ROLE_COLORS[member?.role] || ROLE_COLORS.OTHER;
  const initials = getInitials(member?.name);
  const perf = member?.completionRate || 0;

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Team Member Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6" style={{ background: `linear-gradient(180deg, ${info.light} 0%, var(--bg-card) 60%)` }}>
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0"
              style={{ background: getAvatarGradient(member.role) }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{member.designation || info.label}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: info.light, color: info.text }}>
                  {info.label}
                </span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[member.status] || 'bg-gray-100 text-gray-500'}`}>
                  {member.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Email</p>
                <p className="text-xs font-medium text-gray-700 truncate">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Phone</p>
                <p className="text-xs font-medium text-gray-700">{member.phone || '—'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <Shield className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Role</p>
                <p className="text-xs font-medium text-gray-700">{member.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase">Joined</p>
                <p className="text-xs font-medium text-gray-700">{member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
              Assigned Projects ({member.projectCount || 0})
            </h4>
            {member.projects && member.projects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {member.projects.map((p, i) => (
                  <ProjectBadge key={i} name={p} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No projects assigned</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Tasks</p>
                <p className="text-xl font-bold text-indigo-600">{formatNumber(member.taskCount || 0)}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">active</p>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Deliverables</p>
                <p className="text-xl font-bold text-sky-600">{formatNumber(member.deliverableCount || 0)}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">total</p>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Documents</p>
                <p className="text-xl font-bold text-emerald-600">{formatNumber(member.documentCount || 0)}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">uploaded</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Completion Rate</p>
                <span className="text-sm font-bold" style={{ color: perf >= 70 ? '#10B981' : perf >= 40 ? '#F59E0B' : '#EF4444' }}>{perf}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${perf}%`, background: perf >= 70 ? 'linear-gradient(90deg, #10B981, #059669)' : perf >= 40 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #EF4444, #DC2626)' }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortButton({ label, sortKey: sk, currentSortKey, currentSortDir, onSort }) {
  return (
    <button
      onClick={() => onSort(sk)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        currentSortKey === sk ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 transition-transform ${currentSortKey === sk && currentSortDir === 'desc' ? 'rotate-180' : ''}`} />
    </button>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [profileMember, setProfileMember] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/team').catch(() => ({ data: [] })),
      api.get('/project-deliverables').catch(() => ({ data: [] })),
      api.get('/documents').catch(() => ({ data: [] })),
    ]).then(([teamRes, delRes, docRes]) => {
      const teamData = teamRes.data || [];
      const delData = delRes.data || [];
      const docData = docRes.data || [];

      const docCountByUser = {};
      docData.forEach(d => {
        const uid = d.uploadedBy;
        if (uid != null) docCountByUser[uid] = (docCountByUser[uid] || 0) + 1;
      });

      const delByOwner = {};
      const delStatusByOwner = {};
      delData.forEach(d => {
        const owner = d.owner;
        if (owner) {
          delByOwner[owner] = (delByOwner[owner] || 0) + 1;
          if (d.status === 'DONE' || d.status === 'COMPLETED') {
            delStatusByOwner[owner] = (delStatusByOwner[owner] || 0) + 1;
          }
        }
      });

      const enriched = teamData.map(m => {
        const ownerName = m.name;
        const totalDel = delByOwner[ownerName] || 0;
        const doneDel = delStatusByOwner[ownerName] || 0;
        const taskCount = totalDel - doneDel;
        const completionRate = totalDel > 0 ? Math.round((doneDel / totalDel) * 100) : 0;

        const info = ROLE_COLORS[m.role] || ROLE_COLORS.OTHER;

        return {
          ...m,
          designation: ROLE_DESIGNATIONS[m.role] || info.label,
          phone: null,
          joinedDate: m.createdAt || null,
          deliverableCount: totalDel,
          taskCount: Math.max(taskCount, 0),
          documentCount: docCountByUser[m.id] || 0,
          completionRate,
        };
      });

      setMembers(enriched);
    }).finally(() => setLoading(false));
  }, []);

  const allRoles = useMemo(() => [...new Set(members.map(m => m.role).filter(Boolean))], [members]);
  const allStatuses = useMemo(() => [...new Set(members.map(m => m.status).filter(Boolean))], [members]);

  const filtered = useMemo(() => {
    let list = [...members];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q) ||
        m.designation?.toLowerCase().includes(q) ||
        (m.projects || []).some(p => p.toLowerCase().includes(q))
      );
    }

    if (roleFilter) list = list.filter(m => m.role === roleFilter);
    if (statusFilter) list = list.filter(m => m.status === statusFilter);

    list.sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') { va = a.name?.toLowerCase() || ''; vb = b.name?.toLowerCase() || ''; }
      else if (sortKey === 'role') { va = a.role || ''; vb = b.role || ''; }
      else if (sortKey === 'projectCount') { va = a.projectCount || 0; vb = b.projectCount || 0; }
      else if (sortKey === 'deliverableCount') { va = a.deliverableCount || 0; vb = b.deliverableCount || 0; }
      else if (sortKey === 'completionRate') { va = a.completionRate || 0; vb = b.completionRate || 0; }
      else if (sortKey === 'email') { va = a.email?.toLowerCase() || ''; vb = b.email?.toLowerCase() || ''; }
      else { va = a.name?.toLowerCase() || ''; vb = b.name?.toLowerCase() || ''; }

      if (typeof va === 'string') {
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [members, search, roleFilter, statusFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const openProfile = (member) => {
    setProfileMember(member);
    setProfileOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {members.length} team members</p>
        </div>
        <div className="flex items-center gap-2">
          <SortButton label="Name" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
          <SortButton label="Role" sortKey="role" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
          <SortButton label="Projects" sortKey="projectCount" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
          <SortButton label="Deliverables" sortKey="deliverableCount" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
          <SortButton label="Performance" sortKey="completionRate" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-wrap">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-xs focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition-shadow">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, role, project..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
            />
            {search && <button onClick={() => setSearch('')} className="p-0.5 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          >
            <option value="">All Roles</option>
            {allRoles.map(r => (
              <option key={r} value={r}>{ROLE_COLORS[r]?.label || r}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          >
            <option value="">All Status</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <Users className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm">No team members match your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {filtered.map(m => (
              <TeamMemberCard key={m.id} member={m} onClick={openProfile} />
            ))}
          </div>
        )}
      </div>

      <ProfileDrawer member={profileMember} open={profileOpen} onClose={() => { setProfileOpen(false); setProfileMember(null); }} />

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
