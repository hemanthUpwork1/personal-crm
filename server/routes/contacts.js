const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

// GET all contacts
router.get('/', (req, res) => {
  try {
    const { search, sort = 'updated_at', order = 'DESC' } = req.query;
    const allowedSorts = ['first_name', 'last_name', 'company', 'created_at', 'updated_at'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'updated_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT * FROM contacts';
    const params = [];

    if (search) {
      query += ` WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY ${sortCol} ${sortOrder}`;
    const contacts = db.prepare(query).all(...params);
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET single contact with related tasks and reminders
router.get('/:id', (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE contact_id = ? ORDER BY due_date ASC'
    ).all(req.params.id);

    const reminders = db.prepare(
      'SELECT * FROM reminders WHERE contact_id = ? ORDER BY reminder_date ASC'
    ).all(req.params.id);

    res.json({ ...contact, tasks, reminders });
  } catch (err) {
    console.error('Error fetching contact:', err);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// POST create contact
router.post('/',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { first_name, last_name, email, phone, company, title, notes } = req.body;
      const colors = ['#0071e3', '#bf5af2', '#ff375f', '#ff9f0a', '#30d158', '#64d2ff', '#5e5ce6'];
      const avatar_color = colors[Math.floor(Math.random() * colors.length)];

      const result = db.prepare(`
        INSERT INTO contacts (first_name, last_name, email, phone, company, title, notes, avatar_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(first_name, last_name, email || null, phone || null, company || null, title || null, notes || null, avatar_color);

      const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(contact);
    } catch (err) {
      console.error('Error creating contact:', err);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }
);

// PUT update contact
router.put('/:id',
  [
    body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const { first_name, last_name, email, phone, company, title, notes } = req.body;
      db.prepare(`
        UPDATE contacts
        SET first_name = COALESCE(?, first_name),
            last_name = COALESCE(?, last_name),
            email = ?,
            phone = ?,
            company = ?,
            title = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        first_name || null, last_name || null,
        email !== undefined ? email || null : existing.email,
        phone !== undefined ? phone || null : existing.phone,
        company !== undefined ? company || null : existing.company,
        title !== undefined ? title || null : existing.title,
        notes !== undefined ? notes || null : existing.notes,
        req.params.id
      );

      const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
      res.json(contact);
    } catch (err) {
      console.error('Error updating contact:', err);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }
);

// DELETE contact
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
