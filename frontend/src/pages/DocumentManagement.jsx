import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FileUploadModal from '../components/FileUploadModal';
import {
  X, Download, Eye, Upload, Pencil, Trash2, MoreVertical,
  Check, AlertTriangle,
} from 'lucide-react';

const FILE_TYPE_OPTIONS = ['pdf','doc','docx','xls','xlsx','csv','ppt','pptx','txt','png','jpg','jpeg','zip'];

const typeIcons = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  csv: '📋', ppt: '📽️', pptx: '📽️', txt: '📃',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', zip: '📦',
};

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl animate-fade-in ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function RenameModal({ fileDoc, open, onClose, onRenamed }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && fileDoc) {
      const base = fileDoc.originalFilename?.replace(/\.[^.]+$/, '') || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(base);
    }
  }, [open, fileDoc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !fileDoc) return;
    const ext = fileDoc.fileType;
    const fullName = ext ? `${name.trim()}.${ext}` : name.trim();
    setLoading(true);
    try {
      await api.patch(`/documents/${fileDoc.id}/rename`, { filename: fullName });
      onRenamed?.();
      onClose();
    } catch (err) {
      console.error('Rename failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6 animate-fade-in-scale">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-[#EDEDEF]">Rename Document</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Filename</label>
            <div className="flex items-center rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30" style={{ border: '1px solid var(--border-color)' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' }}
                placeholder="Enter filename"
                autoFocus
              />
              {fileDoc?.fileType && (
                <span className="px-3 py-2 text-sm font-mono" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-page)', borderLeft: '1px solid var(--border-color)' }}>.{fileDoc.fileType}</span>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" disabled={loading || !name.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-deep disabled:opacity-50 transition-colors flex items-center gap-2">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ fileDoc, open, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!fileDoc) return;
    setLoading(true);
    try {
      await api.delete(`/documents/${fileDoc.id}`);
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-4 p-6 animate-fade-in-scale">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-[#EDEDEF]">Delete Document</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete <span className="font-semibold">{fileDoc?.originalFilename}</span>? The file will be permanently removed from storage.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionsMenu({ fileDoc, canUpload, canDelete, onRename, onDelete, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [versionUploading, setVersionUploading] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const fileInputRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    const handleResize = () => setOpen(false);
    window.document.addEventListener('mousedown', handleClick);
    window.document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.document.removeEventListener('mousedown', handleClick);
      window.document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(!open);
  };

  const handleView = async () => {
    setOpen(false);
    try {
      const res = await api.get(`/documents/${fileDoc.id}/preview`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (err) {
      console.error('View failed:', err);
    }
  };

  const handleDownload = async () => {
    setOpen(false);
    try {
      const res = await api.get(`/documents/${fileDoc.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileDoc.originalFilename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleVersionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVersionUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/documents/${fileDoc.id}/version`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onRefresh?.();
    } catch (err) {
      console.error('Version upload failed', err);
    } finally {
      setVersionUploading(false);
      setOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRename = () => {
    setOpen(false);
    onRename?.(fileDoc);
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete?.(fileDoc);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: position.top,
            right: position.right,
            zIndex: 9999,
            minWidth: '180px',
            padding: '4px 0',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button onClick={handleView} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium transition-colors text-left" style={{ color: 'var(--text-secondary)' }}>
            <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            View
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium transition-colors text-left" style={{ color: 'var(--text-secondary)' }}>
            <Download className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            Download
          </button>
          {canUpload && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={versionUploading}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium transition-colors text-left disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Upload className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                {versionUploading ? 'Uploading...' : 'Upload New Version'}
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleVersionUpload} />
              <button onClick={handleRename} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium transition-colors text-left" style={{ color: 'var(--text-secondary)' }}>
                <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                Rename
              </button>
            </>
          )}
          {canDelete && (
            <>
              <div style={{ borderTop: '1px solid var(--border-color)' }} className="my-1" />
              <button onClick={handleDelete} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 transition-colors text-left">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>,
        window.document.body
      )}
    </>
  );
}

export default function DocumentManagement() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    fileType: '',
    dateFrom: '',
    dateTo: '',
  });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isPM = user?.role === 'PM';
  const canUpload = isAdmin || isPM;
  const userId = user?.id;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).catch(() => {});
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.fileType) params.fileType = filters.fileType;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (selectedProjectId) params.projectId = selectedProjectId;
      const res = await api.get('/documents', { params });
      setDocuments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedProjectId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const clearFilters = () => {
    setFilters({ search: '', fileType: '', dateFrom: '', dateTo: '' });
    setSelectedProjectId('');
  };

  const handleRefresh = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDeleteComplete = useCallback(() => {
    showToast('Document deleted successfully', 'success');
    handleRefresh();
  }, [handleRefresh, showToast]);

  const handleRenameComplete = useCallback(() => {
    showToast('Document renamed successfully', 'success');
    handleRefresh();
  }, [handleRefresh, showToast]);

  const handleRename = useCallback((doc) => setRenameTarget(doc), []);
  const handleDelete = useCallback((doc) => setDeleteTarget(doc), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
      </div>
    );
  }

  const grouped = {};
  for (const d of documents) {
    const key = d.projectId || 'unassigned';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Document Repository</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Centralized document management across all projects.</p>
        </div>
        {canUpload && (
          selectedProjectId ? (
            <button onClick={() => setUploadOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Upload to Project
            </button>
          ) : (
            <span className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Select a project to upload
            </span>
          )
        )}
      </div>

      {error && <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>{error}</div>}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center rounded-lg px-3 py-2 flex-1 min-w-[200px]" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <svg className="w-4 h-4 mr-2 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search files..." value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} className="bg-transparent text-sm outline-none w-full" style={{ color: 'var(--text-primary)' }} />
        </div>
        <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.fileType} onChange={(e) => setFilters(f => ({ ...f, fileType: e.target.value }))} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Types</option>
          {FILE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" title="From" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" title="To" />
        {(filters.search || filters.fileType || filters.dateFrom || filters.dateTo || selectedProjectId) && (
          <button onClick={clearFilters} className="px-3 py-2 text-sm rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>Clear</button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>No documents found</div>
      ) : (
        Object.entries(grouped).map(([projectId, docs]) => {
          const project = projects.find(p => p.id === Number(projectId));
          return (
            <div key={projectId}>
              <div className="flex items-center justify-between px-1 py-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {project ? (
                    <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedProjectId(projectId)}>{project.name}</span>
                  ) : `Project #${projectId}`}
                  <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>{docs.length} file(s)</span>
                </h3>
                {canUpload && Number(projectId) > 0 && (
                  <button onClick={() => { setSelectedProjectId(projectId); setUploadOpen(true); }} className="text-xs text-primary hover:text-primary-deep font-medium">Upload</button>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl" style={{ background: 'var(--bg-row)', boxShadow: 'var(--shadow-table)', border: '1px solid var(--border-subtle)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'var(--bg-table-header)' }}>
                      <th className="px-5 py-3.5 font-medium">Name</th>
                      <th className="px-5 py-3.5 font-medium">Type</th>
                      <th className="px-5 py-3.5 font-medium">Size</th>
                      <th className="px-5 py-3.5 font-medium">Version</th>
                      <th className="px-5 py-3.5 font-medium">Date</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 w-12"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {docs.map(d => {
                      const canDelete = isAdmin || (isPM && d.uploadedBy === userId);
                      return (
                        <tr key={d.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{typeIcons[d.fileType] || '📄'}</span>
                              <span className="text-sm font-medium truncate max-w-[250px]" style={{ color: 'var(--text-primary)' }} title={d.originalFilename}>{d.originalFilename}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase" style={{ backgroundColor: 'var(--bg-badge)', color: 'var(--text-muted)' }}>{d.fileType}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatSize(d.fileSize)}</td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>v{d.versionNumber}</td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{d.uploadTimestamp ? new Date(d.uploadTimestamp).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                              backgroundColor: d.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'var(--bg-badge)',
                              color: d.status === 'ACTIVE' ? '#4ADE80' : 'var(--text-muted)',
                            }}>{d.status}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <ActionsMenu
                              fileDoc={d}
                              canUpload={canUpload}
                              canDelete={canDelete}
                              onRename={handleRename}
                              onDelete={handleDelete}
                              onRefresh={handleRefresh}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {uploadOpen && selectedProjectId && (
        <FileUploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { handleRefresh(); setUploadOpen(false); showToast('Document uploaded successfully', 'success'); }}
          projectId={Number(selectedProjectId)}
        />
      )}

      <RenameModal
        fileDoc={renameTarget}
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        onRenamed={handleRenameComplete}
      />

      <DeleteConfirmModal
        fileDoc={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleteComplete}
      />
    </div>
  );
}
