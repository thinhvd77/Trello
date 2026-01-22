const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../db/database');

// Get all lists for a project
router.get('/project/:projectId', (req, res) => {
    try {
        const lists = getAll(
            'SELECT * FROM lists WHERE project_id = ? ORDER BY position ASC',
            [parseInt(req.params.projectId)]
        );
        res.json(lists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single list with its tasks
router.get('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const list = getOne('SELECT * FROM lists WHERE id = ?', [id]);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        const tasks = getAll(
            'SELECT * FROM tasks WHERE list_id = ? ORDER BY position ASC',
            [id]
        );

        res.json({ ...list, tasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create list
router.post('/', (req, res) => {
    try {
        const { project_id, name } = req.body;

        if (!project_id || !name) {
            return res.status(400).json({ error: 'Project ID and name are required' });
        }

        // Get the max position for the project
        const maxPosResult = getOne(
            'SELECT COALESCE(MAX(position), -1) as maxPos FROM lists WHERE project_id = ?',
            [parseInt(project_id)]
        );
        const position = (maxPosResult?.maxPos ?? -1) + 1;

        const result = runQuery(
            'INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)',
            [parseInt(project_id), name, position]
        );

        const list = getOne('SELECT * FROM lists WHERE id = ?', [result.lastInsertRowid]);
        res.status(201).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update list
router.put('/:id', (req, res) => {
    try {
        const { name, position } = req.body;
        const id = parseInt(req.params.id);

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
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

        runQuery(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`, values);

        const list = getOne('SELECT * FROM lists WHERE id = ?', [id]);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete list
router.delete('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const list = getOne('SELECT * FROM lists WHERE id = ?', [id]);

        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }

        runQuery('DELETE FROM lists WHERE id = ?', [id]);
        res.json({ message: 'List deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
