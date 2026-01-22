const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll, saveDatabase } = require('../db/database');

// Get all projects
router.get('/', (req, res) => {
    try {
        const projects = getAll('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single project
router.get('/:id', (req, res) => {
    try {
        const project = getOne('SELECT * FROM projects WHERE id = ?', [parseInt(req.params.id)]);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create project
router.post('/', (req, res) => {
    try {
        const { name, color = '#6366f1' } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const result = runQuery('INSERT INTO projects (name, color) VALUES (?, ?)', [name, color]);
        const projectId = result.lastInsertRowid;

        // Create default lists for new project
        runQuery('INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)', [projectId, 'To Do', 0]);
        runQuery('INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)', [projectId, 'In Progress', 1]);
        runQuery('INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)', [projectId, 'Done', 2]);

        const project = getOne('SELECT * FROM projects WHERE id = ?', [projectId]);
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update project
router.put('/:id', (req, res) => {
    try {
        const { name, color } = req.body;
        const id = parseInt(req.params.id);

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (color) {
            updates.push('color = ?');
            values.push(color);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        runQuery(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);

        const project = getOne('SELECT * FROM projects WHERE id = ?', [id]);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete project
router.delete('/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const project = getOne('SELECT * FROM projects WHERE id = ?', [id]);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        runQuery('DELETE FROM projects WHERE id = ?', [id]);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
