const DEFAULT_API_URL = "http://127.0.0.1:8000";

const state = {
  apiUrl: localStorage.getItem("epsylonApiUrl") || DEFAULT_API_URL,
  filter: "all",
  tasks: [],
};

const elements = {
  apiUrl: document.querySelector("#api-url"),
  saveApiUrl: document.querySelector("#save-api-url"),
  apiStatus: document.querySelector("#api-status"),
  refreshTasks: document.querySelector("#refresh-tasks"),
  taskForm: document.querySelector("#task-form"),
  taskTitle: document.querySelector("#task-title"),
  taskDescription: document.querySelector("#task-description"),
  taskList: document.querySelector("#task-list"),
  taskCount: document.querySelector("#task-count"),
  message: document.querySelector("#message"),
  filters: document.querySelectorAll(".filter-button"),
  template: document.querySelector("#task-template"),
};

elements.apiUrl.value = state.apiUrl;

function apiPath(path) {
  return `${state.apiUrl.replace(/\/$/, "")}${path}`;
}

function setMessage(text, isError = false) {
  elements.message.textContent = text;
  elements.message.classList.toggle("error", isError);
}

function setStatus(text, isOffline = false) {
  elements.apiStatus.textContent = text;
  elements.apiStatus.classList.toggle("offline", isOffline);
}

async function request(path, options = {}) {
  const response = await fetch(apiPath(path), {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getFilterQuery() {
  if (state.filter === "open") {
    return "?completed=false";
  }

  if (state.filter === "done") {
    return "?completed=true";
  }

  return "";
}

async function checkHealth() {
  try {
    await request("/health");
    setStatus("Online");
  } catch {
    setStatus("Offline", true);
  }
}

async function loadTasks() {
  setMessage("Loading tasks...");

  try {
    state.tasks = await request(`/tasks${getFilterQuery()}`);
    renderTasks();
    setMessage("");
  } catch (error) {
    state.tasks = [];
    renderTasks();
    setMessage(error.message, true);
  }
}

function renderTasks() {
  elements.taskList.innerHTML = "";
  elements.taskCount.textContent = `${state.tasks.length} ${state.tasks.length === 1 ? "task" : "tasks"}`;

  if (state.tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No tasks found.";
    elements.taskList.append(empty);
    return;
  }

  state.tasks.forEach((task) => {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    const completed = node.querySelector(".task-completed");
    const title = node.querySelector(".task-title-input");
    const description = node.querySelector(".task-description-input");
    const meta = node.querySelector(".task-meta");
    const save = node.querySelector(".save-task");
    const remove = node.querySelector(".delete-task");

    completed.checked = task.completed;
    title.value = task.title;
    description.value = task.description;
    meta.textContent = `Created ${task.created_at}`;

    completed.addEventListener("change", async () => {
      await updateTask(task.id, { completed: completed.checked });
    });

    save.addEventListener("click", async () => {
      await updateTask(task.id, {
        title: title.value.trim(),
        description: description.value.trim(),
      });
    });

    remove.addEventListener("click", async () => {
      await deleteTask(task.id);
    });

    elements.taskList.append(node);
  });
}

async function createTask(event) {
  event.preventDefault();

  const title = elements.taskTitle.value.trim();
  const description = elements.taskDescription.value.trim();

  if (!title) {
    setMessage("Title is required.", true);
    return;
  }

  try {
    await request("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });
    elements.taskForm.reset();
    setMessage("Task created.");
    await loadTasks();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function updateTask(taskId, payload) {
  try {
    await request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setMessage("Task updated.");
    await loadTasks();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function deleteTask(taskId) {
  try {
    await request(`/tasks/${taskId}`, { method: "DELETE" });
    setMessage("Task deleted.");
    await loadTasks();
  } catch (error) {
    setMessage(error.message, true);
  }
}

function saveApiUrl() {
  state.apiUrl = elements.apiUrl.value.trim() || DEFAULT_API_URL;
  elements.apiUrl.value = state.apiUrl;
  localStorage.setItem("epsylonApiUrl", state.apiUrl);
  checkHealth();
  loadTasks();
}

elements.saveApiUrl.addEventListener("click", saveApiUrl);
elements.refreshTasks.addEventListener("click", loadTasks);
elements.taskForm.addEventListener("submit", createTask);

elements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    elements.filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    loadTasks();
  });
});

checkHealth();
loadTasks();

