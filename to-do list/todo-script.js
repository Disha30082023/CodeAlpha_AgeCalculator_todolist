// Grab elements
const form = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDueInput = document.getElementById('task-due');
const todoList = document.getElementById('todo-list');
const statusToggleBtn = document.getElementById('status-toggle-btn');
const statusCard = document.getElementById('status-card');
const dueTasksList = document.getElementById('due-tasks-list');
const completedTasksList = document.getElementById('completed-tasks-list');
const closeStatusCardBtn = document.getElementById('close-status-card');

let tasks = [];

// Helper: format time duration as "X days Y hrs Z mins"
function formatDuration(ms) {
  if (ms <= 0) return "Overdue";
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  let str = "";
  if (days > 0) str += `${days}d `;
  if (hours > 0) str += `${hours}h `;
  str += `${minutes}m`;
  return str;
}

// Helper: format date-time nicely
function formatDateTime(dateStr) {
  const dt = new Date(dateStr);
  return dt.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false
  });
}

// Set minimum allowed due date/time to current datetime (rounded) on page load and on focus
function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}
function getCurrentLocalDatetime() {
  const now = new Date();
  return (
    now.getFullYear() + "-" +
    padTo2Digits(now.getMonth() + 1) + "-" +
    padTo2Digits(now.getDate()) + "T" +
    padTo2Digits(now.getHours()) + ":" +
    padTo2Digits(now.getMinutes())
  );
}
function updateMinDueDate() {
  taskDueInput.min = getCurrentLocalDatetime();
}
updateMinDueDate();
taskDueInput.addEventListener('focus', updateMinDueDate);

// Prevent user from selecting or typing past date/time in due input dynamically
taskDueInput.addEventListener('input', () => {
  const nowLocal = getCurrentLocalDatetime();
  if (taskDueInput.value && taskDueInput.value < nowLocal) {
    taskDueInput.value = nowLocal;
    alert('Due date/time cannot be set in the past. It has been reset to the current date/time.');
  }
});

// Load tasks from localStorage
function loadTasks() {
  const savedTasks = localStorage.getItem('tasks');
  tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render main task list
function renderTasks() {
  todoList.innerHTML = "";
  if (tasks.length === 0) {
    todoList.innerHTML = `<li class="empty-msg">No tasks added yet.</li>`;
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = "task-item";
    li.dataset.id = task.id;

    // Checkbox completed
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'task-checkbox';
    checkbox.title = 'Mark task as completed';

    // Editable task text
    const taskTextDiv = document.createElement('div');
    taskTextDiv.className = 'task-text';
    taskTextDiv.textContent = task.text;
    taskTextDiv.contentEditable = false;
    taskTextDiv.spellcheck = false;

    // Tooltip shows start and due if exists
    let tooltipText = `Started: ${formatDateTime(task.start)}`;
    if (task.due) tooltipText += ` | Due: ${formatDateTime(task.due)}`;
    taskTextDiv.title = tooltipText;

    // Show due date small below text (optional)
    const dueSpan = document.createElement('small');
    dueSpan.style.marginLeft = '0.6rem';
    dueSpan.style.fontSize = '0.75rem';
    dueSpan.style.color = '#64748b';
    if (task.due) {
      dueSpan.textContent = `(Due: ${formatDateTime(task.due)})`;
    }

    // Buttons: Edit, Save, Delete
    const editBtn = document.createElement('button');
    editBtn.textContent = "Edit";
    editBtn.className = "btn-edit";
    editBtn.title = 'Edit task';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = "Save";
    saveBtn.className = "btn-save hidden";
    saveBtn.title = 'Save edited task';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn-delete";
    deleteBtn.title = 'Delete task';

    // Due input for editing (hidden by default)
    const dueEditInput = document.createElement('input');
    dueEditInput.type = 'datetime-local';
    dueEditInput.className = 'hidden';
    dueEditInput.value = task.due ? task.due.substring(0,16) : '';
    dueEditInput.style.marginLeft = '10px';
    dueEditInput.style.padding = '0.15rem 0.3rem';
    dueEditInput.title = 'Edit due date and time';
    dueEditInput.min = getCurrentLocalDatetime();

    // Update min attribute on focus inside edit due input
    dueEditInput.addEventListener('focus', () => {
      dueEditInput.min = getCurrentLocalDatetime();
    });

    // Prevent past due date/time in edit input dynamically
    dueEditInput.addEventListener('input', () => {
      const nowLocal = getCurrentLocalDatetime();
      if (dueEditInput.value && dueEditInput.value < nowLocal) {
        dueEditInput.value = nowLocal;
        alert('Due date/time cannot be set in the past. It has been reset to the current date/time.');
      }
    });

    li.appendChild(checkbox);
    li.appendChild(taskTextDiv);
    li.appendChild(dueSpan);
    li.appendChild(dueEditInput);
    li.appendChild(editBtn);
    li.appendChild(saveBtn);
    li.appendChild(deleteBtn);

    todoList.appendChild(li);

    // Toggle completed
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      // If marking completed for first time, register end time as now
      if (task.completed && !task.end) {
        task.end = new Date().toISOString();
      }
      saveTasks();
      renderTasks();
    });

    // Edit button
    editBtn.addEventListener('click', () => {
      taskTextDiv.contentEditable = true;
      taskTextDiv.focus();
      dueSpan.classList.add('hidden');
      dueEditInput.classList.remove('hidden');
      editBtn.classList.add('hidden');
      saveBtn.classList.remove('hidden');
    });

    // Save button
    saveBtn.addEventListener('click', () => {
      const newText = taskTextDiv.textContent.trim();
      const newDueRaw = dueEditInput.value;
      const newDue = newDueRaw ? new Date(newDueRaw).toISOString() : null;

      if (!newText) {
        alert("Task text cannot be empty.");
        taskTextDiv.focus();
        return;
      }
      // Check due date is not past
      if (newDueRaw) {
        const selectedDue = new Date(newDueRaw);
        const now = new Date();
        if (selectedDue < now) {
          alert("Due date/time cannot be in the past. Please select a valid due date/time.");
          dueEditInput.focus();
          return;
        }
      }
      task.text = newText;
      task.due = newDue;
      taskTextDiv.contentEditable = false;
      dueSpan.textContent = task.due ? `(Due: ${formatDateTime(task.due)})` : '';
      dueSpan.classList.remove('hidden');
      dueEditInput.classList.add('hidden');
      editBtn.classList.remove('hidden');
      saveBtn.classList.add('hidden');
      saveTasks();
      renderTasks();
    });

    // Delete button
    deleteBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });
  });
}

