import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDrawer from './NotificationDrawer';
import api from '../api/axios';
import {
  Search, FolderKanban, Users, FileText, CheckSquare, BarChart3, Bell,
  ChevronRight, ArrowUp, ArrowDown,
} from 'lucide-react';

const navItems = {
  all: [
    { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  ],
  admin: [
    { to: '/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { to: '/projects', label: 'Projects', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { to: '/portfolio', label: 'Portfolio', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { to: '/board', label: 'Task Board', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
    { to: '/team', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { to: '/deliverables', label: 'Deliverables', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/risk', label: 'Risk', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
    { to: '/org-security', label: 'Org Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { to: '/users', label: 'User Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { to: '/import', label: 'Import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { to: '/documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ],
  pm: [
    { to: '/projects', label: 'My Projects', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { to: '/board', label: 'Task Board', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
    { to: '/deliverables', label: 'Deliverables', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { to: '/registrations', label: 'Registrations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { to: '/import', label: 'Import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { to: '/documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ],
  user: [
    { to: '/projects', label: 'My Projects', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { to: '/documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ],
};

const SEARCH_CATEGORIES = [
  { key: 'projects', icon: FolderKanban, color: '#4F46E5', bg: '#EEF2FF', darkColor: '#818CF8', darkBg: 'rgba(99,102,241,0.12)', label: 'Projects' },
  { key: 'users', icon: Users, color: '#0EA5E9', bg: '#F0F9FF', darkColor: '#38BDF8', darkBg: 'rgba(14,165,233,0.12)', label: 'Users' },
  { key: 'documents', icon: FileText, color: '#10B981', bg: '#ECFDF5', darkColor: '#34D399', darkBg: 'rgba(16,185,129,0.12)', label: 'Documents' },
  { key: 'deliverables', icon: CheckSquare, color: '#8B5CF6', bg: '#F5F3FF', darkColor: '#A78BFA', darkBg: 'rgba(139,92,246,0.12)', label: 'Deliverables' },
  { key: 'reports', icon: BarChart3, color: '#F59E0B', bg: '#FEF3C7', darkColor: '#FBBF24', darkBg: 'rgba(245,158,11,0.12)', label: 'Reports' },
  { key: 'notifications', icon: Bell, color: '#EF4444', bg: '#FEF2F2', darkColor: '#F87171', darkBg: 'rgba(239,68,68,0.12)', label: 'Notifications' },
];

const REPORT_LINKS = [
  { name: 'Dashboard', link: '/reports', subtitle: 'Overview analytics' },
  { name: 'Project Report', link: '/reports', subtitle: 'Project status report' },
  { name: 'Progress Report', link: '/reports', subtitle: 'Progress tracking' },
  { name: 'Deliverable Report', link: '/reports', subtitle: 'Deliverable status report' },
  { name: 'Team Report', link: '/reports', subtitle: 'Team member report' },
  { name: 'Audit Report', link: '/reports', subtitle: 'Activity audit trail' },
  { name: 'Document Report', link: '/reports', subtitle: 'Document analytics' },
];

function SidebarLink({ item, active, collapsed, onClick }) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20'
          : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
      }`}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const [allDocuments, setAllDocuments] = useState([]);
  const [allNotifs, setAllNotifs] = useState([]);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    api.get('/documents').then(r => setAllDocuments(r.data || [])).catch(() => {});
    api.get('/notifications').then(r => setAllNotifs(r.data || [])).catch(() => {});
  }, []);

  const flatResults = useMemo(() => {
    if (!searchResults && !searchQuery.trim()) return [];
    const items = [];

    const backendResults = searchResults || {};

    SEARCH_CATEGORIES.forEach(cat => {
      if (cat.key === 'reports') {
        REPORT_LINKS.forEach(r => {
          if (r.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            items.push({ ...r, _category: cat, _categoryKey: 'reports' });
          }
        });
        return;
      }
      if (cat.key === 'notifications') {
        const filtered = allNotifs.filter(n =>
          (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.message || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
        filtered.forEach(n => {
          items.push({
            name: n.title,
            subtitle: n.message,
            link: '#',
            _category: cat,
            _categoryKey: 'notifications',
            _id: n.id,
          });
        });
        return;
      }
      if (cat.key === 'documents') {
        const filtered = allDocuments.filter(d =>
          (d.originalFilename || d.fileName || d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
        filtered.forEach(d => {
          items.push({
            name: d.originalFilename || d.fileName || d.name || 'Document',
            subtitle: d.description || d.fileType || '',
            link: `/documents`,
            _category: cat,
            _categoryKey: 'documents',
          });
        });
        return;
      }

      const results = backendResults[cat.key];
      if (results && results.length > 0) {
        results.forEach(r => {
          items.push({
            name: r.name || r.title,
            subtitle: r.subtitle || '',
            link: r.link || '#',
            _category: cat,
            _categoryKey: cat.key,
            _id: r.id,
          });
        });
      }
    });

    return items;
  }, [searchResults, searchQuery, allDocuments, allNotifs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIdx(-1);
  }, [searchQuery, searchResults]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data);
        setSearchOpen(true);
      } catch (err) {
        console.error(err);
        setSearchResults(null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen && flatResults.length > 0 && selectedIdx === -1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIdx(0);
    }
  }, [searchOpen, flatResults.length, selectedIdx]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (!searchOpen || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      const selected = flatResults[selectedIdx];
      if (selected) {
        const link = selected._categoryKey === 'notifications' ? '/dashboard' : selected.link;
        navigateTo(link);
      }
    }
  };

  const role = user?.role || 'USER';
  let links;
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    links = [...navItems.all, ...navItems.admin];
  } else if (role === 'PM') {
    links = [...navItems.all, ...navItems.pm];
  } else {
    links = [...navItems.all, ...navItems.user];
  }

  const handleLogout = () => { logout(); };

  const navigateTo = useCallback((path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
    setSelectedIdx(-1);
  }, [navigate]);

  const activeRoute = location.pathname;

  const catGroups = useMemo(() => {
    if (flatResults.length === 0) return [];
    const groups = {};
    flatResults.forEach(item => {
      const key = item._categoryKey;
      if (!groups[key]) groups[key] = { category: item._category, items: [] };
      groups[key].items.push(item);
    });
    return Object.entries(groups);
  }, [flatResults]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#111827] border-r border-[#1E293B] transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 flex flex-col`}>
        <div className="flex items-center gap-3 px-6 h-16 border-b border-[#1E293B] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-blue-500/30">FG</div>
          <span className="text-[#F8FAFC] font-semibold text-base whitespace-nowrap">PMO Tracker</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map((item) => (
            <SidebarLink key={item.to} item={item} active={activeRoute.startsWith(item.to) && item.to !== '/'} collapsed={false} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#1E293B]">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#1E293B] transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F8FAFC] truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-[#94A3B8] truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30" style={{ backgroundColor: 'var(--bg-topbar)', borderBottom: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div ref={searchRef} className="hidden sm:flex items-center rounded-lg px-3 py-2 w-80 relative transition-colors" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
              <Search className="w-4 h-4 mr-2 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects, users, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setSearchOpen(true)}
                onKeyDown={handleKeyDown}
                style={{ color: 'var(--text-primary)', backgroundColor: 'transparent' }}
                className="text-sm outline-none w-full placeholder:text-[var(--text-muted)]"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchOpen(false); setSelectedIdx(-1); }} style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {searchOpen && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl z-50 max-h-96 overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)' }}>
                  {catGroups.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No results found</div>
                  ) : (
                    catGroups.map(([key, { category, items }]) => {
                      const Icon = category.icon;
                      const startIdx = flatResults.findIndex(f => f._categoryKey === key);
                      const isDark = document.documentElement.classList.contains('dark');
                      const catBg = isDark ? category.darkBg : category.bg;
                      const catColor = isDark ? category.darkColor : category.color;
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider sticky top-0" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card-hover)' }}>
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: catBg }}>
                              <Icon className="w-2.5 h-2.5" style={{ color: catColor }} />
                            </div>
                            {category.label}
                            <span className="ml-auto text-[9px] font-normal" style={{ color: 'var(--text-muted)' }}>{items.length}</span>
                          </div>
                          {items.map((item, i) => {
                            const globalIdx = startIdx + i;
                            const isSelected = globalIdx === selectedIdx;
                            return (
                              <button
                                key={`${key}-${i}`}
                                onClick={() => navigateTo(item.link || '#')}
                                onMouseEnter={() => setSelectedIdx(globalIdx)}
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors"
                                style={{ backgroundColor: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent', color: isSelected ? '#2563EB' : 'var(--text-primary)' }}
                              >
                                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: catBg }}>
                                  <Icon className="w-3 h-3" style={{ color: catColor }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-medium" style={{ color: isSelected ? '#2563EB' : 'var(--text-primary)' }}>{item.name}</span>
                                  {item.subtitle && <span className="block text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.subtitle}</span>}
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: isSelected ? '#2563EB' : 'var(--text-muted)' }} />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                  <div className="sticky bottom-0" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                    <div className="px-4 py-2 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-2">
                        <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: 'var(--bg-card-hover)' }}>↵</span> Open
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: 'var(--bg-card-hover)' }}>Esc</span> Close
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setNotifOpen(true)}
              className="p-2 rounded-lg relative transition-colors" title="Notifications"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} className="p-2 rounded-lg transition-colors" title="Toggle theme" style={{ color: 'var(--text-secondary)' }}>
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2 pl-2 ml-1" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60A5FA' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="ml-1 p-1.5 rounded-lg transition-colors" title="Logout" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto" style={{ backgroundColor: 'var(--bg-page)' }}>
          <Outlet />
        </main>
      </div>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
