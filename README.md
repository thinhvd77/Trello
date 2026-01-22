# Trello Clone - TaskFlow

A modern Kanban-style project and task management web application.

## Features

- **Multiple Projects** - Create and manage multiple projects
- **Kanban Lists** - Organize tasks in customizable columns
- **Task Cards** - Create, edit, and delete tasks with descriptions
- **Drag & Drop** - Intuitive drag-and-drop task management
- **Modern UI** - Beautiful dark theme with glassmorphism effects
- **Persistent Storage** - SQLite database for data persistence

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Production Deployment (EC2)

1. **Launch an EC2 instance** with Amazon Linux 2023 or Amazon Linux 2

2. **Configure Security Group** to allow:
   - SSH (port 22)
   - HTTP (port 80)
   - HTTPS (port 443, optional)

3. **Connect via SSH** and copy files:
   ```bash
   # From your local machine
   scp -r /path/to/trello ec2-user@YOUR_EC2_IP:/home/ec2-user/
   ```

4. **Run the setup script**:
   ```bash
   # On EC2 instance
   cd /home/ec2-user/trello
   sudo bash deploy/setup-ec2.sh
   ```

5. **Access your app** at `http://YOUR_EC2_PUBLIC_IP`

## Project Structure

```
trello/
├── server.js              # Express server entry point
├── package.json           # Node.js dependencies
├── db/
│   └── database.js        # SQLite database setup
├── routes/
│   ├── projects.js        # Project API endpoints
│   ├── lists.js           # List API endpoints
│   └── tasks.js           # Task API endpoints
├── public/
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Application styles
│   └── js/
│       └── app.js         # Frontend JavaScript
└── deploy/
    ├── setup-ec2.sh       # EC2 setup script
    └── nginx.conf         # Nginx configuration
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Lists
- `GET /api/lists/project/:projectId` - Get lists for a project
- `POST /api/lists` - Create a list
- `PUT /api/lists/:id` - Update a list
- `DELETE /api/lists/:id` - Delete a list

### Tasks
- `GET /api/tasks/list/:listId` - Get tasks for a list
- `POST /api/tasks` - Create a task
- `PUT /api/tasks/:id` - Update a task
- `POST /api/tasks/reorder` - Reorder tasks (for drag-drop)
- `DELETE /api/tasks/:id` - Delete a task

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)
