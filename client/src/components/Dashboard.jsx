import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckSquare, Bell, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { api } from '../api';

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to} className="card glass-hover group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats(),
      api.getContacts(),
      api.getTasks({ status: 'pending' }),
      api.getReminders({ upcoming: 'true' }),
    ]).then(([statsData, contacts, tasks, reminders]) => {
      setStats(statsData);
      setRecentContacts(contacts.slice(0, 5));
      setUpcomingTasks(tasks.slice(0, 5));
      setUpcomingReminders(reminders.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const priorityClasses = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };

  return (
    <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your relationship overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Contacts" value={stats?.totalContacts || 0} color="bg-blue-500/15 text-blue-400" to="/contacts" />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={stats?.pendingTasks || 0} color="bg-purple-500/15 text-purple-400" to="/tasks" />
        <StatCard icon={Bell} label="Reminders" value={stats?.upcomingReminders || 0} color="bg-green-500/15 text-green-400" to="/calendar" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueReminders || 0} color="bg-red-500/15 text-red-400" to="/calendar" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Contacts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Contacts</h2>
            <Link to="/contacts" className="text-accent text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentContacts.map((c) => (
              <Link
                key={c.id}
                to={`/contacts/${c.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{ backgroundColor: c.avatar_color }}
                >
                  {c.first_name[0]}{c.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.company || c.email}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-accent text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{t.title}</p>
                  <span className={`badge ${priorityClasses[t.priority]} shrink-0`}>
                    {t.priority}
                  </span>
                </div>
                {t.due_date && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={12} className="text-gray-500" />
                    <span className={`text-xs ${isPast(parseISO(t.due_date)) ? 'text-red-400' : 'text-gray-500'}`}>
                      {isToday(parseISO(t.due_date)) ? 'Today' : format(parseISO(t.due_date), 'MMM d')}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">No pending tasks</p>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Reminders</h2>
            <Link to="/calendar" className="text-accent text-sm hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map((r) => (
              <div key={r.id} className="p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                <p className="text-sm font-medium">{r.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Bell size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {isToday(parseISO(r.reminder_date)) ? 'Today' : format(parseISO(r.reminder_date), 'MMM d, h:mm a')}
                  </span>
                  {r.contact_first_name && (
                    <span className="text-xs text-gray-600">
                      - {r.contact_first_name} {r.contact_last_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {upcomingReminders.length === 0 && (
              <p className="text-sm text-gray-500 py-4 text-center">No upcoming reminders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