// Add new task handler
form.addEventListener('submit', e => {
  e.preventDefault();

  const taskText = taskInput.value.trim();
  if (!taskText) return;

  // Validate due date is not in the past
  if (taskDueInput.value) {
    const selectedDue = new Date(taskDueInput.value);
    const now = new Date();
    if (selectedDue < now) {
      alert("Due date/time cannot be in the past. Please select a valid due date/time.");
      taskDueInput.focus();
      return;
    }
  }

  const due = taskDueInput.value ? new Date(taskDueInput.value).toISOString() : null;
  const start = new Date().toISOString();

  tasks.push({
    id: Date.now(),
    text: taskText,
    completed: false,
    start, // Auto assigned on creation
    end: null, // Will be assigned when task marked completed
    due,
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
  taskDueInput.value = "";
  taskInput.focus();
});

// Show/hide status card
statusToggleBtn.addEventListener('click', () => {
  populateStatusCard();
  statusCard.classList.remove('hidden');
  statusCard.classList.add('show-fade-in');
  document.body.style.overflow = 'hidden';
});

closeStatusCardBtn.addEventListener('click', () => {
  statusCard.classList.remove('show-fade-in');
  statusCard.classList.add('hidden');
  document.body.style.overflow = 'auto';
});

// Populate the status card with tasks and time info
function populateStatusCard() {
  dueTasksList.innerHTML = "";
  completedTasksList.innerHTML = "";

  const now = new Date();

  const dueTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (dueTasks.length === 0) {
    const li = document.createElement('li');
    li.textContent = "No tasks due. Great job!";
    dueTasksList.appendChild(li);
  } else {
    dueTasks.forEach(task => {
      const li = document.createElement('li');

      // Task text + flex container
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';

      const textSpan = document.createElement('span');
      textSpan.textContent = task.text;
      textSpan.className = "due-task";

      const timeSpan = document.createElement('span');
      timeSpan.className = 'task-time-remaining';

      // Show only start time for due tasks
      timeSpan.textContent = `Started: ${formatDateTime(task.start)}`;

      li.appendChild(textSpan);
      li.appendChild(timeSpan);
      dueTasksList.appendChild(li);
    });
  }

  if (completedTasks.length === 0) {
    const li = document.createElement('li');
    li.textContent = "No completed tasks yet.";
    completedTasksList.appendChild(li);
  } else {
    completedTasks.forEach(task => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'flex-start';

      const textSpan = document.createElement('span');
      textSpan.textContent = task.text;
      textSpan.className = 'completed-task';

      const timeSpan = document.createElement('span');
      timeSpan.style.fontSize = '0.85rem';
      timeSpan.style.color = '#64748b';
      timeSpan.style.fontStyle = 'italic';
      timeSpan.style.whiteSpace = 'normal';
      timeSpan.style.overflowWrap = 'break-word';
      timeSpan.style.textAlign = 'right';

      // Show start and end time (completed time)
      const startStr = formatDateTime(task.start);
      const endStr = task.end ? formatDateTime(task.end) : "N/A";

      timeSpan.textContent = `Started: ${startStr} | Completed: ${endStr}`;

      li.appendChild(textSpan);
      li.appendChild(timeSpan);
      completedTasksList.appendChild(li);
    });
  }
}

// Initial load
loadTasks();
renderTasks();
