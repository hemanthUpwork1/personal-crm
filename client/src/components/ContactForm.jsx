import { useState, useEffect } from 'react';
import Modal from './Modal';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  title: '',
  notes: '',
};

export default function ContactForm({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? {
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        title: initialData.title || '',
        notes: initialData.notes || '',
      } : emptyForm);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Contact' : 'New Contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">First Name *</label>
            <input value={form.first_name} onChange={update('first_name')} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Last Name *</label>
            <input value={form.last_name} onChange={update('last_name')} className="input-field" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={update('email')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone</label>
          <input value={form.phone} onChange={update('phone')} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Company</label>
            <input value={form.company} onChange={update('company')} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
            <input value={form.title} onChange={update('title')} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={update('notes')}
            rows={3}
            className="input-field resize-none"
          />
        </div>
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
