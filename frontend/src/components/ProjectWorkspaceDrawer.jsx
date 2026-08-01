import { useState, useEffect, useCallback, useRef } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FileUploadModal from './FileUploadModal';
import Modal from './Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

import {
  X, FolderKanban, FileText, ClipboardList, Users, Activity,
  BarChart3, Settings, Calendar, User, Upload, Download,
  Search, ChevronRight, Trash2, FolderOpen,
  Save, Archive, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: FolderKanban },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'deliverables', label: 'Deliverables', icon: ClipboardList },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];


const FOLDERS = ['All', 'Uncategorized', 'Requirements', 'Architecture', 'Design', 'Development', 'Testing', 'Deployment', 'Misc'];

const FILE_TYPES = ['', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'zip'];

const FILE_TYPE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  csv: '📋', ppt: '📽️', pptx: '📽️', txt: '📃',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', zip: '📦',
};


function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const CODE_TYPES = new Set(['txt','csv','js','ts','jsx','tsx','py','java','rb','go','rs','c','cpp','h','hpp','cs','php','swift','kt','scala','sql','sh','bash','zsh','yaml','yml','toml','ini','cfg','xml','json','md','css','scss','less','html','htm','r','pl','lua','hs','dart','groovy','gradle','properties','env','vue','svelte']);
const IMAGE_TYPES = new Set(['png','jpg','jpeg','gif','svg','webp','bmp','ico']);
const VIDEO_TYPES = new Set(['mp4','webm','mov','avi','mkv','wmv','flv']);
const OFFICE_TYPES = new Set(['doc','docx','xls','xlsx','ppt','pptx']);
const isCodeType = (t) => CODE_TYPES.has(t);
const isImageType = (t) => IMAGE_TYPES.has(t);
const isVideoType = (t) => VIDEO_TYPES.has(t);
const isOfficeType = (t) => OFFICE_TYPES.has(t);

