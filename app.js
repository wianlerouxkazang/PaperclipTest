(function () {
  "use strict";

  var STORAGE_KEY = "todo_app_tasks_v1";
  var SETTINGS_STORAGE_KEY = "todo_app_settings_v1";
  var DEFAULT_SETTINGS = {
    defaultFilter: "all",
    confirmDelete: true,
    compactDensity: false,
  };
  var ALLOWED_FILTERS = ["all", "active", "completed"];
  var tasks = [];
  var settings = Object.assign({}, DEFAULT_SETTINGS);
  var currentFilter = DEFAULT_SETTINGS.defaultFilter;

  var appEl = document.querySelector(".app");
  var form = document.getElementById("task-form");
  var input = document.getElementById("task-input");
  var errorEl = document.getElementById("form-error");
  var listEl = document.getElementById("task-list");
  var emptyEl = document.getElementById("empty-state");
  var filterButtons = document.querySelectorAll(".filter-btn");
  var settingsToggleEl = document.getElementById("settings-toggle");
  var settingsPanelEl = document.getElementById("settings-panel");
  var defaultFilterEl = document.getElementById("default-filter");
  var confirmDeleteEl = document.getElementById("confirm-delete");
  var compactDensityEl = document.getElementById("compact-density");
  var settingsSaveEl = document.getElementById("settings-save");
  var settingsResetEl = document.getElementById("settings-reset");
  var settingsMessageEl = document.getElementById("settings-message");

  function isValidFilter(value) {
    return ALLOWED_FILTERS.indexOf(value) !== -1;
  }

  function normalizeSettings(candidate) {
    var next = Object.assign({}, DEFAULT_SETTINGS);

    if (!candidate || typeof candidate !== "object") {
      return next;
    }

    if (isValidFilter(candidate.defaultFilter)) {
      next.defaultFilter = candidate.defaultFilter;
    }

    if (typeof candidate.confirmDelete === "boolean") {
      next.confirmDelete = candidate.confirmDelete;
    }

    if (typeof candidate.compactDensity === "boolean") {
      next.compactDensity = candidate.compactDensity;
    }

    return next;
  }

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        tasks = [];
        return;
      }

      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        tasks = [];
        return;
      }

      tasks = parsed.filter(function (task) {
        return (
          task &&
          typeof task.id === "string" &&
          typeof task.title === "string" &&
          typeof task.completed === "boolean"
        );
      });
    } catch (err) {
      tasks = [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        settings = Object.assign({}, DEFAULT_SETTINGS);
        return;
      }
      settings = normalizeSettings(JSON.parse(raw));
    } catch (err) {
      settings = Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(nextSettings) {
    var normalized = normalizeSettings(nextSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    settings = normalized;
  }

  function setSettingsMessage(message, isError) {
    settingsMessageEl.textContent = message || "";
    settingsMessageEl.classList.toggle("error", Boolean(isError));
    settingsMessageEl.classList.toggle("success", Boolean(message) && !Boolean(isError));
  }

  function syncSettingsControls() {
    defaultFilterEl.value = settings.defaultFilter;
    confirmDeleteEl.checked = settings.confirmDelete;
    compactDensityEl.checked = settings.compactDensity;
  }

  function applyVisualSettings() {
    appEl.classList.toggle("compact", settings.compactDensity);
  }

  function applyDefaultFilterFromSettings() {
    currentFilter = isValidFilter(settings.defaultFilter)
      ? settings.defaultFilter
      : DEFAULT_SETTINGS.defaultFilter;
  }

  function createTask(title) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      title: title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
  }

  function setError(message) {
    errorEl.textContent = message || "";
  }

  function getFilteredTasks() {
    if (currentFilter === "active") {
      return tasks.filter(function (task) {
        return !task.completed;
      });
    }

    if (currentFilter === "completed") {
      return tasks.filter(function (task) {
        return task.completed;
      });
    }

    return tasks;
  }

  function getEmptyStateMessage() {
    if (currentFilter === "active") {
      return "No active tasks. You're all caught up.";
    }

    if (currentFilter === "completed") {
      return "No completed tasks yet.";
    }

    return "No tasks yet. Add your first task.";
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function render() {
    var visibleTasks = getFilteredTasks();

    if (visibleTasks.length === 0) {
      emptyEl.textContent = getEmptyStateMessage();
      emptyEl.style.display = "block";
      listEl.innerHTML = "";
      return;
    }

    emptyEl.style.display = "none";

    listEl.innerHTML = visibleTasks
      .map(function (task) {
        var safeTitle = escapeHtml(task.title);
        var checked = task.completed ? "checked" : "";
        var itemClass = task.completed ? "task-item completed" : "task-item";
        var toggleLabel = task.completed ? "Undo" : "Complete";

        return (
          '<li class="' +
          itemClass +
          '" data-id="' +
          task.id +
          '">' +
          '<input type="checkbox" class="toggle" aria-label="Toggle task completion" ' +
          checked +
          " />" +
          '<span class="task-title">' +
          safeTitle +
          "</span>" +
          '<div class="task-actions">' +
          '<button type="button" class="toggle-btn">' +
          toggleLabel +
          "</button>" +
          '<button type="button" class="edit">Edit</button>' +
          '<button type="button" class="delete">Delete</button>' +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  function updateFilterButtons() {
    filterButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-filter") === currentFilter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var title = input.value.trim();

    if (!title) {
      setError("Task title is required.");
      input.focus();
      return;
    }

    setError("");
    tasks.unshift(createTask(title));
    saveTasks();
    render();

    form.reset();
    input.focus();
  });

  document.querySelector(".filters").addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    var button = target.closest("[data-filter]");
    if (!button) {
      return;
    }

    var filter = button.getAttribute("data-filter");
    if (!filter) {
      return;
    }

    setError("");
    currentFilter = filter;
    updateFilterButtons();
    render();
  });

  settingsToggleEl.addEventListener("click", function () {
    var isOpen = settingsPanelEl.hasAttribute("hidden");
    if (isOpen) {
      settingsPanelEl.removeAttribute("hidden");
      settingsToggleEl.setAttribute("aria-expanded", "true");
      setSettingsMessage("", false);
      return;
    }

    settingsPanelEl.setAttribute("hidden", "");
    settingsToggleEl.setAttribute("aria-expanded", "false");
  });

  settingsSaveEl.addEventListener("click", function () {
    try {
      var next = {
        defaultFilter: defaultFilterEl.value,
        confirmDelete: confirmDeleteEl.checked,
        compactDensity: compactDensityEl.checked,
      };

      saveSettings(next);
      applyDefaultFilterFromSettings();
      applyVisualSettings();
      updateFilterButtons();
      render();
      setSettingsMessage("Settings saved.", false);
    } catch (err) {
      setSettingsMessage("Could not save settings. Try again.", true);
    }
  });

  settingsResetEl.addEventListener("click", function () {
    try {
      saveSettings(DEFAULT_SETTINGS);
      syncSettingsControls();
      applyDefaultFilterFromSettings();
      applyVisualSettings();
      updateFilterButtons();
      render();
      setSettingsMessage("Settings reset to defaults.", false);
    } catch (err) {
      setSettingsMessage("Could not reset settings. Try again.", true);
    }
  });

  listEl.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    var item = target.closest(".task-item");
    if (!item) {
      return;
    }

    var id = item.getAttribute("data-id");
    var task = tasks.find(function (entry) {
      return entry.id === id;
    });

    if (!task) {
      return;
    }

    if (target.classList.contains("toggle-btn") || target.classList.contains("toggle")) {
      setError("");
      task.completed = !task.completed;
      saveTasks();
      render();
      return;
    }

    if (target.classList.contains("edit")) {
      var nextTitle = window.prompt("Edit task", task.title);
      if (nextTitle === null) {
        return;
      }

      nextTitle = nextTitle.trim();
      if (!nextTitle) {
        setError("Task title cannot be empty.");
        return;
      }

      setError("");
      task.title = nextTitle;
      saveTasks();
      render();
      return;
    }

    if (target.classList.contains("delete")) {
      var shouldDelete = true;
      if (settings.confirmDelete) {
        shouldDelete = window.confirm("Delete this task?");
      }
      if (!shouldDelete) {
        return;
      }

      tasks = tasks.filter(function (entry) {
        return entry.id !== id;
      });
      setError("");
      saveTasks();
      render();
    }
  });

  loadSettings();
  loadTasks();
  applyDefaultFilterFromSettings();
  syncSettingsControls();
  applyVisualSettings();
  updateFilterButtons();
  render();
})();
