import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { api } from '../api';
import ContactForm from './ContactForm';

export default function ContactList({ showToast }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const data = await api.getContacts(search);
      setContacts(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleCreate = async (data) => {
    try {
      await api.createContact(data);
      showToast('Contact created');
      setShowForm(false);
      fetchContacts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-gray-400 mt-1">{contacts.length} people in your network</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-11"
        />
      </div>

      {/* Contact Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No contacts found</p>
          <p className="text-gray-600 text-sm mt-1">
            {search ? 'Try a different search term' : 'Add your first contact to get started'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact, i) => (
            <Link
              key={contact.id}
              to={`/contacts/${contact.id}`}
              className="card glass-hover group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-semibold text-white shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: contact.avatar_color }}
                >
                  {contact.first_name[0]}{contact.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  {contact.title && (
                    <p className="text-sm text-gray-400 truncate">{contact.title}</p>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Building2 size={12} className="text-gray-500 shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{contact.company}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail size={12} className="text-gray-500 shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{contact.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <span className="text-[11px] text-gray-600">
                  Updated {format(parseISO(contact.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ContactForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
