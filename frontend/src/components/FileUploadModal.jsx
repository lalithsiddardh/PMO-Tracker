import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import api from '../api/axios';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip';

const FOLDERS = ['Uncategorized', 'Requirements', 'Architecture', 'Design', 'Development', 'Testing', 'Deployment', 'Misc'];

export default function FileUploadModal({ isOpen, onClose, onUploaded, projectId, folder }) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('Uncategorized');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFolder(folder || 'Uncategorized');
      setDescription('');
      setFiles([]);
      setError('');
    }
  }, [isOpen, folder]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setError('');
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (files.length === 0) { setError('Please select files to upload.'); return; }
    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const desc = folder !== undefined ? selectedFolder : description;
        if (desc) formData.append('description', desc);
        await api.post(`/projects/${projectId}/documents/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setFiles([]);
      setDescription('');
      setSelectedFolder('Uncategorized');
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Documents">
      <div className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
          }`}
        >
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-600 mb-1">Drag and drop files here, or click to browse</p>
          <p className="text-xs text-gray-400">PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT, PNG, JPG, JPEG, ZIP (Max 50MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">{files.length} file(s) selected</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-900 truncate">{f.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{formatSize(f.size)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, j) => j !== i)); }}
                  className="p-1 text-gray-400 hover:text-bad rounded shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {folder !== undefined ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" placeholder="Brief description of the file..." />
          </div>
        )}

        {error && <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleUpload} disabled={uploading || files.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-deep rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {uploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
