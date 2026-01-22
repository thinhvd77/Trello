// ========================================
// State Management
// ========================================
const state = {
    projects: [],
    currentProject: null,
    lists: [],
    tasks: {},
    editingTask: null,
    editingProject: null,
    editingList: null,
    selectedColor: '#6366f1'
};

// ========================================
// API Functions
// ========================================
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        showLoading();
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API request failed');
            }
            return response.json();
        } finally {
            hideLoading();
        }
    },

    // Projects
    getProjects: () => API.request('/projects'),
    createProject: (data) => API.request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id, data) => API.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id) => API.request(`/projects/${id}`, { method: 'DELETE' }),

    // Lists
    getLists: (projectId) => API.request(`/lists/project/${projectId}`),
    createList: (data) => API.request('/lists', { method: 'POST', body: JSON.stringify(data) }),
    updateList: (id, data) => API.request(`/lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteList: (id) => API.request(`/lists/${id}`, { method: 'DELETE' }),

    // Tasks
    getTasks: (listId) => API.request(`/tasks/list/${listId}`),
    createTask: (data) => API.request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (id, data) => API.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTask: (id) => API.request(`/tasks/${id}`, { method: 'DELETE' }),
    reorderTasks: (tasks) => API.request('/tasks/reorder', { method: 'POST', body: JSON.stringify({ tasks }) })
};

// ========================================
// DOM Elements
// ========================================
const elements = {
    projectList: document.getElementById('projectList'),
    boardTitle: document.getElementById('boardTitle'),
    boardEmpty: document.getElementById('boardEmpty'),
    listsContainer: document.getElementById('listsContainer'),
    addListContainer: document.getElementById('addListContainer'),
    editProjectBtn: document.getElementById('editProjectBtn'),
    deleteProjectBtn: document.getElementById('deleteProjectBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),

    // Modals
    taskModal: document.getElementById('taskModal'),
    projectModal: document.getElementById('projectModal'),
    listModal: document.getElementById('listModal'),

    // Task modal elements
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),

    // Project modal elements
    projectName: document.getElementById('projectName'),
    projectModalTitle: document.getElementById('projectModalTitle'),
    colorPicker: document.getElementById('colorPicker'),
    saveProjectBtn: document.getElementById('saveProjectBtn'),

    // List modal elements
    listName: document.getElementById('listName'),
    listModalTitle: document.getElementById('listModalTitle'),
    saveListBtn: document.getElementById('saveListBtn')
};

// ========================================
// Render Functions
// ========================================
function showLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('active');
    }
}

function renderProjects() {
    elements.projectList.innerHTML = state.projects.map(project => `
        <li class="project-item ${state.currentProject?.id === project.id ? 'active' : ''}" 
            data-id="${project.id}">
            <span class="project-color" style="background: ${project.color}"></span>
            <span class="project-name">${escapeHtml(project.name)}</span>
        </li>
    `).join('');
}

function renderBoard() {
    if (!state.currentProject) {
        elements.boardEmpty.style.display = 'flex';
        elements.listsContainer.style.display = 'none';
        elements.addListContainer.style.display = 'none';
        elements.editProjectBtn.style.display = 'none';
        elements.deleteProjectBtn.style.display = 'none';
        elements.boardTitle.textContent = 'Select a Project';
        return;
    }

    elements.boardEmpty.style.display = 'none';
    elements.listsContainer.style.display = 'flex';
    elements.addListContainer.style.display = 'block';
    elements.editProjectBtn.style.display = 'flex';
    elements.deleteProjectBtn.style.display = 'flex';
    elements.boardTitle.textContent = state.currentProject.name;

    renderLists();
}

function renderLists() {
    elements.listsContainer.innerHTML = state.lists.map(list => `
        <div class="list" data-list-id="${list.id}">
            <div class="list-header">
                <h3 class="list-title">${escapeHtml(list.name)}</h3>
                <div class="list-actions">
                    <button class="btn-icon btn-icon-sm edit-list-btn" data-id="${list.id}" title="Edit List" aria-label="Edit list ${escapeHtml(list.name)}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-icon-sm delete-list-btn" data-id="${list.id}" title="Delete List" aria-label="Delete list ${escapeHtml(list.name)}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="list-content" data-list-id="${list.id}">
                ${renderTasks(list.id)}
            </div>
            <div class="list-footer">
                <button class="add-task-btn" data-list-id="${list.id}" aria-label="Add a card to ${escapeHtml(list.name)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add a card
                </button>
            </div>
        </div>
    `).join('');

    // Setup drag and drop after rendering
    setupDragAndDrop();
}

function renderTasks(listId) {
    const tasks = state.tasks[listId] || [];
    return tasks.map(task => `
        <div class="task-card" draggable="true" data-task-id="${task.id}" data-list-id="${listId}" tabindex="0">
            <div class="task-card-actions">
                <button class="btn-icon btn-icon-sm edit-task-btn" data-id="${task.id}" title="Edit" aria-label="Edit task ${escapeHtml(task.title)}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon btn-icon-sm delete-task-btn" data-id="${task.id}" title="Delete" aria-label="Delete task ${escapeHtml(task.title)}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
            <div class="task-card-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ''}
        </div>
    `).join('');
}

// ========================================
// Drag and Drop
// ========================================
let draggedTask = null;

function setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    const listContents = document.querySelectorAll('.list-content');

    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    listContents.forEach(content => {
        content.addEventListener('dragover', handleDragOver);
        content.addEventListener('drop', handleDrop);
        content.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.list').forEach(list => {
        list.classList.remove('dragging-over');
    });
    draggedTask = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const listContent = e.currentTarget;
    const list = listContent.closest('.list');
    list.classList.add('dragging-over');

    const afterElement = getDragAfterElement(listContent, e.clientY);

    if (draggedTask) {
        if (afterElement == null) {
            listContent.appendChild(draggedTask);
        } else {
            listContent.insertBefore(draggedTask, afterElement);
        }
    }
}

function handleDrop(e) {
    e.preventDefault();

    const listContent = e.currentTarget;
    const list = listContent.closest('.list');
    list.classList.remove('dragging-over');

    const newListId = parseInt(listContent.dataset.listId);
    const taskId = parseInt(draggedTask.dataset.taskId);

    // Update task positions for the new list
    const tasksInList = Array.from(listContent.querySelectorAll('.task-card'));
    const updates = tasksInList.map((card, index) => ({
        id: parseInt(card.dataset.taskId),
        list_id: newListId,
        position: index
    }));

    // Save to backend
    API.reorderTasks(updates).then(() => {
        // Update local state
        loadListsAndTasks(state.currentProject.id);
    }).catch(err => {
        console.error('Failed to reorder tasks:', err);
        loadListsAndTasks(state.currentProject.id);
    });
}

function handleDragLeave(e) {
    const list = e.currentTarget.closest('.list');
    if (!e.currentTarget.contains(e.relatedTarget)) {
        list.classList.remove('dragging-over');
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ========================================
// Modal Functions
// ========================================
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function openTaskModal(task = null, listId = null) {
    state.editingTask = task;
    elements.taskTitle.value = task?.title || '';
    elements.taskDescription.value = task?.description || '';

    if (task) {
        document.getElementById('modalTitle').textContent = 'Edit Task';
        state.editingTask.list_id = listId;
    } else {
        document.getElementById('modalTitle').textContent = 'New Task';
        state.editingTask = { list_id: listId };
    }

    openModal(elements.taskModal);
    elements.taskTitle.focus();
}

function openProjectModal(project = null) {
    state.editingProject = project;
    elements.projectName.value = project?.name || '';
    state.selectedColor = project?.color || '#6366f1';

    // Update color picker selection
    elements.colorPicker.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === state.selectedColor);
    });

    if (project) {
        elements.projectModalTitle.textContent = 'Edit Project';
        elements.saveProjectBtn.textContent = 'Save Changes';
    } else {
        elements.projectModalTitle.textContent = 'New Project';
        elements.saveProjectBtn.textContent = 'Create Project';
    }

    openModal(elements.projectModal);
    elements.projectName.focus();
}

function openListModal(list = null) {
    state.editingList = list;
    elements.listName.value = list?.name || '';

    if (list) {
        elements.listModalTitle.textContent = 'Edit List';
        elements.saveListBtn.textContent = 'Save Changes';
    } else {
        elements.listModalTitle.textContent = 'New List';
        elements.saveListBtn.textContent = 'Create List';
    }

    openModal(elements.listModal);
    elements.listName.focus();
}

// ========================================
// Data Loading
// ========================================
async function loadProjects() {
    try {
        state.projects = await API.getProjects();
        renderProjects();

        // Select first project if none selected
        if (state.projects.length > 0 && !state.currentProject) {
            selectProject(state.projects[0]);
        } else if (state.projects.length === 0) {
            state.currentProject = null;
            renderBoard();
        }
    } catch (err) {
        console.error('Failed to load projects:', err);
    }
}

async function selectProject(project) {
    state.currentProject = project;
    renderProjects();
    await loadListsAndTasks(project.id);
    renderBoard();
}

async function loadListsAndTasks(projectId) {
    try {
        state.lists = await API.getLists(projectId);
        state.tasks = {};

        // Load tasks for each list
        await Promise.all(state.lists.map(async (list) => {
            state.tasks[list.id] = await API.getTasks(list.id);
        }));
    } catch (err) {
        console.error('Failed to load lists and tasks:', err);
    }
}

// ========================================
// Event Handlers
// ========================================

// Project list click
elements.projectList.addEventListener('click', (e) => {
    const projectItem = e.target.closest('.project-item');
    if (projectItem) {
        const projectId = parseInt(projectItem.dataset.id);
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
            selectProject(project);
        }
    }
});

// Add project button
document.getElementById('addProjectBtn').addEventListener('click', () => {
    openProjectModal();
});

// Edit project button
elements.editProjectBtn.addEventListener('click', () => {
    if (state.currentProject) {
        openProjectModal(state.currentProject);
    }
});

// Delete project button
elements.deleteProjectBtn.addEventListener('click', async () => {
    if (state.currentProject && confirm('Are you sure you want to delete this project?')) {
        try {
            await API.deleteProject(state.currentProject.id);
            state.currentProject = null;
            await loadProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    }
});

// Add list button
document.getElementById('addListBtn').addEventListener('click', () => {
    openListModal();
});

// Board actions (delegation)
elements.listsContainer.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    // Add task
    if (target.classList.contains('add-task-btn')) {
        const listId = parseInt(target.dataset.listId);
        openTaskModal(null, listId);
    }

    // Edit task
    if (target.classList.contains('edit-task-btn')) {
        const taskId = parseInt(target.dataset.id);
        const card = target.closest('.task-card');
        const listId = parseInt(card.dataset.listId);
        const task = state.tasks[listId]?.find(t => t.id === taskId);
        if (task) {
            openTaskModal(task, listId);
        }
    }

    // Delete task
    if (target.classList.contains('delete-task-btn')) {
        const taskId = parseInt(target.dataset.id);
        if (confirm('Delete this task?')) {
            try {
                await API.deleteTask(taskId);
                await loadListsAndTasks(state.currentProject.id);
                renderBoard();
            } catch (err) {
                console.error('Failed to delete task:', err);
            }
        }
    }

    // Edit list
    if (target.classList.contains('edit-list-btn')) {
        const listId = parseInt(target.dataset.id);
        const list = state.lists.find(l => l.id === listId);
        if (list) {
            openListModal(list);
        }
    }

    // Delete list
    if (target.classList.contains('delete-list-btn')) {
        const listId = parseInt(target.dataset.id);
        if (confirm('Delete this list and all its tasks?')) {
            try {
                await API.deleteList(listId);
                await loadListsAndTasks(state.currentProject.id);
                renderBoard();
            } catch (err) {
                console.error('Failed to delete list:', err);
            }
        }
    }
});

// Task modal actions
document.getElementById('closeModal').addEventListener('click', () => closeModal(elements.taskModal));
document.getElementById('cancelTaskBtn').addEventListener('click', () => closeModal(elements.taskModal));
document.getElementById('saveTaskBtn').addEventListener('click', async () => {
    const title = elements.taskTitle.value.trim();
    if (!title) return;

    try {
        if (state.editingTask?.id) {
            await API.updateTask(state.editingTask.id, {
                title,
                description: elements.taskDescription.value.trim()
            });
        } else {
            await API.createTask({
                list_id: state.editingTask.list_id,
                title,
                description: elements.taskDescription.value.trim()
            });
        }

        closeModal(elements.taskModal);
        await loadListsAndTasks(state.currentProject.id);
        renderBoard();
    } catch (err) {
        console.error('Failed to save task:', err);
    }
});

// Project modal actions
document.getElementById('closeProjectModal').addEventListener('click', () => closeModal(elements.projectModal));
document.getElementById('cancelProjectBtn').addEventListener('click', () => closeModal(elements.projectModal));
elements.saveProjectBtn.addEventListener('click', async () => {
    const name = elements.projectName.value.trim();
    if (!name) return;

    try {
        if (state.editingProject?.id) {
            const updated = await API.updateProject(state.editingProject.id, {
                name,
                color: state.selectedColor
            });
            state.currentProject = updated;
        } else {
            const created = await API.createProject({
                name,
                color: state.selectedColor
            });
            state.currentProject = created;
        }

        closeModal(elements.projectModal);
        await loadProjects();
        if (state.currentProject) {
            await loadListsAndTasks(state.currentProject.id);
            renderBoard();
        }
    } catch (err) {
        console.error('Failed to save project:', err);
    }
});

// Color picker
elements.colorPicker.addEventListener('click', (e) => {
    const colorBtn = e.target.closest('.color-option');
    if (colorBtn) {
        state.selectedColor = colorBtn.dataset.color;
        elements.colorPicker.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('selected', btn === colorBtn);
        });
    }
});

// List modal actions
document.getElementById('closeListModal').addEventListener('click', () => closeModal(elements.listModal));
document.getElementById('cancelListBtn').addEventListener('click', () => closeModal(elements.listModal));
elements.saveListBtn.addEventListener('click', async () => {
    const name = elements.listName.value.trim();
    if (!name) return;

    try {
        if (state.editingList?.id) {
            await API.updateList(state.editingList.id, { name });
        } else {
            await API.createList({
                project_id: state.currentProject.id,
                name
            });
        }

        closeModal(elements.listModal);
        await loadListsAndTasks(state.currentProject.id);
        renderBoard();
    } catch (err) {
        console.error('Failed to save list:', err);
    }
});

// Close modals on overlay click
[elements.taskModal, elements.projectModal, elements.listModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal(elements.taskModal);
        closeModal(elements.projectModal);
        closeModal(elements.listModal);
    }
});

// ========================================
// Utility Functions
// ========================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});
