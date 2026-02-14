const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

// GET all tasks
router.get('/', (req, res) => {
  try {
    const { status, priority, contact_id, category } = req.query;
    let query = `
      SELECT t.*, c.first_name as contact_first_name, c.last_name as contact_last_name
      FROM tasks t
      LEFT JOIN contacts c ON t.contact_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (contact_id) {
      conditions.push('t.contact_id = ?');
      params.push(contact_id);
    }
    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.category, t.sort_order ASC, CASE t.priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, t.due_date ASC';

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET single task
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, c.first_name as contact_first_name, c.last_name as contact_last_name
      FROM tasks t
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST create task
router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('category').optional().isIn(['work', 'people', 'personal']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, status, priority, category, due_date, contact_id } = req.body;

      // Get max sort_order for the category
      const cat = category || 'personal';
      const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM tasks WHERE category = ?').get(cat);

      const result = db.prepare(`
        INSERT INTO tasks (title, description, status, priority, category, sort_order, due_date, contact_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        title,
        description || null,
        status || 'pending',
        priority || 'medium',
        cat,
        maxOrder.max_order + 1,
        due_date || null,
        contact_id || null
      );

      const task = db.prepare(`
        SELECT t.*, c.first_name as contact_first_name, c.last_name as contact_last_name
        FROM tasks t
        LEFT JOIN contacts c ON t.contact_id = c.id
        WHERE t.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json(task);
    } catch (err) {
      console.error('Error creating task:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// PUT reorder tasks
router.put('/reorder', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const updateStmt = db.prepare('UPDATE tasks SET category = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const updateMany = db.transaction(() => {
      for (const item of items) {
        updateStmt.run(item.category, item.sort_order, item.id);
      }
    });
    updateMany();

    res.json({ message: 'Tasks reordered' });
  } catch (err) {
    console.error('Error reordering tasks:', err);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// PUT update task
router.put('/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('category').optional().isIn(['work', 'people', 'personal']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const { title, description, status, priority, category, due_date, contact_id } = req.body;
      db.prepare(`
        UPDATE tasks
        SET title = COALESCE(?, title),
            description = ?,
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            category = COALESCE(?, category),
            due_date = ?,
            contact_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title || null,
        description !== undefined ? description || null : existing.description,
        status || null,
        priority || null,
        category || null,
        due_date !== undefined ? due_date || null : existing.due_date,
        contact_id !== undefined ? contact_id || null : existing.contact_id,
        req.params.id
      );

      const task = db.prepare(`
        SELECT t.*, c.first_name as contact_first_name, c.last_name as contact_last_name
        FROM tasks t
        LEFT JOIN contacts c ON t.contact_id = c.id
        WHERE t.id = ?
      `).get(req.params.id);

      res.json(task);
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

// DELETE task
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
