const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/database');

// Import routes
const projectsRouter = require('./routes/projects');
const listsRouter = require('./routes/lists');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/lists', listsRouter);
app.use('/api/tasks', tasksRouter);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Trello Clone server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
