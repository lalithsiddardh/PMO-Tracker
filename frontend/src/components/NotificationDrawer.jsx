import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { X, Bell, Check, CheckCheck, Trash2, Projector, ListTodo, FileText, Settings, Clock } from 'lucide-react';

const TYPE_ICONS = {
  PROJECT: { icon: Projector, color: 'var(--notif-project-color)', bg: 'var(--notif-project-bg)', label: 'Project' },
  TASK: { icon: ListTodo, color: 'var(--notif-task-color)', bg: 'var(--notif-task-bg)', label: 'Task' },
  DOCUMENT: { icon: FileText, color: 'var(--notif-doc-color)', bg: 'var(--notif-doc-bg)', label: 'Document' },
  DELIVERABLE: { icon: FileText, color: 'var(--notif-deliverable-color)', bg: 'var(--notif-deliverable-bg)', label: 'Deliverable' },
  SYSTEM: { icon: Settings, color: 'var(--notif-system-color)', bg: 'var(--notif-system-bg)', label: 'System' },
};

function getTypeConfig(type) {
  const t = (type || '').toUpperCase();
  if (t.includes('PROJECT')) return TYPE_ICONS.PROJECT;
  if (t.includes('TASK')) return TYPE_ICONS.TASK;
  if (t.includes('DOC') || t.includes('FILE') || t.includes('UPLOAD')) return TYPE_ICONS.DOCUMENT;
  if (t.includes('DELIVERABLE')) return TYPE_ICONS.DELIVERABLE;
  return TYPE_ICONS.SYSTEM;
}

function getRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateGroup(date) {
  const now = new Date();
  const d = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (notifDate.getTime() === today.getTime()) return 'Today';
  if (notifDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Older';
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'PROJECT', label: 'Projects', icon: Projector },
  { key: 'TASK', label: 'Tasks', icon: ListTodo },
  { key: 'DOCUMENT', label: 'Documents', icon: FileText },
  { key: 'SYSTEM', label: 'System', icon: Settings },
];

export default function NotificationDrawer({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [open, fetchNotifs]);

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

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const categorized = useMemo(() => {
    const grouped = { Today: [], Yesterday: [], Older: [] };
    const filtered = filter === 'all'
      ? notifications
      : notifications.filter(n => {
          const t = (n.type || '').toUpperCase();
          if (filter === 'PROJECT') return t.includes('PROJECT');
          if (filter === 'TASK') return t.includes('TASK');
          if (filter === 'DOCUMENT') return t.includes('DOC') || t.includes('FILE') || t.includes('UPLOAD');
          if (filter === 'SYSTEM') {
            return !t.includes('PROJECT') && !t.includes('TASK') && !t.includes('DOC') && !t.includes('FILE') && !t.includes('UPLOAD') && !t.includes('DELIVERABLE');
          }
          return true;
        });

    filtered.forEach(n => {
      const group = getDateGroup(n.createdAt);
      if (grouped[group]) grouped[group].push(n);
    });

    return Object.entries(grouped).filter(([, items]) => items.length > 0);
  }, [notifications, filter]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => {});
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                <p className="text-[10px] text-gray-400">{unreadCount} unread · {notifications.length} total</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 px-5 pb-3 overflow-x-auto">
            {FILTERS.map(f => {
              const Icon = f.icon;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    active ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-3" />
              <p className="text-sm text-gray-400">Loading notifications...</p>
            </div>
          ) : categorized.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Bell className="w-12 h-12 mb-3 text-gray-200" />
              <p className="text-sm text-gray-400 font-medium">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">
                {filter !== 'all' ? 'No notifications match this filter' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {categorized.map(([group, items]) => (
                <div key={group}>
                  <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-5 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{group}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{items.length}</span>
                    </div>
                  </div>
                  {items.map(n => {
                    const tc = getTypeConfig(n.type);
                    const Icon = tc.icon;
                    return (
                      <div
                        key={n.id}
                        className={`px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/70 transition-colors group ${
                          !n.isRead ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: tc.bg }}
                          >
                            <Icon className="w-4 h-4" style={{ color: tc.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {n.title}
                                  {!n.isRead && <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 ml-1.5 align-middle" />}
                                </p>
                                <p className={`text-[11px] mt-0.5 leading-relaxed ${!n.isRead ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {n.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">{getRelativeTime(n.createdAt)}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.bg, color: tc.color }}>
                                  {tc.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!n.isRead && (
                                  <button
                                    onClick={() => handleMarkRead(n.id)}
                                    className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-5 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Auto-refreshes every 30s</span>
          <button onClick={fetchNotifs} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold">
            Refresh
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.25s ease-out; }
      `}</style>
    </div>
  );
}
