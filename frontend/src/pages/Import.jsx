import { useState } from 'react';
import api from '../api/axios';

const sampleCsv = `Name,BU,Type,Infra Managed By,SPOC,Status
Project Alpha,Digital,Development,Infra Team,John Smith,ACTIVE
Project Beta,Infrastructure,Infrastructure,Cloud Team,Jane Doe,ACTIVE
Project Gamma,Analytics,Research,Data Team,Bob Wilson,ON_HOLD`;

export default function Import() {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);

  const handleLoadSample = () => {
    setCsvData(sampleCsv);
    setResult(null);
    setError('');
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError('Please enter CSV data or load the sample.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/import/projects-csv', { csv: csvData });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed. Check your CSV format.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setFileUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/import/projects-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setFileUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Import Projects</h1>
        <p className="text-sm text-gray-500 mt-1">Bulk-import projects from CSV data or file upload.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Upload CSV File</h3>
         <p className="text-xs text-gray-400">Supports .csv and .xlsx files up to 5MB.</p>
        <div className="flex items-center gap-3">
          <label className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
             <span className="text-sm text-gray-500">{file ? file.name : 'Click to select file'}</span>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => { setFile(e.target.files[0]); setResult(null); setError(''); }}
              className="hidden"
            />
          </label>
          <button
            onClick={handleFileUpload}
            disabled={!file || fileUploading}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            {fileUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">CSV Data</h3>
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            Load Sample
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Paste CSV data with columns: Name, BU, Type, Infra Managed By, SPOC, Status
        </p>
        <textarea
          value={csvData}
          onChange={(e) => { setCsvData(e.target.value); setResult(null); setError(''); }}
          rows={10}
          placeholder="Paste your CSV data here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
        />

        {error && (
          <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg bg-ok-bg border border-ok/20 text-ok text-sm">
            <p className="font-semibold">Import completed</p>
            <ul className="mt-2 space-y-1 text-ok/80">
              {result.projectsImported > 0 && <li>• {result.projectsImported} project(s) created</li>}
              {result.deliverablesImported > 0 && <li>• {result.deliverablesImported} deliverable(s) created</li>}
              {result.errors && result.errors.length > 0 && (
                <li className="text-bad">• {result.errors.length} error(s)</li>
              )}
            </ul>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-ok/20 space-y-1">
                {result.errors.map((d, i) => (
                  <p key={i} className="text-xs text-bad">{d}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={loading || !csvData.trim()}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
