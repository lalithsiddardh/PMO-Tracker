import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FileUploadModal from '../components/FileUploadModal';

const ROLE_PM = 'PM';

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

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [versionHistory, setVersionHistory] = useState(null);
  const [changePmOpen, setChangePmOpen] = useState(false);
  const [pmList, setPmList] = useState([]);
  const [selectedPmId, setSelectedPmId] = useState('');
  const [changingPm, setChangingPm] = useState(false);
  const [pmSuccess, setPmSuccess] = useState('');
  const [currentPmName, setCurrentPmName] = useState('');
  const [confirmPmChange, setConfirmPmChange] = useState(false);
  const [selectedPmName, setSelectedPmName] = useState('');
  const [pmSearchQuery, setPmSearchQuery] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    fileType: '',
    uploadedBy: '',
    dateFrom: '',
    dateTo: '',
  });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isPM = user?.role === 'PM';
  const canUpload = isAdmin || isPM;

  const fetchProject = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      const found = res.data.find(p => p.id === Number(id));
      setProject(found);
    } catch (err) { console.error(err); }
  }, [id]);

  const fetchPms = useCallback(async () => {
    try {
      const res = await api.get('/users');
      const pms = res.data.filter(u => u.role === ROLE_PM && u.status === 'ACTIVE');
      setPmList(pms);
      const paRes = await api.get(`/projects/${id}/pm-assignments`).catch(() => ({ data: [] }));
      if (paRes.data.length > 0) {
        const currentPmId = paRes.data[0].pmId;
        const pm = pms.find(u => u.id === currentPmId);
        setCurrentPmName(pm ? pm.name : 'ID: ' + currentPmId);
        setSelectedPmId(String(currentPmId));
        setSelectedPmName(pm ? pm.name : '');
        setPmSearchQuery(pm ? pm.name : '');
      } else {
        setCurrentPmName('Not assigned');
        setSelectedPmId('');
        setSelectedPmName('');
        setPmSearchQuery('');
      }
    } catch (err) { console.error(err); }
  }, [id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (changePmOpen) { setError(''); fetchPms(); } }, [changePmOpen, fetchPms]);

  const handleChangePm = async () => {
    if (!selectedPmId) return;
    setChangingPm(true);
    setPmSuccess('');
    setError('');
    try {
      await api.put(`/projects/${id}/change-pm`, { pmId: Number(selectedPmId) });
      setPmSuccess('PM changed successfully');
      setCurrentPmName(selectedPmName);
      setChangePmOpen(false);
      setPmSearchQuery('');
      setConfirmPmChange(false);
      setTimeout(() => setPmSuccess(''), 3000);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change PM');
      setConfirmPmChange(false);
    }
    setChangingPm(false);
  };

  const fetchDocuments = useCallback(async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.fileType) params.fileType = filters.fileType;
      if (filters.uploadedBy) params.uploadedBy = filters.uploadedBy;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const res = await api.get(`/projects/${id}/documents`, { params });
      setDocuments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [id, filters]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProject(); fetchDocuments(); }, [fetchProject, fetchDocuments]);

  const handlePreview = async (doc) => {
    setPreviewDoc(doc);
    try {
      const res = await api.get(`/documents/${doc.id}/preview`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview failed:', err);
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Archive this file?')) return;
    try {
      await api.delete(`/documents/${fileId}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleUploadComplete = () => {
    fetchDocuments();
  };

  const handleShowVersions = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/versions`);
      setVersionHistory({ filename: doc.originalFilename, versions: res.data });
    } catch (err) { console.error(err); }
  };

  const clearFilters = () => {
    setFilters({ search: '', fileType: '', uploadedBy: '', dateFrom: '', dateTo: '' });
  };

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusBadge = (status) => {
    const map = {
      ACTIVE: 'bg-ok-bg text-ok',
      COMPLETED: 'bg-blue-50 text-blue-600',
      ON_HOLD: 'bg-warn-bg text-warn',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>
        {status?.replace('_', ' ') || 'N/A'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
        <Link to="/projects" className="hover:text-primary transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{project?.name || 'Project'}</span>
      </div>

      {project && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {project.bu && <span>BU: {project.bu}</span>}
                {project.type && <span>Type: {project.type}</span>}
                {project.spoc && <span>SPOC: {project.spoc}</span>}
                <span>PM: {currentPmName || 'Loading...'}</span>
                {project.status && statusBadge(project.status)}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Progress: {project.progress || 0}%</span>
              <span>Team: {project.teamSize || '—'}</span>
              {project.budget && <span>Budget: ${project.budget?.toLocaleString()}</span>}
              {user?.role === 'SUPER_ADMIN' && (
                <button onClick={() => setChangePmOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-deep transition-colors">
                  Change PM
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {changePmOpen && !confirmPmChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setChangePmOpen(false); setPmSearchQuery(''); }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Change Project Manager</h4>
            {currentPmName && (
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Current PM: <strong style={{ color: 'var(--text-primary)' }}>{currentPmName}</strong>
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Select New PM</label>
                <div className="relative">
                  <input
                    type="text"
                    value={pmSearchQuery}
                    onChange={e => { setPmSearchQuery(e.target.value); setSelectedPmId(''); setSelectedPmName(''); }}
                    placeholder="Search PM by name or email..."
                    className="w-full px-3 py-2 rounded-lg border text-sm mb-1"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
                    autoFocus
                  />
                  <div className="max-h-48 overflow-y-auto border rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                    {pmList
                      .filter(pm => {
                        if (!pmSearchQuery) return true;
                        const q = pmSearchQuery.toLowerCase();
                        return pm.name.toLowerCase().includes(q) || pm.email.toLowerCase().includes(q);
                      })
                      .map(pm => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => { setSelectedPmId(String(pm.id)); setSelectedPmName(pm.name); setPmSearchQuery(pm.name); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                          style={{
                            color: 'var(--text-primary)',
                            backgroundColor: selectedPmId === String(pm.id) ? 'var(--primary-light, #EEF2FF)' : 'transparent',
                          }}
                        >
                          <span className="font-medium">{pm.name}</span>
                          <span className="text-gray-400 ml-2">({pm.email})</span>
                        </button>
                      ))}
                    {pmList.filter(pm => {
                      if (!pmSearchQuery) return true;
                      const q = pmSearchQuery.toLowerCase();
                      return pm.name.toLowerCase().includes(q) || pm.email.toLowerCase().includes(q);
                    }).length === 0 && (
                      <p className="px-3 py-4 text-sm text-gray-400 text-center">No PMs found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setChangePmOpen(false); setPmSearchQuery(''); }} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
              <button
                onClick={() => {
                  if (!selectedPmId) return;
                  if (selectedPmName === currentPmName) {
                    setError('This PM is already assigned to the project');
                    return;
                  }
                  setConfirmPmChange(true);
                }}
                disabled={!selectedPmId}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-deep disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmPmChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setConfirmPmChange(false); setPmSearchQuery(''); }}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Confirm Change</h4>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Previous PM</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentPmName}</span>
                </div>
                <div className="flex items-center justify-center my-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>New PM</span>
                  <span className="font-semibold" style={{ color: 'var(--primary)' }}>{selectedPmName}</span>
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Are you sure you want to change the Project Manager? This action will be recorded in the audit history.</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setConfirmPmChange(false); }} className="px-4 py-2 text-sm font-medium rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={() => { setConfirmPmChange(false); handleChangePm(); }} disabled={changingPm} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-deep disabled:opacity-50">
                {changingPm ? 'Changing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pmSuccess && (
        <div className="p-3 rounded-lg bg-ok-bg border border-ok/20 text-ok text-sm">{pmSuccess}</div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        {canUpload && (
          <button onClick={() => setUploadOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Upload
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search files..." value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400" />
          </div>
          <select value={filters.fileType} onChange={(e) => setFilters(f => ({ ...f, fileType: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
            <option value="">All Types</option>
            {FILE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" title="From date" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" title="To date" />
          {(filters.search || filters.fileType || filters.dateFrom || filters.dateTo) && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm text-gray-500 hover:text-bad hover:bg-bad-bg rounded-lg transition-colors">Clear</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Uploaded By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No documents found</td></tr>
              ) : (
                documents.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span>{typeIcons[d.fileType] || '📄'}</span>
                        <span className="font-medium text-gray-900 truncate max-w-[250px]" title={d.originalFilename}>{d.originalFilename}</span>
                      </div>
                      {d.description && <p className="text-xs text-gray-400 mt-0.5 ml-6">{d.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 uppercase">{d.fileType}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatSize(d.fileSize)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleShowVersions(d)} className="text-gray-500 hover:text-primary text-xs underline">{`v${d.versionNumber}`}</button>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">ID: {d.uploadedBy}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{d.uploadTimestamp ? new Date(d.uploadTimestamp).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        d.status === 'ACTIVE' ? 'bg-ok-bg text-ok' : 'bg-gray-100 text-gray-500'
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handlePreview(d)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Preview">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleDownload(d.id, d.originalFilename)} className="p-1.5 text-gray-400 hover:text-ok hover:bg-ok-bg rounded-lg transition-colors" title="Download">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        {canUpload && (
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-bad hover:bg-bad-bg rounded-lg transition-colors" title="Archive">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewDoc(null); }}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{previewDoc.originalFilename}</h3>
              <button onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewDoc(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[300px]">
              {['png','jpg','jpeg'].includes(previewDoc.fileType) ? (
                <img src={previewUrl} alt={previewDoc.originalFilename} className="max-w-full max-h-[70vh] object-contain rounded" />
              ) : previewDoc.fileType === 'pdf' ? (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded" title="PDF Preview" />
              ) : (
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">Preview not available</p>
                  <button onClick={() => handleDownload(previewDoc.id, previewDoc.originalFilename)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Download</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {versionHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setVersionHistory(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Version History: {versionHistory.filename}</h3>
              <button onClick={() => setVersionHistory(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {versionHistory.versions.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">v{v.versionNumber}</span>
                    <span className="text-xs text-gray-400 ml-2">{v.uploadTimestamp ? new Date(v.uploadTimestamp).toLocaleString() : ''}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatSize(v.fileSize)}</span>
                  </div>
                  <button onClick={() => handleDownload(v.id, v.originalFilename)} className="p-1.5 text-gray-400 hover:text-ok rounded-lg" title="Download">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <FileUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploadComplete}
        projectId={Number(id)}
      />
    </div>
  );
}
