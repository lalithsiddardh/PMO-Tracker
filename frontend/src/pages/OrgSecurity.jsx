import { useState, useEffect } from 'react';
import api from '../api/axios';

const tabs = [
  { key: 'compliance', label: 'Compliance', endpoint: '/compliance', color: 'text-cyan-600' },
  { key: 'incidents', label: 'Incidents', endpoint: '/incidents', color: 'text-red-600' },
  { key: 'vulnerabilities', label: 'Vulnerabilities', endpoint: '/vulnerabilities', color: 'text-amber-600' },
];

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-green-100 text-green-700',
  INFO: 'bg-blue-100 text-blue-700',
};

const statusColors = {
  OPEN: 'bg-red-50 text-red-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-600',
  RESOLVED: 'bg-green-50 text-green-600',
  CLOSED: 'bg-gray-100 text-gray-500',
  COMPLETED: 'bg-green-50 text-green-600',
  PENDING: 'bg-amber-50 text-amber-600',
  ACTIVE: 'bg-ok-bg text-ok',
};

export default function OrgSecurity() {
  const [activeTab, setActiveTab] = useState('compliance');
  const [compliance, setCompliance] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/compliance').then(r => setCompliance(r.data)).catch(() => {}),
      api.get('/incidents').then(r => setIncidents(r.data)).catch(() => {}),
      api.get('/vulnerabilities').then(r => setVulnerabilities(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentData = {
    compliance,
    incidents,
    vulnerabilities,
  }[activeTab] || [];

  const columns = activeTab === 'compliance'
    ? ['Title', 'Category', 'Status', 'Owner', 'Due Date']
    : ['Title', 'Severity', 'Status', 'Assignee', 'Date'];

  const renderRow = (item) => {
    if (activeTab === 'compliance') {
      return (
        <>
          <td className="px-5 py-3 font-medium text-gray-900">{item.title}</td>
          <td className="px-5 py-3 text-gray-500">{item.category}</td>
          <td className="px-5 py-3">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
          </td>
          <td className="px-5 py-3 text-gray-500">{item.owner || '—'}</td>
          <td className="px-5 py-3 text-gray-500 text-xs">{item.dueDate || '—'}</td>
        </>
      );
    }
    return (
      <>
        <td className="px-5 py-3 font-medium text-gray-900">{item.title}</td>
        <td className="px-5 py-3">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[item.severity] || 'bg-gray-100 text-gray-600'}`}>{item.severity}</span>
        </td>
        <td className="px-5 py-3">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
        </td>
        <td className="px-5 py-3 text-gray-500">{item.assignee || '—'}</td>
        <td className="px-5 py-3 text-gray-500 text-xs">{item.reportedDate || item.dueDate || '—'}</td>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Org Security</h1>
        <p className="text-sm text-gray-500 mt-1">Security compliance, incidents, and vulnerability management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Compliance Items</p>
          <p className="text-2xl font-bold text-cyan-600 mt-1">{compliance.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Incidents</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{incidents.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Vulnerabilities</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{vulnerabilities.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? `${tab.color} border-b-2 border-current`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-60">({currentData.length})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {columns.map(col => <th key={col} className="px-5 py-3">{col}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentData.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400">No {activeTab} found</td></tr>
              ) : (
                currentData.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">{renderRow(item)}</tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
