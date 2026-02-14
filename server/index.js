const express = require('express');
const cors = require('cors');
const path = require('path');
const contactsRouter = require('./routes/contacts');
const tasksRouter = require('./routes/tasks');
const remindersRouter = require('./routes/reminders');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/contacts', contactsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reminders', remindersRouter);

// Dashboard stats endpoint
const db = require('./db');
app.get('/api/stats', (req, res) => {
  try {
    const contacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
    const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'completed'").get();
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get();
    const upcomingReminders = db.prepare(
      "SELECT COUNT(*) as count FROM reminders WHERE is_completed = 0 AND reminder_date >= datetime('now')"
    ).get();
    const overdueReminders = db.prepare(
      "SELECT COUNT(*) as count FROM reminders WHERE is_completed = 0 AND reminder_date < datetime('now')"
    ).get();

    res.json({
      totalContacts: contacts.count,
      pendingTasks: pendingTasks.count,
      completedTasks: completedTasks.count,
      upcomingReminders: upcomingReminders.count,
      overdueReminders: overdueReminders.count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`  CRM Server running at http://localhost:${PORT}`);
  console.log(`  API available at http://localhost:${PORT}/api`);
});
