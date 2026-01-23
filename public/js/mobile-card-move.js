/**
 * Mobile Card Move Module
 * Allows users to move cards between lists on mobile devices
 * via a "Move To" menu instead of drag-and-drop
 */

(function (global) {
    'use strict';

    // Module state
    let movingTask = null;
    let initialized = false;

    // Icon templates based on list name
    const getListIconHtml = (listName) => {
        const name = listName.toLowerCase().trim();

        if (name.includes('to do') || name.includes('todo') || name.includes('backlog')) {
            return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="list-icon list-icon-todo">
                <circle cx="12" cy="12" r="10"/>
            </svg>`;
        }

        if (name.includes('progress') || name.includes('doing') || name.includes('working')) {
            return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="list-icon list-icon-progress">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
            </svg>`;
        }

        if (name.includes('done') || name.includes('complete') || name.includes('finished')) {
            return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="list-icon list-icon-done">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
            </svg>`;
        }

        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="list-icon">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>`;
    };

    // Task icon based on list name
    const getTaskIconHtml = (listName) => {
        const name = listName.toLowerCase().trim();

        if (name.includes('to do') || name.includes('todo') || name.includes('backlog')) {
            return `<span class="task-icon task-icon-todo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                </svg>
            </span>`;
        }

        if (name.includes('progress') || name.includes('doing') || name.includes('working')) {
            return `<span class="task-icon task-icon-progress">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M12 8v4l2 2"/>
                </svg>
            </span>`;
        }

        if (name.includes('done') || name.includes('complete') || name.includes('finished')) {
            return `<span class="task-icon task-icon-done">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M9 12l2 2 4-4"/>
                </svg>
            </span>`;
        }

        return `<span class="task-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="4"/>
            </svg>
        </span>`;
    };

    // Move To button HTML
    const getMoveToButtonHtml = () => {
        return `<button class="btn-icon btn-icon-sm move-to-btn" title="Move to..." aria-label="Move card to another list">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
            </svg>
        </button>`;
    };

    // Get DOM elements
    const getElements = () => ({
        modal: document.getElementById('moveToModal'),
        listContainer: document.getElementById('moveToListContainer'),
        closeBtn: document.getElementById('closeMoveToModal')
    });

    // Open Move To modal
    const openMoveToModal = (taskId, currentListId) => {
        const elements = getElements();
        if (!elements.modal || !elements.listContainer) return;

        movingTask = { id: taskId, listId: currentListId };

        // Render available lists
        renderMoveToLists(currentListId);

        // Open modal
        elements.modal.classList.add('active');

        // Focus first non-current item
        const firstFocusable = elements.listContainer.querySelector('.move-to-item:not(.current)');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    };

    // Close Move To modal
    const closeMoveToModal = () => {
        const elements = getElements();
        if (!elements.modal) return;

        elements.modal.classList.remove('active');
        movingTask = null;
    };

    // Render list options in modal
    const renderMoveToLists = (currentListId) => {
        const elements = getElements();
        if (!elements.listContainer) return;

        const lists = global.state?.lists || [];

        elements.listContainer.innerHTML = lists.map(list => {
            const isCurrent = list.id === currentListId;
            return `
                <div class="move-to-item ${isCurrent ? 'current' : ''}"
                     data-list-id="${list.id}"
                     tabindex="0"
                     role="button"
                     aria-label="Move to ${escapeHtml(list.name)}${isCurrent ? ' (current list)' : ''}">
                    ${getListIconHtml(list.name)}
                    <span class="move-to-item-name">${escapeHtml(list.name)}</span>
                </div>
            `;
        }).join('');

        // Add event listeners to list items
        elements.listContainer.querySelectorAll('.move-to-item').forEach(item => {
            item.addEventListener('click', handleListItemClick);
            item.addEventListener('touchend', handleListItemTouch);
            item.addEventListener('keydown', handleListItemKeydown);
        });
    };

    // Handle list item click
    const handleListItemClick = async (e) => {
        const item = e.currentTarget;
        if (item.classList.contains('current')) return;

        const targetListId = parseInt(item.dataset.listId, 10);
        await moveTaskToList(targetListId);
    };

    // Handle list item touch
    const handleListItemTouch = async (e) => {
        e.preventDefault();
        const item = e.currentTarget;
        if (item.classList.contains('current')) return;

        const targetListId = parseInt(item.dataset.listId, 10);
        await moveTaskToList(targetListId);
    };

    // Handle list item keyboard
    const handleListItemKeydown = async (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const item = e.currentTarget;
            if (item.classList.contains('current')) return;

            const targetListId = parseInt(item.dataset.listId, 10);
            await moveTaskToList(targetListId);
        }
    };

    // Move task to another list
    const moveTaskToList = async (targetListId) => {
        if (!movingTask) return;

        const { id: taskId, listId: currentListId } = movingTask;

        if (targetListId === currentListId) {
            closeMoveToModal();
            return;
        }

        try {
            // Get the target list for position calculation
            const targetListTasks = global.state?.tasks?.[targetListId] || [];
            const newPosition = targetListTasks.length;

            // Call API to update task
            await global.API.updateTask(taskId, {
                list_id: targetListId,
                position: newPosition
            });

            // Update DOM - move card visually
            updateCardInDOM(taskId, targetListId);

            // Close modal
            closeMoveToModal();

            // Reload data if function exists
            if (typeof global.loadListsAndTasks === 'function' && global.state?.currentProject?.id) {
                await global.loadListsAndTasks(global.state.currentProject.id);
                if (typeof global.renderBoard === 'function') {
                    global.renderBoard();
                }
            }
        } catch (error) {
            console.error('Failed to move task:', error);
            // Keep modal open on error? Or close it?
            // For now, just log error and don't move the card
        }
    };

    // Update card in DOM after move
    const updateCardInDOM = (taskId, targetListId) => {
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!card) return;

        // Update card's list id
        card.dataset.listId = targetListId;

        // Update task icon based on new list
        const targetList = global.state?.lists?.find(l => l.id === targetListId);
        if (targetList) {
            const titleElement = card.querySelector('.task-card-title');
            if (titleElement) {
                const existingIcon = titleElement.querySelector('.task-icon');
                const newIconHtml = getTaskIconHtml(targetList.name);
                if (existingIcon) {
                    existingIcon.outerHTML = newIconHtml;
                }
            }
        }

        // Move card to target list in DOM
        const targetListContent = document.querySelector(`.list-content[data-list-id="${targetListId}"]`);
        if (targetListContent) {
            targetListContent.appendChild(card);
        }
    };

    // Add move-to buttons to all task cards
    const addMoveToButtons = () => {
        const taskCards = document.querySelectorAll('.task-card');

        taskCards.forEach(card => {
            const actionsContainer = card.querySelector('.task-card-actions');
            if (!actionsContainer) return;

            // Remove existing move-to button to prevent duplicates
            const existingBtn = actionsContainer.querySelector('.move-to-btn');
            if (existingBtn) {
                existingBtn.remove();
            }

            // Add new move-to button
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = getMoveToButtonHtml();
            const moveToBtn = tempDiv.firstElementChild;

            // Add event listeners
            moveToBtn.addEventListener('click', handleMoveToClick);
            moveToBtn.addEventListener('touchend', handleMoveToTouch);

            // Insert as first button in actions
            actionsContainer.insertBefore(moveToBtn, actionsContainer.firstChild);
        });
    };

    // Handle move-to button click
    const handleMoveToClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = e.currentTarget.closest('.task-card');
        if (!card) return;

        const taskId = parseInt(card.dataset.taskId, 10);
        const currentListId = parseInt(card.dataset.listId, 10);

        openMoveToModal(taskId, currentListId);
    };

    // Handle move-to button touch
    const handleMoveToTouch = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = e.currentTarget.closest('.task-card');
        if (!card) return;

        const taskId = parseInt(card.dataset.taskId, 10);
        const currentListId = parseInt(card.dataset.listId, 10);

        openMoveToModal(taskId, currentListId);
    };

    // Setup modal close handlers
    const setupModalCloseHandlers = () => {
        const elements = getElements();

        // Close button
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', closeMoveToModal);
            elements.closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                closeMoveToModal();
            });
        }

        // Click outside modal
        if (elements.modal) {
            elements.modal.addEventListener('click', (e) => {
                if (e.target === elements.modal) {
                    closeMoveToModal();
                }
            });
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal?.classList.contains('active')) {
                closeMoveToModal();
            }
        });
    };

    // Escape HTML helper
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Initialize module
    const init = () => {
        addMoveToButtons();

        if (!initialized) {
            setupModalCloseHandlers();
            initialized = true;
        }
    };

    // Get current moving task (for testing)
    const getMovingTask = () => {
        return movingTask ? { ...movingTask } : null;
    };

    // Reset for testing
    const reset = () => {
        initialized = false;
        movingTask = null;
    };

    // Export module
    const MobileCardMove = {
        init,
        getMovingTask,
        openMoveToModal,
        closeMoveToModal,
        addMoveToButtons,
        reset
    };

    // Export for both browser and Node.js (testing)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MobileCardMove;
    } else {
        global.MobileCardMove = MobileCardMove;
    }

})(typeof window !== 'undefined' ? window : global);
