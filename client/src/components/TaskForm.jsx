import { useState, useEffect } from 'react';
import { Briefcase, Users, User } from 'lucide-react';
import Modal from './Modal';

const emptyForm = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  category: 'personal',
  due_date: '',
  contact_id: '',
};

const categories = [
  { value: 'work', label: 'Work', icon: Briefcase, color: 'blue' },
  { value: 'people', label: 'People', icon: Users, color: 'purple' },
  { value: 'personal', label: 'Personal', icon: User, color: 'green' },
];

export default function TaskForm({ isOpen, onClose, onSubmit, initialData, contacts = [] }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'pending',
        priority: initialData.priority || 'medium',
        category: initialData.category || 'personal',
        due_date: initialData.due_date ? initialData.due_date.slice(0, 16) : '',
        contact_id: initialData.contact_id || '',
      } : emptyForm);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        contact_id: form.contact_id ? parseInt(form.contact_id) : null,
        due_date: form.due_date || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const colorMap = {
    blue: { active: 'bg-blue-500/20 border-blue-500/50 text-blue-400', inactive: 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]' },
    purple: { active: 'bg-purple-500/20 border-purple-500/50 text-purple-400', inactive: 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]' },
    green: { active: 'bg-green-500/20 border-green-500/50 text-green-400', inactive: 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]' },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Title *</label>
          <input value={form.title} onChange={update('title')} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={update('description')}
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* Category selector */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = form.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isActive ? colorMap[cat.color].active : colorMap[cat.color].inactive
                  }`}
                >
                  <Icon size={15} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Priority</label>
            <select value={form.priority} onChange={update('priority')} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
            <select value={form.status} onChange={update('status')} className="input-field">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Due Date</label>
          <input
            type="datetime-local"
            value={form.due_date}
            onChange={update('due_date')}
            className="input-field"
          />
        </div>
        {contacts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Contact</label>
            <select value={form.contact_id} onChange={update('contact_id')} className="input-field">
              <option value="">No contact</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
