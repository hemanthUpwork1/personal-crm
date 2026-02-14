import { useState, useEffect } from 'react';
import Modal from './Modal';

const emptyForm = {
  title: '',
  description: '',
  reminder_date: '',
  contact_id: '',
};

export default function ReminderForm({ isOpen, onClose, onSubmit, initialData, contacts = [], preselectedDate }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title || '',
          description: initialData.description || '',
          reminder_date: initialData.reminder_date ? initialData.reminder_date.slice(0, 16) : '',
          contact_id: initialData.contact_id || '',
        });
      } else {
        setForm({
          ...emptyForm,
          reminder_date: preselectedDate || '',
        });
      }
    }
  }, [isOpen, initialData, preselectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.reminder_date) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        contact_id: form.contact_id ? parseInt(form.contact_id) : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Reminder' : 'New Reminder'}>
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
            rows={2}
            className="input-field resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Date & Time *</label>
          <input
            type="datetime-local"
            value={form.reminder_date}
            onChange={update('reminder_date')}
            className="input-field"
            required
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
