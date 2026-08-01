import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function PendingRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/pm/pending-requests');
      setRegistrations(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRegistrations(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/pm/approve-request/${id}`);
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id, notes) => {
    try {
      await api.patch(`/pm/reject-request/${id}`, { notes });
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pending Registrations</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve new user registration requests.</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Requested Role</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No pending registrations</td></tr>
              ) : (
                registrations.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegistrationRow({ reg, onApprove, onReject }) {
  const [notes, setNotes] = useState('');

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3 text-gray-900">{reg.email}</td>
      <td className="px-5 py-3 font-medium text-gray-900">{reg.name}</td>
      <td className="px-5 py-3">
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary">
          {reg.role}
        </span>
      </td>
      <td className="px-5 py-3 text-gray-500 text-xs">
        {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-5 py-3">
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-warn-bg text-warn">
          PENDING
        </span>
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="w-36 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={() => onApprove(reg.id, notes)}
            className="px-3 py-1.5 text-xs font-medium text-ok bg-ok-bg hover:bg-green-100 rounded-lg transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(reg.id, notes)}
            className="px-3 py-1.5 text-xs font-medium text-bad bg-bad-bg hover:bg-red-100 rounded-lg transition-colors"
          >
            Reject
          </button>
        </div>
      </td>
    </tr>
  );
}
