import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, CheckCircle, Circle, Clock, User, Filter,
  Briefcase, Users, GripVertical, ChevronDown, ChevronRight, Trash2
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../api';
import TaskForm from './TaskForm';

const CATEGORIES = [
  { id: 'work', label: 'Work Todos', icon: Briefcase, color: 'blue' },
  { id: 'people', label: 'People to Reach Out', icon: Users, color: 'purple' },
  { id: 'personal', label: 'Personal Todos', icon: User, color: 'green' },
];

const categoryColors = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
};

export default function TaskList({ showToast }) {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const filters = {};
      if (filter !== 'all' && filter !== 'completed') filters.status = filter;
      if (filter === 'completed') filters.status = 'completed';

      const [tasksData, contactsData] = await Promise.all([
        api.getTasks(filters),
        api.getContacts(),
      ]);
      setTasks(tasksData);
      setContacts(contactsData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data) => {
    try {
      await api.createTask(data);
      showToast('Task created');
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.updateTask(editingTask.id, data);
      showToast('Task updated');
      setEditingTask(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggle = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.updateTask(task.id, { status: newStatus });
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      showToast('Task deleted');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Group tasks by category
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const groupedTasks = {};
  for (const cat of CATEGORIES) {
    groupedTasks[cat.id] = activeTasks.filter(t => t.category === cat.id);
  }

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCat = source.droppableId;
    const destCat = destination.droppableId;
    const taskId = parseInt(draggableId);

    // Clone the grouped tasks
    const newGrouped = {};
    for (const cat of CATEGORIES) {
      newGrouped[cat.id] = [...groupedTasks[cat.id]];
    }

    // Remove from source
    const [movedTask] = newGrouped[sourceCat].splice(source.index, 1);
    movedTask.category = destCat;

    // Insert at destination
    newGrouped[destCat].splice(destination.index, 0, movedTask);

    // Build reorder items for the affected categories
    const items = [];
    const affectedCats = new Set([sourceCat, destCat]);
    for (const cat of affectedCats) {
      newGrouped[cat].forEach((task, index) => {
        items.push({ id: task.id, category: cat, sort_order: index });
      });
    }

    // Optimistic update
    const newTasks = [
      ...Object.values(newGrouped).flat(),
      ...completedTasks,
    ];
    setTasks(newTasks);

    try {
      await api.reorderTasks(items);
    } catch (err) {
      showToast('Failed to reorder', 'error');
      fetchData();
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityClasses = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  const statusClasses = { pending: 'badge-pending', in_progress: 'badge-in-progress', completed: 'badge-completed' };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-gray-400 mt-1">Manage your to-dos and follow-ups</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto py-3 sm:py-2"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter size={14} className="text-gray-500 shrink-0" />
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm sm:text-xs font-medium transition-all whitespace-nowrap ${
              filter === opt.value
                ? 'bg-accent text-white'
                : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No tasks found</p>
          <p className="text-gray-600 text-sm mt-1">Create a task to get started</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-6">
            {CATEGORIES.map(cat => {
              const catTasks = groupedTasks[cat.id] || [];
              const colors = categoryColors[cat.color];
              const Icon = cat.icon;
              const isCollapsed = collapsedGroups[cat.id];

              return (
                <div key={cat.id} className="animate-fade-in">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleGroup(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${colors.bg} border ${colors.border} mb-2 transition-all hover:opacity-90`}
                  >
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <Icon size={16} className={colors.text} />
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({catTasks.length})
                    </span>
                    <span className="ml-auto text-gray-500">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {/* Droppable zone */}
                  {!isCollapsed && (
                    <Droppable droppableId={cat.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-[48px] rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'bg-white/[0.02] ring-1 ring-white/[0.08]' : ''
                          } ${catTasks.length === 0 ? 'flex items-center justify-center' : ''}`}
                        >
                          {catTasks.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-gray-600 text-xs py-3">No tasks — drag one here or create new</p>
                          )}
                          {catTasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={String(task.id)}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`${snapshot.isDragging ? 'z-50' : ''}`}
                                  style={provided.draggableProps.style}
                                >
                                  <TaskRow
                                    task={task}
                                    priorityClasses={priorityClasses}
                                    statusClasses={statusClasses}
                                    onToggle={handleToggle}
                                    onEdit={setEditingTask}
                                    onDelete={handleDelete}
                                    dragHandleProps={provided.dragHandleProps}
                                    isDragging={snapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completed section */}
          {completedTasks.length > 0 && filter !== 'completed' && (
            <div className="mt-8">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-400 transition-colors mb-3"
              >
                {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Completed ({completedTasks.length})
              </button>
              {showCompleted && (
                <div className="space-y-2 opacity-60">
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      priorityClasses={priorityClasses}
                      statusClasses={statusClasses}
                      onToggle={handleToggle}
                      onEdit={setEditingTask}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DragDropContext>
      )}

      <TaskForm
        isOpen={showForm || !!editingTask}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        initialData={editingTask}
        contacts={contacts}
      />
    </div>
  );
}

function TaskRow({ task, priorityClasses, statusClasses, onToggle, onEdit, onDelete, dragHandleProps, isDragging }) {
  return (
    <div className={`card glass-hover group flex items-start gap-2 sm:gap-3 !p-4 sm:!p-4 touch-manipulation ${
      isDragging ? 'ring-2 ring-accent/40 shadow-lg shadow-accent/10' : ''
    }`}>
      {/* Drag handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="mt-0.5 shrink-0 text-gray-600 hover:text-gray-400 transition-colors cursor-grab active:cursor-grabbing p-1 -ml-1 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 text-gray-500 hover:text-accent transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
      >
        {task.status === 'completed'
          ? <CheckCircle size={20} className="text-green-400" />
          : <Circle size={20} />
        }
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1" onClick={() => onEdit(task)} role="button" tabIndex={0}>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge ${priorityClasses[task.priority]} text-[10px]`}>{task.priority}</span>
            <span className={`badge ${statusClasses[task.status]} text-[10px] hidden sm:inline-flex`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {task.due_date && (
            <span className={`flex items-center gap-1 text-xs ${
              isPast(parseISO(task.due_date)) && task.status !== 'completed'
                ? 'text-red-400'
                : isToday(parseISO(task.due_date))
                  ? 'text-yellow-400'
                  : 'text-gray-500'
            }`}>
              <Clock size={12} />
              {isToday(parseISO(task.due_date)) ? 'Today' : format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
          {task.contact_first_name && (
            <Link
              to={`/contacts/${task.contact_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <User size={12} />
              {task.contact_first_name} {task.contact_last_name}
            </Link>
          )}
        </div>
      </div>

      {/* Delete button — always visible on mobile, hover on desktop */}
      <button
        onClick={() => onDelete(task)}
        className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-2 -mr-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
