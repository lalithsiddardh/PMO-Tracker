import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';

const columns = [
  { id: 'TODO', label: 'To Do', color: 'border-t-gray-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-500' },
  { id: 'REVIEW', label: 'Review', color: 'border-t-amber-500' },
  { id: 'DONE', label: 'Done', color: 'border-t-ok' },
];

const severityColors = {
  CRITICAL: 'bg-bad-bg text-bad',
  HIGH: 'bg-warn-bg text-warn',
  MEDIUM: 'bg-blue-50 text-blue-600',
  LOW: 'bg-gray-100 text-gray-500',
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', severity: 'MEDIUM', assignee: '', dueDate: '', status: 'TODO' });
  const [draggedTask, setDraggedTask] = useState(null);
  const dragRef = useRef(null);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/security/tasks');
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTasks(); }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/security/tasks', form);
      setModalOpen(false);
      setForm({ title: '', notes: '', severity: 'MEDIUM', assignee: '', dueDate: '', status: 'TODO' });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDrop = async (columnId) => {
    if (!draggedTask) return;
    try {
      await api.patch(`/security/tasks/${draggedTask.id}`, { ...draggedTask, status: columnId });
      setDraggedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to move task');
    }
  };

  const handleDragStart = (task) => {
    dragRef.current = task;
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Task Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track tasks across your projects.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-deep transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Task
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-bad-bg border border-bad/20 text-bad text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-gray-50 rounded-xl border border-gray-200 border-t-4 ${col.color}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">No tasks</div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        {task.severity && (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${severityColors[task.severity] || 'bg-gray-100 text-gray-500'}`}>
                            {task.severity}
                          </span>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.notes}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          {task.assignee && (
                            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-medium">
                              {task.assignee.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {task.dueDate && (
                            <span className={new Date(task.dueDate) < new Date() ? 'text-bad' : ''}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <input type="text" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-deep rounded-lg transition-colors">Create Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
