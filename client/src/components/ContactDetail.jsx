import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Trash2, Mail, Phone, Building2,
  Briefcase, FileText, Plus, Clock, CheckCircle, Circle
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { api } from '../api';
import ContactForm from './ContactForm';
import TaskForm from './TaskForm';
import ReminderForm from './ReminderForm';

export default function ContactDetail({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const data = await api.getContact(id);
      setContact(data);
    } catch (err) {
      showToast('Contact not found', 'error');
      navigate('/contacts');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  const handleUpdate = async (data) => {
    try {
      await api.updateContact(id, data);
      showToast('Contact updated');
      setShowEditForm(false);
      fetchContact();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this contact? This will also remove their reminders.')) return;
    setDeleting(true);
    try {
      await api.deleteContact(id);
      showToast('Contact deleted');
      navigate('/contacts');
    } catch (err) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
  };

  const handleTaskCreate = async (data) => {
    try {
      await api.createTask({ ...data, contact_id: parseInt(id) });
      showToast('Task created');
      setShowTaskForm(false);
      fetchContact();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTaskToggle = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.updateTask(task.id, { status: newStatus });
      fetchContact();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReminderCreate = async (data) => {
    try {
      await api.createReminder({ ...data, contact_id: parseInt(id) });
      showToast('Reminder created');
      setShowReminderForm(false);
      fetchContact();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReminderToggle = async (reminder) => {
    try {
      await api.updateReminder(reminder.id, { is_completed: !reminder.is_completed });
      fetchContact();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) return null;

  const priorityClasses = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

  return (
    <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Back to Contacts
      </button>

      {/* Contact Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ backgroundColor: contact.avatar_color }}
          >
            {contact.first_name[0]}{contact.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {contact.first_name} {contact.last_name}
            </h1>
            {contact.title && <p className="text-gray-400 mt-0.5">{contact.title}</p>}
            <div className="flex flex-wrap gap-4 mt-3">
              {contact.company && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Building2 size={14} /> {contact.company}
                </span>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-sm text-accent hover:underline">
                  <Mail size={14} /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-sm text-accent hover:underline">
                  <Phone size={14} /> {contact.phone}
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:self-start">
            <button onClick={() => setShowEditForm(true)} className="btn-secondary flex items-center gap-2">
              <Edit3 size={14} /> Edit
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {contact.notes && (
          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-400">Notes</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Briefcase size={16} className="text-gray-400" />
              Tasks
            </h2>
            <button onClick={() => setShowTaskForm(true)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {contact.tasks?.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
              >
                <button
                  onClick={() => handleTaskToggle(task)}
                  className="mt-0.5 shrink-0 text-gray-500 hover:text-accent transition-colors"
                >
                  {task.status === 'completed'
                    ? <CheckCircle size={18} className="text-green-400" />
                    : <Circle size={18} />
                  }
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${priorityClasses[task.priority]} text-[10px]`}>{task.priority}</span>
                    {task.due_date && (
                      <span className={`text-xs ${isPast(parseISO(task.due_date)) && task.status !== 'completed' ? 'text-red-400' : 'text-gray-500'}`}>
                        <Clock size={10} className="inline mr-1" />
                        {format(parseISO(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!contact.tasks || contact.tasks.length === 0) && (
              <p className="text-sm text-gray-600 text-center py-6">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Reminders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              Reminders
            </h2>
            <button onClick={() => setShowReminderForm(true)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {contact.reminders?.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <button
                  onClick={() => handleReminderToggle(reminder)}
                  className="mt-0.5 shrink-0 text-gray-500 hover:text-accent transition-colors"
                >
                  {reminder.is_completed
                    ? <CheckCircle size={18} className="text-green-400" />
                    : <Circle size={18} />
                  }
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${reminder.is_completed ? 'line-through text-gray-500' : ''}`}>
                    {reminder.title}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{reminder.description}</p>
                  )}
                  <span className={`text-xs mt-1 block ${
                    isPast(parseISO(reminder.reminder_date)) && !reminder.is_completed ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {format(parseISO(reminder.reminder_date), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            ))}
            {(!contact.reminders || contact.reminders.length === 0) && (
              <p className="text-sm text-gray-600 text-center py-6">No reminders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="mt-6 card">
        <h2 className="font-semibold mb-3">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Created</span>
            <p className="text-gray-300 mt-0.5">{format(parseISO(contact.created_at), 'MMMM d, yyyy')}</p>
          </div>
          <div>
            <span className="text-gray-500">Last Updated</span>
            <p className="text-gray-300 mt-0.5">{format(parseISO(contact.updated_at), 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      <ContactForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdate}
        initialData={contact}
      />
      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleTaskCreate}
      />
      <ReminderForm
        isOpen={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        onSubmit={handleReminderCreate}
      />
    </div>
  );
}
