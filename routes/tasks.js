const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll, saveDatabase } = require('../db/database');

// Get all tasks for a list
router.get('/list/:listId', (req, res) => {
    try {
        const tasks = getAll(
            'SELECT * FROM tasks WHERE list_id = ? ORDER BY position ASC',
            [parseInt(req.params.listId)]
        );
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single task
router.get('/:id', (req, res) => {
    try {
        const task = getOne('SELECT * FROM tasks WHERE id = ?', [parseInt(req.params.id)]);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create task
router.post('/', (req, res) => {
    try {
        const { list_id, title, description = '' } = req.body;

        if (!list_id || !title) {
            return res.status(400).json({ error: 'List ID and title are required' });
        }

        // Get the max position for the list
        const maxPosResult = getOne(
            'SELECT COALESCE(MAX(position), -1) as maxPos FROM tasks WHERE list_id = ?',
            [parseInt(list_id)]
        );
        const position = (maxPosResult?.maxPos ?? -1) + 1;

        const result = runQuery(
            'INSERT INTO tasks (list_id, title, description, position) VALUES (?, ?, ?, ?)',
            [parseInt(list_id), title, description, position]
        );

        const task = getOne('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update task (including move to different list)
router.put('/:id', (req, res) => {
    try {
        const { title, description, list_id, position } = req.body;
        const id = parseInt(req.params.id);

        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (list_id !== undefined) {
            updates.push('list_id = ?');
            values.push(parseInt(list_id));
        }
        if (position !== undefined) {
            updates.push('position = ?');
            values.push(position);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        runQuery(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);

        const task = getOne('SELECT * FROM tasks WHERE id = ?', [id]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reorder tasks (batch update positions)
router.post('/reorder', (req, res) => {
    try {
        const { tasks } = req.body; // Array of { id, list_id, position }

        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks array is required' });
        }

        for (const task of tasks) {
            runQuery(
                'UPDATE tasks SET list_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [parseInt(task.list_id), task.position, parseInt(task.id)]
            );
        }

        res.json({ message: 'Tasks reordered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete task
router.delete('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const task = getOne('SELECT * FROM tasks WHERE id = ?', [id]);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        runQuery('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
