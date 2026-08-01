import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FileUploadModal from './FileUploadModal';

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

export default function ProjectDetailsModal({ isOpen, onClose, project }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignedPm, setAssignedPm] = useState(null);
  const [, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [versionHistory, setVersionHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isPM = user?.role === 'PM';
  const canUpload = isAdmin || isPM;
  const canDelete = isAdmin;

  const fetchTeam = useCallback(async () => {
    try {
      const [upaRes, paRes, usersRes] = await Promise.all([
        api.get(`/projects/${project.id}/assignments`).catch(() => ({ data: [] })),
        api.get(`/projects/${project.id}/pm-assignments`).catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
      ]);
      const allUsers = usersRes.data;
      const userIds = upaRes.data.map(a => a.userId);
      const pmIds = paRes.data.map(a => a.pmId);
      setTeamMembers(allUsers.filter(u => userIds.includes(u.id)));
      const pmUsers = allUsers.filter(u => pmIds.includes(u.id));
      if (pmUsers.length > 0) setAssignedPm(pmUsers[0]);
    } catch (err) { console.error(err); }
  }, [project]);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      const res = await api.get(`/projects/${project.id}/documents`, { params });
      setDocuments(res.data);
    } catch (err) { console.error(err); }
  }, [project, searchQuery]);

  useEffect(() => {
    if (!isOpen || !project) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([fetchTeam(), fetchDocuments()]).finally(() => setLoading(false));
  }, [isOpen, project, fetchTeam, fetchDocuments]);

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
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Download failed'); }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Archive this file?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchDocuments();
    } catch (err) { console.error(err); alert('Failed to delete'); }
  };

  const handleShowVersions = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/versions`);
      setVersionHistory({ filename: doc.originalFilename, versions: res.data });
    } catch (err) { console.error(err); }
  };

  if (!isOpen || !project) return null;

  const statusBadge = (status) => {
    const map = { ACTIVE: 'bg-ok-bg text-ok', COMPLETED: 'bg-blue-50 text-blue-600', ON_HOLD: 'bg-warn-bg text-warn', CANCELLED: 'bg-gray-100 text-gray-500' };
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>{status?.replace('_', ' ') || 'N/A'}</span>;
  };

  const filteredDocs = searchQuery
    ? documents.filter(d => d.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{project.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Project #{project.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {['overview', 'documents', 'team'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><label className="text-xs text-gray-400 uppercase">Business Unit</label><p className="text-sm font-medium text-gray-900 mt-0.5">{project.bu || '—'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Type</label><p className="text-sm font-medium text-gray-900 mt-0.5">{project.type || '—'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Infra Managed By</label><p className="text-sm font-medium text-gray-900 mt-0.5">{project.infraManagedBy || '—'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">SPOC</label><p className="text-sm font-medium text-gray-900 mt-0.5">{project.spoc || '—'}</p></div>
              </div>
              <div className="space-y-4">
                <div><label className="text-xs text-gray-400 uppercase">Status</label><div className="mt-0.5">{statusBadge(project.status)}</div></div>
                <div><label className="text-xs text-gray-400 uppercase">Progress</label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${project.progress || 0}%` }} /></div>
                    <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                  </div>
                </div>
                <div><label className="text-xs text-gray-400 uppercase">Assigned PM</label><p className="text-sm font-medium text-gray-900 mt-0.5">{assignedPm?.name || '—'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Dates</label><p className="text-sm text-gray-900 mt-0.5">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'} → {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Budget</label><p className="text-sm font-medium text-gray-900 mt-0.5">{project.budget ? `$${project.budget.toLocaleString()}` : '—'}</p></div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 flex-1 max-w-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400" />
                  </div>
                </div>
                {canUpload && (
                  <button onClick={() => setUploadOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Upload
                  </button>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocs.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No documents found</td></tr>
                    ) : filteredDocs.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{typeIcons[d.fileType] || '📄'}</span>
                            <span className="font-medium text-gray-900 truncate max-w-[200px]" title={d.originalFilename}>{d.originalFilename}</span>
                          </div>
                          {d.description && <p className="text-xs text-gray-400 mt-0.5 ml-6">{d.description}</p>}
                        </td>
                        <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 uppercase">{d.fileType}</span></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatSize(d.fileSize)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleShowVersions(d)} className="text-gray-500 hover:text-primary text-xs underline">{`v${d.versionNumber}`}</button>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{d.uploadTimestamp ? new Date(d.uploadTimestamp).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handlePreview(d)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg" title="Preview">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => handleDownload(d.id, d.originalFilename)} className="p-1.5 text-gray-400 hover:text-ok hover:bg-ok-bg rounded-lg" title="Download">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                            {canDelete && (
                              <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-bad hover:bg-bad-bg rounded-lg" title="Archive">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              {assignedPm && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-400 uppercase mb-1">Project Manager</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">{assignedPm.name?.charAt(0)?.toUpperCase() || 'P'}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{assignedPm.name}</p>
                      <p className="text-xs text-gray-400">{assignedPm.email}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2">Team Members ({teamMembers.length})</p>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-gray-400">No team members assigned</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {teamMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{m.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewDoc(null); }}>
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{previewDoc.originalFilename}</h3>
                <button onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewDoc(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[300px]">
                {previewUrl ? (
                  ['png','jpg','jpeg'].includes(previewDoc.fileType) ? (
                    <img src={previewUrl} alt={previewDoc.originalFilename} className="max-w-full max-h-[70vh] object-contain rounded" />
                  ) : previewDoc.fileType === 'pdf' ? (
                    <iframe src={previewUrl} className="w-full h-[70vh] rounded" title="PDF" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="text-lg mb-2">Preview not available</p>
                      <button onClick={() => handleDownload(previewDoc.id, previewDoc.originalFilename)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Download</button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" /></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Version History Modal */}
        {versionHistory && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setVersionHistory(null)}>
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Version History: {versionHistory.filename}</h3>
                <button onClick={() => setVersionHistory(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {versionHistory.versions.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-900">v{v.versionNumber}</span>
                      <span className="text-xs text-gray-400 ml-2">{v.uploadTimestamp ? new Date(v.uploadTimestamp).toLocaleString() : ''}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatSize(v.fileSize)}</span>
                    </div>
                    <button onClick={() => handleDownload(v.id, v.originalFilename)} className="p-1.5 text-gray-400 hover:text-ok rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <FileUploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={fetchDocuments} projectId={project.id} />
      </div>
    </div>
  );
}
