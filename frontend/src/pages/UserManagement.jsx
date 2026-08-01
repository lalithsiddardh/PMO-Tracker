import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const roleColors = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-brand-soft text-brand',
  PM: 'bg-primary/10 text-primary',
  DEVELOPER: 'bg-blue-50 text-blue-600',
  TESTER: 'bg-amber-50 text-amber-600',
  BA: 'bg-cyan-50 text-cyan-600',
  QA: 'bg-green-50 text-green-600',
  DEVOPS: 'bg-gray-100 text-gray-600',
  DESIGNER: 'bg-pink-50 text-pink-600',
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers(); }, []);

  const openAssign = async (user) => {
    setSelectedUser(user);
    setProjectId('');
    setAssignModal(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAssignProject = async () => {
    if (!projectId) return;
    try {
      await api.post('/admin/assign-user-project', { userId: selectedUser.id, projectId: Number(projectId), assignedBy: user.userId });
      setAssignModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign project');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
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
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, roles, and project assignments.</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{u.email}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'ACTIVE' ? 'bg-ok-bg text-ok' :
                        u.status === 'PENDING' ? 'bg-warn-bg text-warn' :
                        u.status === 'REJECTED' ? 'bg-bad-bg text-bad' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openAssign(u)} className="px-3 py-1.5 text-xs font-medium text-brand bg-brand-soft hover:bg-indigo-100 rounded-lg transition-colors">Assign Project</button>
                        {u.id !== user?.userId && (
                          <button onClick={() => setDeleteConfirm(u)} className="px-3 py-1.5 text-xs font-medium text-bad bg-bad-bg hover:bg-red-100 rounded-lg transition-colors">Delete</button>
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

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={`Delete User`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.email})?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => handleDeleteUser(deleteConfirm?.id)} className="px-4 py-2 text-sm font-medium text-white bg-bad hover:bg-red-700 rounded-lg transition-colors">Delete User</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title={`Assign Project to ${selectedUser?.name || 'User'}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Choose a project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleAssignProject} disabled={!projectId} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-deep rounded-lg transition-colors disabled:opacity-50">Assign</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
