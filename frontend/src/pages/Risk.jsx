import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';

const severityConfig = {
  CRITICAL: { label: 'Critical', color: 'bg-bad', textColor: 'text-bad', bgColor: 'bg-bad-bg' },
  HIGH: { label: 'High', color: 'bg-warn', textColor: 'text-warn', bgColor: 'bg-warn-bg' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  LOW: { label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const emptyForm = { title: '', description: '', category: '', impact: 'MEDIUM', probability: 'MEDIUM', status: 'OPEN', owner: '', mitigationPlan: '', dueDate: '' };

export default function Risk() {
  const [risks, setRisks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchRisks = async () => {
    try {
      const res = await api.get('/risks');
      setRisks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRisks(); fetchProjects(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      title: r.title || '',
      description: r.description || '',
      category: r.category || '',
      impact: r.impact || 'MEDIUM',
      probability: r.probability || 'MEDIUM',
      status: r.status || 'OPEN',
      owner: r.owner || '',
      mitigationPlan: r.mitigationPlan || '',
      dueDate: r.dueDate || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, projectId: form.projectId ? Number(form.projectId) : null };
    if (payload.dueDate === '') delete payload.dueDate;
    try {
      if (editing) {
        await api.patch(`/risks/${editing.id}`, payload);
      } else {
        await api.post('/risks', payload);
      }
      setModalOpen(false);
      fetchRisks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save risk');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this risk?')) return;
    try {
      await api.delete(`/risks/${id}`);
      fetchRisks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const severityCounts = {};
  risks.forEach(r => {
    const s = r.impact || 'MEDIUM';
    severityCounts[s] = (severityCounts[s] || 0) + 1;
  });
  const totalRisks = Object.values(severityCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Risk Register</h1>
          <p className="text-sm text-gray-500 mt-1">Identify, assess, and manage project risks.</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Risk
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">{error}</div>}

      {/* Severity cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(severityConfig).map(([key, cfg]) => {
          const count = severityCounts[key] || 0;
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${cfg.textColor}`}>{cfg.label}</span>
                <span className={`text-2xl font-bold ${cfg.textColor}`}>{count}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cfg.color}`} style={{ width: `${(count / totalRisks) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked severity bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Severity Distribution</h3>
        <div className="w-full h-6 rounded-full overflow-hidden flex">
          {Object.entries(severityConfig).map(([key, cfg]) => {
            const count = severityCounts[key] || 0;
            const pct = (count / totalRisks) * 100;
            return pct > 0 ? (
              <div
                key={key}
                className={`${cfg.color} flex items-center justify-center text-[10px] text-white font-medium transition-all duration-500`}
                style={{ width: `${pct}%` }}
              >
                {pct > 8 ? `${Math.round(pct)}%` : ''}
              </div>
            ) : null;
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          {Object.entries(severityConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`}></span>
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Risk register table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Risk Register</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Impact</th>
                <th className="px-5 py-3">Probability</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {risks.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No risks recorded</td></tr>
              ) : (
                risks.map((r) => {
                  const cfg = severityConfig[r.impact] || severityConfig.MEDIUM;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <div className="text-sm">{r.title}</div>
                        {r.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{r.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{r.category || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{r.probability || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'OPEN' ? 'bg-warn-bg text-warn' :
                          r.status === 'MITIGATED' ? 'bg-ok-bg text-ok' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {r.status || 'OPEN'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{r.owner || '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-bad hover:bg-bad-bg rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Risk' : 'Add Risk'}>
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">Select</option>
                <option value="Technical">Technical</option>
                <option value="Operational">Operational</option>
                <option value="Financial">Financial</option>
                <option value="Schedule">Schedule</option>
                <option value="Security">Security</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select value={form.projectId || ''} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
              <select value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
              <select value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="OPEN">Open</option>
                <option value="MITIGATED">Mitigated</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <input type="text" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation Plan</label>
            <textarea value={form.mitigationPlan} onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-deep rounded-lg transition-colors">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