function DocumentPreview({ doc, onClose, onDownload }) {
  const [codeContent, setCodeContent] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef(null);

  const type = doc?.fileType?.toLowerCase();

  useEffect(() => {
    if (!doc) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
    setImageError(false);
    setCodeContent(null);
    setPreviewUrl(null);
    const id = doc.id;

    if (isCodeType(type)) {
      setCodeLoading(true);
      api.get(`/documents/${id}/download`, { responseType: 'text' })
        .then(r => setCodeContent(r.data))
        .catch(() => setCodeContent('// Failed to load file content'))
        .finally(() => setCodeLoading(false));
    } else if (isImageType(type) || (type === 'pdf') || isVideoType(type)) {
      api.get(`/documents/${id}/preview`, { responseType: 'blob' })
        .then(res => {
          const url = URL.createObjectURL(res.data);
          setPreviewUrl(url);
        })
        .catch(() => setImageError(true));
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [doc?.id, type]);

  const handleWheel = (e) => {
    if (e.deltaY < 0) setZoom(z => Math.min(5, z + 0.1));
    else setZoom(z => Math.max(0.1, z - 0.1));
  };

  const codeFrame = codeLoading
    ? <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" /></div>
    : <pre className="text-sm leading-relaxed whitespace-pre-wrap break-all" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{codeContent}</pre>;

  const imageFrame = (
    <div className="flex items-center justify-center overflow-auto w-full h-full" onWheel={handleWheel} style={{ minHeight: '50vh' }}>
      {previewUrl ? (
        <img
          ref={imgRef}
          src={previewUrl}
          alt={doc.originalFilename}
          className="transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, maxWidth: zoom > 1 ? 'none' : '100%', maxHeight: '70vh' }}
          onError={() => setImageError(true)}
        />
      ) : imageError ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Failed to load image</p>
      ) : (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" /></div>
      )}
    </div>
  );

  const pdfFrame = (
    previewUrl ? (
      <iframe
        src={previewUrl}
        className="w-full rounded"
        style={{ height: '75vh', border: 'none', backgroundColor: '#525659' }}
        title={doc.originalFilename}
      />
    ) : (
      <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" /></div>
    )
  );

  const videoFrame = (
    <div className="flex items-center justify-center w-full" style={{ minHeight: '50vh' }}>
      {previewUrl ? (
        <video controls className="max-w-full max-h-[70vh] rounded" style={{ backgroundColor: '#000' }}>
          <source src={previewUrl} type={`video/${type === 'mp4' ? 'mp4' : type === 'webm' ? 'webm' : type === 'mov' ? 'quicktime' : type === 'avi' ? 'x-msvideo' : 'mp4'}`} />
        </video>
      ) : (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" /></div>
      )}
    </div>
  );

  const officeFrame = (
    <div className="flex flex-col items-center justify-center py-16">
      <FileText className="w-16 h-16 mb-4" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Preview not available for {type?.toUpperCase()} files</p>
      <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Download the file to view its contents</p>
      <button onClick={() => onDownload(doc.id, doc.originalFilename)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors">
        <Download className="w-4 h-4" />
        Download {doc.originalFilename}
      </button>
    </div>
  );

  const unsupportedFrame = (
    <div className="flex flex-col items-center justify-center py-16">
      <FileText className="w-16 h-16 mb-4" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Cannot preview {type?.toUpperCase()} files</p>
      <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>This file type is not supported for preview</p>
      <button onClick={() => onDownload(doc.id, doc.originalFilename)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors">
        <Download className="w-4 h-4" />
        Download
      </button>
    </div>
  );

  const renderPreview = () => {
    if (!type) return unsupportedFrame;
    if (type === 'pdf') return pdfFrame;
    if (isImageType(type)) return imageFrame;
    if (isVideoType(type)) return videoFrame;
    if (isCodeType(type)) return codeFrame;
    if (isOfficeType(type)) return officeFrame;
    return unsupportedFrame;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-base shrink-0">{FILE_TYPE_ICONS[doc?.fileType] || '📄'}</span>
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{doc?.originalFilename}</h3>
            {type === 'pdf' && <span className="text-[10px] px-2 py-0.5 rounded font-medium shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#F87171' }}>PDF</span>}
            {isImageType(type) && <span className="text-[10px] px-2 py-0.5 rounded font-medium shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>{zoom.toFixed(1)}x</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isImageType(type) && (
              <>
                <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Zoom In">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                </button>
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.5))} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Zoom Out">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" /></svg>
                </button>
                <button onClick={() => setZoom(1)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Reset Zoom">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </>
            )}
            <button onClick={() => onDownload(doc.id, doc.originalFilename)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: type === 'pdf' ? '#525659' : 'var(--bg-card)' }}>
          {doc ? renderPreview() : null}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const s = map[status] || 'bg-gray-100 text-gray-500 border-gray-200';
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${s}`}>{status?.replace(/_/g, ' ') || 'N/A'}</span>;
}

const SETTINGS_TABS = [
  { key: 'general', label: 'General Information' },
  { key: 'details', label: 'Project Details' },
  { key: 'notifications', label: 'Notification Preferences' },
  { key: 'members', label: 'Member Permissions' },
  { key: 'documents', label: 'Document Settings' },
  { key: 'archive', label: 'Archive Project' },
  { key: 'delete', label: 'Delete Project' },
];

function ProjectSettings({ project, onUpdate, user }) {
  const [nameDuplicate, setNameDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const nameCheckTimer = useRef(null);
  const currentName = useRef('');

  const checkNameDuplicate = useCallback(async (name, bu) => {
    if (!name || name.trim() === '' || name === project?.name) {
      setNameDuplicate(false);
      return;
    }
    setCheckingName(true);
    try {
      const params = { name };
      if (bu && bu.trim()) {
        params.bu = bu.trim();
      }
      const res = await api.get('/projects/check-name', { params });
      setNameDuplicate(res.data.duplicate);
    } catch (err) {
      console.error(err);
      setNameDuplicate(false);
    }
    setCheckingName(false);
  }, [project?.name]);

  const [form, setForm] = useState({
    name: '', description: '', status: '', priority: '',
    budget: '', defaultFolder: '', retentionDays: '',
    notifyEmail: '', notifyDeadline: '',
    bu: '', type: '', infraManagedBy: '', spoc: '',
    startDate: '', endDate: '', teamSize: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [archiveModal, setArchiveModal] = useState(false);

  useEffect(() => {
    if (project) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || '',
        priority: project.priority || '',
        budget: project.budget?.toString() || '',
        defaultFolder: project.defaultFolder || '',
        retentionDays: project.retentionDays?.toString() || '90',
        notifyEmail: project.notifyEmail || '',
        notifyDeadline: project.notifyDeadline || '',
        bu: project.bu || '',
        type: project.type || '',
        infraManagedBy: project.infraManagedBy || '',
        spoc: project.spoc || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        teamSize: project.teamSize?.toString() || '',
      });
    }
  }, [project]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
    setSuccess('');
    if (field === 'name') {
      currentName.current = val;
      // eslint-disable-next-line react-hooks/refs
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
      nameCheckTimer.current = setTimeout(() => checkNameDuplicate(val, form.bu), 400);
    }
    if (field === 'bu') {
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
      nameCheckTimer.current = setTimeout(() => checkNameDuplicate(form.name, val), 400);
    }
  };

  const handleSave = async () => {
    if (nameDuplicate) {
      setError('Project already exists in this Business Unit.');
      setSaving(false);
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const map = [
        ['name'], ['description'], ['status'], ['priority'],
        ['budget', Number], ['defaultFolder'], ['retentionDays', Number],
        ['notifyEmail'], ['notifyDeadline'],
        ['bu'], ['type'], ['infraManagedBy'], ['spoc'],
        ['teamSize', Number], ['startDate'], ['endDate'],
      ];
      const body = {};
      let hasChanges = false;
      for (const [field, transform] of map) {
        const raw = form[field];
        const curr = project[field];
        const val = transform === Number ? (raw === '' ? null : Number(raw)) : raw;
        if (String(val ?? '') !== String(curr ?? '')) {
          body[field] = val;
          hasChanges = true;
        }
      }
      if (!hasChanges) { setSaving(false); setSuccess('No changes to save.'); setTimeout(() => setSuccess(''), 2500); return; }
      const { data } = await api.patch(`/projects/${project.id}`, body);
      onUpdate(data);
      setSaving(false);
      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setSaving(false);
      if (err.response?.status === 409) {
        setError('Project already exists in this Business Unit.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save settings.');
      }
    }
  };

  const handleArchive = async () => {
    setSaving(true);
    try {
      await api.patch(`/projects/${project.id}`, { status: 'ARCHIVED' });
      onUpdate({ ...project, status: 'ARCHIVED' });
      setArchiveModal(false);
      setSuccess('Project archived successfully.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to archive project.');
    }
    setSaving(false);
  };

  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleteRequestLoading, setDeleteRequestLoading] = useState(false);

  useEffect(() => {
    return () => { if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current); };
  }, []);

  useEffect(() => {
    if (project?.id && user?.role === 'PM') {
      api.get(`/projects/${project.id}/delete-request-status`)
        .then(res => setDeleteRequest(res.data))
        .catch(() => setDeleteRequest({ hasPendingRequest: false }));
    }
  }, [project?.id, user?.role]);

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/projects/${project.id}`);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete project.');
      setSaving(false);
    }
    setConfirmAction(null);
  };

  const handleRequestDelete = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/projects/${project.id}/request-delete`);
      setDeleteRequest({ hasPendingRequest: true, status: 'PENDING', ...res.data });
      setConfirmAction(null);
      setSuccess('Delete request submitted for admin approval.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit delete request.');
    }
    setSaving(false);
  };

  const handleApproveDelete = async (requestId) => {
    setDeleteRequestLoading(true);
    try {
      await api.patch(`/projects/delete-requests/${requestId}/approve`);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve delete request.');
    }
    setDeleteRequestLoading(false);
    setConfirmAction(null);
  };

  const handleRejectDelete = async (requestId) => {
    const notes = prompt('Enter reason for rejection (optional):');
    setDeleteRequestLoading(true);
    try {
      await api.patch(`/projects/delete-requests/${requestId}/reject`, { notes: notes || '' });
      setDeleteRequest({ hasPendingRequest: false });
      setConfirmAction(null);
      setSuccess('Delete request rejected.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject delete request.');
    }
    setDeleteRequestLoading(false);
  };

  const [pendingDeleteRequests, setPendingDeleteRequests] = useState([]);
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      api.get('/projects/delete-requests', { params: { status: 'PENDING' } })
        .then(res => setPendingDeleteRequests(res.data))
        .catch(() => {});
    }
  }, [user?.role]);

  const myPendingRequest = deleteRequest?.hasPendingRequest ? deleteRequest : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Project Settings</h4>
        <div className="flex items-center gap-2">
          {success && <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{success}</span>}
          {error && <span className="text-sm font-medium text-red-600">{error}</span>}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-6 border-b pb-1" style={{ borderColor: 'var(--border-color)' }}>
          {SETTINGS_TABS.map(tab => {
            if (tab.key === 'delete' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'PM') return null;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="px-3 py-1.5 text-sm rounded-md transition-colors data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100">
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Project Name</label>
              <input value={form.name} onChange={handleChange('name')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: nameDuplicate ? '#EF4444' : 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
              {checkingName && <p className="text-xs text-gray-400 mt-1">Checking...</p>}
              {nameDuplicate && <p className="text-xs text-red-500 mt-1">Project already exists in this Business Unit.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Status</label>
              <select value={form.status} onChange={handleChange('status')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                <option value="">Select Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Description</label>
              <textarea value={form.description} onChange={handleChange('description')} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Priority</label>
              <select value={form.priority} onChange={handleChange('priority')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                <option value="">Select Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Budget ($)</label>
              <input type="number" value={form.budget} onChange={handleChange('budget')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={handleChange('startDate')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>End Date</label>
              <input type="date" value={form.endDate} onChange={handleChange('endDate')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Default Folder</label>
              <select value={form.defaultFolder} onChange={handleChange('defaultFolder')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                <option value="">Select Folder</option>
                {FOLDERS.filter(f => f !== 'All').map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Retention Days</label>
              <input type="number" value={form.retentionDays} onChange={handleChange('retentionDays')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Business Unit (BU)</label>
              <input value={form.bu} onChange={handleChange('bu')} placeholder="e.g. Enterprise, Platform, Infrastructure" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Project Type</label>
              <input value={form.type} onChange={handleChange('type')} placeholder="e.g. Development, Maintenance, Migration" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Infrastructure Managed By</label>
              <input value={form.infraManagedBy} onChange={handleChange('infraManagedBy')} placeholder="e.g. Internal, AWS, Azure" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>SPOC (Single Point of Contact)</label>
              <input value={form.spoc} onChange={handleChange('spoc')} placeholder="Name of the contact person" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Team Size</label>
              <input type="number" value={form.teamSize} onChange={handleChange('teamSize')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notification Email</label>
              <input type="email" value={form.notifyEmail} onChange={handleChange('notifyEmail')} placeholder="email@example.com" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Deadline Notification</label>
              <select value={form.notifyDeadline} onChange={handleChange('notifyDeadline')} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                <option value="">No Notification</option>
                <option value="1_DAY">1 Day Before</option>
                <option value="3_DAYS">3 Days Before</option>
                <option value="1_WEEK">1 Week Before</option>
                <option value="2_WEEKS">2 Weeks Before</option>
              </select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="p-6 rounded-lg border text-center" style={{ borderColor: 'var(--border-color)' }}>
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Member Permission Settings</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Manage project member roles and permissions from the Team tab.</p>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="p-6 rounded-lg border text-center" style={{ borderColor: 'var(--border-color)' }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Document Settings</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Configure document upload limits, allowed file types, and storage policies.</p>
          </div>
        </TabsContent>

        <TabsContent value="archive" className="space-y-4">
          <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-50 shrink-0">
                <Archive className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Archive Project</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Archiving will make the project read-only. All data is preserved and can be restored later.</p>
                <button onClick={() => setArchiveModal(true)} disabled={saving} className="mt-3 px-4 py-2 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50">
                  {saving ? 'Archiving...' : 'Archive Project'}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="delete" className="space-y-4">
          {user?.role === 'SUPER_ADMIN' && (
            <>
              {pendingDeleteRequests.filter(r => r.projectId === project.id).length > 0 && (
                <div className="p-6 rounded-lg border border-amber-200" style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-amber-50 shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-amber-700">Pending Delete Request</p>
                      {pendingDeleteRequests.filter(r => r.projectId === project.id).map(req => (
                        <div key={req.id} className="mt-2 space-y-2">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Requested by <strong>{req.requestedByName}</strong> on {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => { setConfirmAction('approveDelete'); }} disabled={deleteRequestLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              {deleteRequestLoading ? 'Approving...' : 'Approve & Delete'}
                            </button>
                            <button onClick={() => handleRejectDelete(req.id)} disabled={deleteRequestLoading} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6 rounded-lg border border-red-200" style={{ backgroundColor: 'rgba(239,68,68,0.03)' }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-red-50 shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-red-600">Delete Project</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Permanently delete this project and all associated data. This action cannot be undone.</p>
                    <button
                      onClick={() => setConfirmAction('delete')}
                      disabled={saving}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {saving ? 'Deleting...' : 'Delete Project'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          {user?.role === 'PM' && (
            <div className="p-6 rounded-lg border border-red-200" style={{ backgroundColor: 'rgba(239,68,68,0.03)' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-50 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-red-600">Request Project Deletion</p>
                  {myPendingRequest ? (
                    <div className="mt-2">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Your delete request is <span className="text-amber-600 font-semibold">pending</span> approval from an admin.
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Submitted on {myPendingRequest.createdAt ? new Date(myPendingRequest.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Request admin approval to permanently delete this project. You will be notified once a decision is made.</p>
                      <button
                        onClick={() => setConfirmAction('requestDelete')}
                        disabled={saving}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {saving ? 'Requesting...' : 'Request Deletion'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {archiveModal && (
        <div className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-4" onClick={() => setArchiveModal(false)}>
          <div className="bg-white dark:bg-[#111827] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Archive Project?</h4>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Are you sure you want to archive this project? It will become read-only and can be restored later.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setArchiveModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={handleArchive} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">Archive</button>
            </div>
          </div>
        </div>
      )}

      {confirmAction === 'delete' && (
        <div className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-[#111827] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-red-600 mb-2">Delete Project?</h4>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This action is irreversible. All data including documents, deliverables, and activity logs will be permanently removed.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmAction === 'requestDelete' && (
        <div className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-[#111827] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-amber-600 mb-2">Request Deletion?</h4>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>An admin will review your request. You will be notified once a decision is made.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={handleRequestDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {confirmAction === 'approveDelete' && (
        <div className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-[#111827] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-red-600 mb-2">Approve & Delete?</h4>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This will permanently delete the project. The requester will be notified.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={() => { const req = pendingDeleteRequests.find(r => r.projectId === project.id); if (req) handleApproveDelete(req.id); }} disabled={deleteRequestLoading} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Approve & Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderDeliverables(deliverables, isManager, onAdd) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Deliverables</h4>
        {isManager && (
          <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors">
            <Upload className="w-4 h-4" />
            Add Deliverable
          </button>
        )}
      </div>
      {deliverables.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <ClipboardList className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No deliverables yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {deliverables.map(d => (
            <div key={d.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{d.description}</p>
                  {d.dueDate && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(d.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderTeam(team) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Team Members</h4>
      </div>
      {!team || team.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <Users className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No team members</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {team.map(m => (
            <div key={m.id} className="p-4 rounded-lg border flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  m.role === 'PROJECT_MANAGER' ? 'bg-purple-50 text-purple-700' :
                  m.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700' :
                  m.role === 'REVIEWER' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{m.role?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderActivity(logs) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Activity Log</h4>
      </div>
      {!logs || logs.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <Activity className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--primary)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{log.message || log.action}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {log.userName || log.user} &middot; {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function ReportsTabContent({ project, projectId }) {
  const [generating, setGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setPdfBlob(null);
    try {
      const res = await api.get(`/reports/project/${projectId}/pdf`, { responseType: 'blob' });
      const blob = res.data;
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'Project'}_Report.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handleView = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h4>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              Generating...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
          {error}
        </div>
      )}

      {pdfBlob && (
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: '#F0FDF4' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Report generated successfully!</p>
          <div className="flex gap-2">
            <button onClick={handleView} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View PDF
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>
      )}

      {!pdfBlob && !generating && !error && (
        <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
          <BarChart3 className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Generate a comprehensive project report</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Includes project summary, KPIs, team details, deliverables, documents, risks, and activity timeline</p>
        </div>
      )}
    </div>
  );
}

function renderSettings(project, onUpdate, checkPermission, user) {
  return (
    <ProjectSettings project={project} onUpdate={onUpdate} user={user} />
  );
}
function ProjectWorkspaceDrawer({ open, onClose, project: propProject, projectId: propProjectId }) {
  const projectId = propProjectId || propProject?.id;
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFolder, setFilterFolder] = useState('All');
  const [uploadModal, setUploadModal] = useState(false);
  const [deliverableModal, setDeliverableModal] = useState(false);
  const [deliverableForm, setDeliverableForm] = useState({ title: '', description: '', priority: 'Medium', status: 'Pending', dueDate: '', assignee: '' });
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  const [deliverableError, setDeliverableError] = useState('');
  const [localDocuments, setLocalDocuments] = useState([]);
  const [localDeliverables, setLocalDeliverables] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  const isManager = user?.role === 'PROJECT_MANAGER' || user?.role === 'SUPER_ADMIN';
  const checkPermission = (action) => {
    if (action === 'delete' && user?.role !== 'SUPER_ADMIN') return false;
    return isManager;
  };

  const fetchProject = useCallback(async () => {
    console.log('[ProjectWorkspaceDrawer] fetchProject called, projectId:', projectId);
    if (!projectId) {
      console.log('[ProjectWorkspaceDrawer] No projectId, setting loading=false');
      setLoading(false);
      setError('No project ID provided');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('[ProjectWorkspaceDrawer] Fetching GET /projects/' + projectId);
      const { data } = await api.get(`/projects/${projectId}`);
      console.log('[ProjectWorkspaceDrawer] Response received, data:', data);
      setProject(data);
    } catch (err) {
      console.error('[ProjectWorkspaceDrawer] Failed to load project:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load project');
    } finally {
      console.log('[ProjectWorkspaceDrawer] finally: setting loading=false');
      setLoading(false);
    }
  }, [projectId]);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return;
    try {
      console.log('[ProjectWorkspaceDrawer] Fetching documents for project', projectId);
      const { data } = await api.get(`/projects/${projectId}/documents`);
      console.log('[ProjectWorkspaceDrawer] Documents received:', data?.length || 0);
      setLocalDocuments(data || []);
    } catch (err) {
      console.error('[ProjectWorkspaceDrawer] Failed to load documents:', err);
    }
  }, [projectId]);

  const fetchDeliverables = useCallback(async () => {
    if (!projectId) return;
    try {
      console.log('[ProjectWorkspaceDrawer] Fetching deliverables for project', projectId);
      const { data } = await api.get(`/projects/${projectId}/deliverables`);
      console.log('[ProjectWorkspaceDrawer] Deliverables received:', data?.length || 0);
      setLocalDeliverables(data || []);
    } catch (err) {
      console.error('[ProjectWorkspaceDrawer] Failed to load deliverables:', err);
    }
  }, [projectId]);

  const handleCreateDeliverable = useCallback(async () => {
    console.log('[ProjectWorkspaceDrawer] handleCreateDeliverable called');
    if (!deliverableForm.title.trim()) {
      setDeliverableError('Title is required');
      return;
    }
    setSavingDeliverable(true);
    setDeliverableError('');
    try {
      console.log('[ProjectWorkspaceDrawer] Creating deliverable via POST /project-deliverables');
      await api.post('/project-deliverables', {
        projectId: projectId,
        name: deliverableForm.title.trim(),
        remarks: deliverableForm.description.trim() || null,
        category: deliverableForm.priority,
        status: deliverableForm.status,
        nextDate: deliverableForm.dueDate || null,
        owner: deliverableForm.assignee.trim() || null,
      });
      console.log('[ProjectWorkspaceDrawer] Deliverable created successfully');
      setDeliverableModal(false);
      setDeliverableForm({ title: '', description: '', priority: 'Medium', status: 'Pending', dueDate: '', assignee: '' });
      fetchProject();
      fetchDeliverables();
    } catch (err) {
      console.error('[ProjectWorkspaceDrawer] Failed to create deliverable:', err);
      setDeliverableError(err.response?.data?.message || err.message || 'Failed to create deliverable');
    } finally {
      setSavingDeliverable(false);
    }
  }, [projectId, deliverableForm, fetchProject, fetchDeliverables]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProject();
      fetchDocuments();
      fetchDeliverables();
    }
  }, [open, fetchProject, fetchDocuments, fetchDeliverables]);

  const handleDownload = useCallback(async (docId, filename) => {
    try {
      const { data } = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  const tabContent = (activeTab) => {
    if (!project) return null;
    switch (activeTab) {
      case 'overview':
        return <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</p>
              <div className="mt-1"><StatusBadge status={project.status} /></div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Priority</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.priority || '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Budget</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.budget ? `$${project.budget.toLocaleString()}` : '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Team Size</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.teamSize ?? project.team?.length ?? '—'}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Description</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{project.description || 'No description provided.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Business Unit</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.bu || '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Project Type</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.type || '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Infra Managed By</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.infraManagedBy || '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SPOC</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.spoc || '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Start Date</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>End Date</p>
              <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>;
      case 'documents':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
                  />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                  <option value="">All Types</option>
                  {FILE_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
                <select value={filterFolder} onChange={e => setFilterFolder(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                  {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {isManager && (
                <button onClick={() => setUploadModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors shrink-0">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              )}
            </div>
            {(localDocuments.length === 0) ? (
              <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {(localDocuments || []).filter(d => {
                  const q = searchQuery.toLowerCase();
                  const matchSearch = !q || (d.originalFilename?.toLowerCase().includes(q) || d.folder?.toLowerCase().includes(q));
                  const matchType = !filterType || d.fileType === filterType;
                  const matchFolder = filterFolder === 'All' || d.folder === filterFolder;
                  return matchSearch && matchType && matchFolder;
                }).map(doc => (
                  <div key={doc.id} className="p-3 rounded-lg border flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" style={{ borderColor: 'var(--border-color)' }}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg shrink-0">{FILE_TYPE_ICONS[doc.fileType] || '📄'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.originalFilename}</p>
                        <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {doc.folder && <span>{doc.folder}</span>}
                          {doc.folder && doc.fileType && <span>&middot;</span>}
                          {doc.fileType && <span>{doc.fileType.toUpperCase()}</span>}
                          {doc.fileType && doc.size && <span>&middot;</span>}
                          {doc.size && <span>{formatSize(doc.size)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDownload(doc.id, doc.originalFilename)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Download">
                        <Download className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <IconButton size="small" onClick={() => setPreviewDoc(doc)}>
                        <ChevronRight className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'deliverables':
        return renderDeliverables(localDeliverables, isManager, () => setDeliverableModal(true));
      case 'team':
        return renderTeam(project.team || project.members || []);
      case 'activity':
        return renderActivity(project.activityLog || project.logs || []);
      case 'reports':
        return <ReportsTabContent project={project} projectId={projectId} />;
      case 'settings':
        return renderSettings(project, (updated) => setProject(prev => ({ ...prev, ...updated })), checkPermission, user);
      default:
        return null;
    }
  };

  const drawerTitle = loading ? 'Loading...' : project?.name || 'Project Workspace';
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '66%',
          maxWidth: 1080,
          backgroundColor: 'var(--bg-body)',
          borderLeft: '1px solid var(--border-color)',
          '@media (max-width: 1024px)': { width: '85%' },
          '@media (max-width: 640px)': { width: '100%' },
        },
      }}
    >
      <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-body)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>{drawerTitle}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Project Workspace</p>
            </div>
          </div>
          <IconButton onClick={onClose} size="small" className="shrink-0">
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </IconButton>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 overflow-x-auto shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#1e293b] text-primary border-t border-l border-r'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={isActive ? { borderColor: 'var(--border-color)', marginBottom: '-1px', color: 'var(--primary)' } : {}}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading project...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                onClick={fetchProject}
                className="mt-3 px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                Retry
              </button>
            </div>
          ) : project ? (
            tabContent(activeTab)
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No project data available.</p>
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={handleDownload}
        />
      )}

      <FileUploadModal
        isOpen={uploadModal}
        onClose={() => { setUploadModal(false); fetchDocuments(); }}
        onUploaded={() => {}}
        projectId={projectId}
      />

      <Modal isOpen={deliverableModal} onClose={() => { setDeliverableModal(false); setDeliverableError(''); }} title="Create Deliverable">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={deliverableForm.title}
              onChange={(e) => setDeliverableForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Enter deliverable title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={deliverableForm.description}
              onChange={(e) => setDeliverableForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Brief description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={deliverableForm.priority}
                onChange={(e) => setDeliverableForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={deliverableForm.status}
                onChange={(e) => setDeliverableForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={deliverableForm.dueDate}
                onChange={(e) => setDeliverableForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <input
                type="text"
                value={deliverableForm.assignee}
                onChange={(e) => setDeliverableForm(f => ({ ...f, assignee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Person responsible"
              />
            </div>
          </div>
          {deliverableError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{deliverableError}</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setDeliverableModal(false); setDeliverableError(''); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDeliverable}
              disabled={savingDeliverable || !deliverableForm.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-deep rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingDeliverable && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {savingDeliverable ? 'Creating...' : 'Create Deliverable'}
            </button>
          </div>
        </div>
      </Modal>
    </Drawer>
  );
}

export default ProjectWorkspaceDrawer;
