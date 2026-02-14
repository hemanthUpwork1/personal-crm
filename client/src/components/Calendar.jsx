import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Bell, CheckCircle, Circle,
  Clock, User, Trash2
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, parseISO, isPast
} from 'date-fns';
import { api } from '../api';
import ReminderForm from './ReminderForm';

export default function Calendar({ showToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const [remindersData, tasksData, contactsData] = await Promise.all([
        api.getReminders({ month: String(month), year: String(year) }),
        api.getTasks(),
        api.getContacts(),
      ]);
      setReminders(remindersData);
      setTasks(tasksData.filter(t => t.due_date));
      setContacts(contactsData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateReminder = async (data) => {
    try {
      await api.createReminder(data);
      showToast('Reminder created');
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleReminder = async (reminder) => {
    try {
      await api.updateReminder(reminder.id, { is_completed: !reminder.is_completed });
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteReminder = async (reminder) => {
    if (!window.confirm(`Delete "${reminder.title}"?`)) return;
    try {
      await api.deleteReminder(reminder.id);
      showToast('Reminder deleted');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    const dayReminders = reminders.filter(r => isSameDay(parseISO(r.reminder_date), day));
    const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));
    return { reminders: dayReminders, tasks: dayTasks };
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : null;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-gray-400 mt-1">Track your reminders and deadlines</p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Reminder
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr,380px] gap-6">
        {/* Calendar Grid */}
        <div className="card">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px">
              {days.map((day) => {
                const events = getEventsForDay(day);
                const hasEvents = events.reminders.length > 0 || events.tasks.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative min-h-[72px] sm:min-h-[88px] p-1.5 rounded-xl text-left
                      transition-all duration-200
                      ${isCurrentMonth ? '' : 'opacity-30'}
                      ${isSelected
                        ? 'bg-accent/15 ring-1 ring-accent/40'
                        : 'hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <span className={`
                      inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium
                      ${isToday(day)
                        ? 'bg-accent text-white'
                        : 'text-gray-300'
                      }
                    `}>
                      {format(day, 'd')}
                    </span>

                    {/* Event dots */}
                    {hasEvents && (
                      <div className="mt-0.5 space-y-0.5">
                        {events.reminders.slice(0, 2).map(r => (
                          <div
                            key={`r-${r.id}`}
                            className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate ${
                              r.is_completed
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-blue-500/15 text-blue-400'
                            }`}
                          >
                            {r.title}
                          </div>
                        ))}
                        {events.tasks.slice(0, 1).map(t => (
                          <div
                            key={`t-${t.id}`}
                            className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate bg-purple-500/15 text-purple-400"
                          >
                            {t.title}
                          </div>
                        ))}
                        {(events.reminders.length + events.tasks.length) > 3 && (
                          <div className="text-[9px] text-gray-500 px-1">
                            +{events.reminders.length + events.tasks.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected day panel */}
        <div className="card h-fit lg:sticky lg:top-8">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {isToday(selectedDate)
                    ? 'Today'
                    : format(selectedDate, 'EEEE, MMMM d')
                  }
                </h3>
                <button
                  onClick={() => {
                    setShowForm(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-gray-400 hover:text-accent"
                  title="Add reminder for this day"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Reminders for selected day */}
              {selectedEvents?.reminders.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <Bell size={12} /> REMINDERS
                  </h4>
                  <div className="space-y-2">
                    {selectedEvents.reminders.map(r => (
                      <div
                        key={r.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                      >
                        <button
                          onClick={() => handleToggleReminder(r)}
                          className="mt-0.5 shrink-0"
                        >
                          {r.is_completed
                            ? <CheckCircle size={16} className="text-green-400" />
                            : <Circle size={16} className="text-gray-500 hover:text-accent transition-colors" />
                          }
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${r.is_completed ? 'line-through text-gray-500' : ''}`}>
                            {r.title}
                          </p>
                          {r.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={10} />
                              {format(parseISO(r.reminder_date), 'h:mm a')}
                            </span>
                            {r.contact_first_name && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User size={10} />
                                {r.contact_first_name} {r.contact_last_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(r)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks due on selected day */}
              {selectedEvents?.tasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <Clock size={12} /> TASKS DUE
                  </h4>
                  <div className="space-y-2">
                    {selectedEvents.tasks.map(t => (
                      <div key={t.id} className="p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                        <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge text-[10px] ${
                            t.priority === 'high' ? 'badge-high' : t.priority === 'medium' ? 'badge-medium' : 'badge-low'
                          }`}>
                            {t.priority}
                          </span>
                          {t.contact_first_name && (
                            <span className="text-xs text-gray-500">
                              {t.contact_first_name} {t.contact_last_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedEvents?.reminders.length === 0 && selectedEvents?.tasks.length === 0 && (
                <div className="text-center py-8">
                  <Bell size={24} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">No events this day</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-xs text-accent hover:underline mt-1"
                  >
                    Add a reminder
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Bell size={28} className="mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">Select a day to view events</p>
            </div>
          )}
        </div>
      </div>

      <ReminderForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateReminder}
        contacts={contacts}
        preselectedDate={selectedDate ? format(selectedDate, "yyyy-MM-dd'T'10:00") : ''}
      />
    </div>
  );
}
