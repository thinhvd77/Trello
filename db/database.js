const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'trello.db');
let db;

async function initDatabase() {
    try {
        const SQL = await initSqlJs();

        // Load existing database or create new one
        if (fs.existsSync(dbPath)) {
            const buffer = fs.readFileSync(dbPath);
            db = new SQL.Database(buffer);
        } else {
            db = new SQL.Database();
        }

        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');

        // Create projects table
        db.run(`
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create lists table
        db.run(`
            CREATE TABLE IF NOT EXISTS lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `);

        // Create tasks table
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                list_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
            )
        `);

        // Create a default project if none exists
        const result = db.exec('SELECT COUNT(*) as count FROM projects');
        const count = result.length > 0 ? result[0].values[0][0] : 0;

        if (count === 0) {
            db.run('INSERT INTO projects (name, color) VALUES (?, ?)', ['My First Project', '#6366f1']);
            const projectId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];

            // Create default lists for the project
            db.run('INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)', [projectId, 'To Do', 0]);
            db.run('INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)', [projectId, 'In Progress', 1]);
            db.run('INSERT INTO lists (project_id, name, position) VALUES (?, ?, ?)', [projectId, 'Done', 2]);
        }

        // Save database
        saveDatabase();

        console.log('✅ Database initialized successfully');
    } catch (err) {
        throw err;
    }
}

function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

function getDb() {
    return db;
}

// Helper functions for sql.js compatibility
function runQuery(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
}

function getOne(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

function getAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

module.exports = { initDatabase, getDb, runQuery, getOne, getAll, saveDatabase };
