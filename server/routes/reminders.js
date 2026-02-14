const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

// GET all reminders
router.get('/', (req, res) => {
  try {
    const { upcoming, month, year, contact_id } = req.query;
    let query = `
      SELECT r.*, c.first_name as contact_first_name, c.last_name as contact_last_name
      FROM reminders r
      LEFT JOIN contacts c ON r.contact_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (upcoming === 'true') {
      conditions.push("r.is_completed = 0 AND r.reminder_date >= datetime('now')");
    }
    if (contact_id) {
      conditions.push('r.contact_id = ?');
      params.push(contact_id);
    }
    if (month && year) {
      conditions.push("strftime('%m', r.reminder_date) = ? AND strftime('%Y', r.reminder_date) = ?");
      params.push(String(month).padStart(2, '0'), String(year));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.reminder_date ASC';

    const reminders = db.prepare(query).all(...params);
    res.json(reminders);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// GET single reminder
router.get('/:id', (req, res) => {
  try {
    const reminder = db.prepare(`
      SELECT r.*, c.first_name as contact_first_name, c.last_name as contact_last_name
      FROM reminders r
      LEFT JOIN contacts c ON r.contact_id = c.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json(reminder);
  } catch (err) {
    console.error('Error fetching reminder:', err);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

// POST create reminder
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('reminder_date').notEmpty().withMessage('Reminder date is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, reminder_date, contact_id, task_id } = req.body;

      const result = db.prepare(`
        INSERT INTO reminders (title, description, reminder_date, contact_id, task_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(title, description || null, reminder_date, contact_id || null, task_id || null);

      const reminder = db.prepare(`
        SELECT r.*, c.first_name as contact_first_name, c.last_name as contact_last_name
        FROM reminders r
        LEFT JOIN contacts c ON r.contact_id = c.id
        WHERE r.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json(reminder);
    } catch (err) {
      console.error('Error creating reminder:', err);
      res.status(500).json({ error: 'Failed to create reminder' });
    }
  }
);

// PUT update reminder
router.put('/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existing = db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      const { title, description, reminder_date, is_completed, contact_id, task_id } = req.body;
      db.prepare(`
        UPDATE reminders
        SET title = COALESCE(?, title),
            description = ?,
            reminder_date = COALESCE(?, reminder_date),
            is_completed = COALESCE(?, is_completed),
            contact_id = ?,
            task_id = ?
        WHERE id = ?
      `).run(
        title || null,
        description !== undefined ? description || null : existing.description,
        reminder_date || null,
        is_completed !== undefined ? (is_completed ? 1 : 0) : null,
        contact_id !== undefined ? contact_id || null : existing.contact_id,
        task_id !== undefined ? task_id || null : existing.task_id,
        req.params.id
      );

      const reminder = db.prepare(`
        SELECT r.*, c.first_name as contact_first_name, c.last_name as contact_last_name
        FROM reminders r
        LEFT JOIN contacts c ON r.contact_id = c.id
        WHERE r.id = ?
      `).get(req.params.id);

      res.json(reminder);
    } catch (err) {
      console.error('Error updating reminder:', err);
      res.status(500).json({ error: 'Failed to update reminder' });
    }
  }
);

// DELETE reminder
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;
