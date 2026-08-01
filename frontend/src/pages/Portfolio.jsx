import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Portfolio() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portfolio')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalProjects = data.reduce((s, g) => s + g.projectCount, 0);
  const totalActive = data.reduce((s, g) => s + g.activeCount, 0);
  const totalBudget = data.reduce((s, g) => s + (g.totalBudget || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
        <p className="text-sm text-gray-500 mt-1">Project portfolio grouped by business unit.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Projects</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProjects}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-ok mt-1">{totalActive}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${(totalBudget / 1e6).toFixed(1)}M</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <p>No portfolio data found.</p>
          </div>
        ) : (
          data.map(bu => (
            <div key={bu.businessUnit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{bu.businessUnit}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{bu.activeCount} active / {bu.projectCount} total</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${((bu.totalBudget || 0) / 1e6).toFixed(1)}M</p>
                  <p className="text-xs text-gray-400">budget</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Project</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">SPOC</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bu.projects?.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-5 py-3 text-gray-500">{p.type || '—'}</td>
                        <td className="px-5 py-3 text-gray-500">{p.spoc || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.status === 'ACTIVE' ? 'bg-ok-bg text-ok' :
                            p.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-900">${(p.budget || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
