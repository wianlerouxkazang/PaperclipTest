(function () {
  "use strict";

  var USER_STORAGE_KEY = "todo_app_current_user_v1";
  var STORAGE_KEY_PREFIX = "todo_app_tasks_v1";
  var SETTINGS_STORAGE_KEY_PREFIX = "todo_app_settings_v1";
  var DEFAULT_SETTINGS = {
    defaultFilter: "all",
    confirmDelete: true,
    compactDensity: false,
  };
  var ALLOWED_FILTERS = ["all", "active", "completed"];

  var SUPABASE_URL = "https://ojajeibywvtebkqaetjf.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_NV-mn9v681OFqC0fdvBVcA_z4p26HFm";

  var tasks = [];
  var settings = Object.assign({}, DEFAULT_SETTINGS);
  var currentFilter = DEFAULT_SETTINGS.defaultFilter;
  var currentUser = "";
  var currentUserId = "";

  var supabaseClient = null;
  var useSupabase = false;

  var authGateEl = document.getElementById("auth-gate");
  var authForm = document.getElementById("auth-form");
  var usernameInput = document.getElementById("username-input");
  var authErrorEl = document.getElementById("auth-error");

  var appEl = document.querySelector(".app");
  var userBadgeEl = document.getElementById("user-badge");
  var logoutBtnEl = document.getElementById("logout-btn");
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

  function initializeSupabase() {
    var isLocalHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    var forceSupabase = window.__TODO_USE_SUPABASE === true;

    if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      useSupabase = false;
      return;
    }

    if (isLocalHost && !forceSupabase) {
      useSupabase = false;
      return;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
  }

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

  function getTaskStorageKey() {
    return STORAGE_KEY_PREFIX + "__" + currentUser;
  }

  function getSettingsStorageKey() {
    return SETTINGS_STORAGE_KEY_PREFIX + "__" + currentUser;
  }

  function loadCurrentUser() {
    try {
      var raw = localStorage.getItem(USER_STORAGE_KEY);
      currentUser = raw ? raw.trim() : "";
    } catch (err) {
      currentUser = "";
    }
  }

  function saveCurrentUser(username) {
    currentUser = username;
    localStorage.setItem(USER_STORAGE_KEY, currentUser);
  }

  function clearCurrentUser() {
    currentUser = "";
    currentUserId = "";
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  async function signInOrCreateUser(username) {
    if (!useSupabase || !supabaseClient) {
      currentUserId = username.toLowerCase();
      return;
    }

    var normalizedUsername = username.trim().toLowerCase();

    var existingResult = await supabaseClient
      .from("users")
      .select("id, username")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data && existingResult.data.id) {
      currentUserId = existingResult.data.id;
      currentUser = existingResult.data.username;
      return;
    }

    var insertResult = await supabaseClient
      .from("users")
      .insert({ username: normalizedUsername })
      .select("id, username")
      .single();

    if (insertResult.error) {
      var conflict = insertResult.error.code === "23505";
      if (!conflict) {
        throw insertResult.error;
      }

      var retryResult = await supabaseClient
        .from("users")
        .select("id, username")
        .eq("username", normalizedUsername)
        .single();

      if (retryResult.error) {
        throw retryResult.error;
      }

      currentUserId = retryResult.data.id;
      currentUser = retryResult.data.username;
      return;
    }

    currentUserId = insertResult.data.id;
    currentUser = insertResult.data.username;
  }

  async function loadTasks() {
    if (!currentUser) {
      tasks = [];
      return;
    }

    if (!useSupabase || !supabaseClient) {
      try {
        var raw = localStorage.getItem(getTaskStorageKey());
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

      return;
    }

    var response = await supabaseClient
      .from("tasks")
      .select("id, title, completed, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (response.error) {
      throw response.error;
    }

    tasks = response.data.map(function (entry) {
      return {
        id: entry.id,
        title: entry.title,
        completed: Boolean(entry.completed),
        createdAt: entry.created_at,
      };
    });
  }

  function saveTasksLocal() {
    if (!currentUser) {
      return;
    }

    localStorage.setItem(getTaskStorageKey(), JSON.stringify(tasks));
  }

  async function createTaskRecord(title) {
    if (!useSupabase || !supabaseClient) {
      var fallbackTask = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        title: title,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      tasks.unshift(fallbackTask);
      saveTasksLocal();
      return;
    }

    var response = await supabaseClient
      .from("tasks")
      .insert({
        user_id: currentUserId,
        title: title,
        completed: false,
      })
      .select("id, title, completed, created_at")
      .single();

    if (response.error) {
      throw response.error;
    }

    tasks.unshift({
      id: response.data.id,
      title: response.data.title,
      completed: Boolean(response.data.completed),
      createdAt: response.data.created_at,
    });
  }

  async function updateTaskRecord(taskId, updates) {
    if (!useSupabase || !supabaseClient) {
      tasks = tasks.map(function (task) {
        if (task.id !== taskId) {
          return task;
        }
        return Object.assign({}, task, updates);
      });
      saveTasksLocal();
      return;
    }

    var response = await supabaseClient
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("user_id", currentUserId)
      .select("id")
      .single();

    if (response.error) {
      throw response.error;
    }

    tasks = tasks.map(function (task) {
      if (task.id !== taskId) {
        return task;
      }
      return Object.assign({}, task, updates);
    });
  }

  async function deleteTaskRecord(taskId) {
    if (!useSupabase || !supabaseClient) {
      tasks = tasks.filter(function (task) {
        return task.id !== taskId;
      });
      saveTasksLocal();
      return;
    }

    var response = await supabaseClient
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", currentUserId);

    if (response.error) {
      throw response.error;
    }

    tasks = tasks.filter(function (task) {
      return task.id !== taskId;
    });
  }

  function loadSettings() {
    if (!currentUser) {
      settings = Object.assign({}, DEFAULT_SETTINGS);
      return;
    }

    try {
      var raw = localStorage.getItem(getSettingsStorageKey());
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

    if (!currentUser) {
      settings = normalized;
      return;
    }

    localStorage.setItem(getSettingsStorageKey(), JSON.stringify(normalized));
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

  function setError(message) {
    errorEl.textContent = message || "";
  }

  function setAuthError(message) {
    authErrorEl.textContent = message || "";
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

  async function startUserSession() {
    if (!currentUser) {
      return;
    }

    userBadgeEl.textContent = "User: " + currentUser;
    loadSettings();
    await loadTasks();
    applyDefaultFilterFromSettings();
    syncSettingsControls();
    applyVisualSettings();
    updateFilterButtons();
    setError("");
    setSettingsMessage("", false);
    render();

    authGateEl.setAttribute("hidden", "");
    appEl.removeAttribute("hidden");
    input.focus();
  }

  function endUserSession() {
    clearCurrentUser();
    tasks = [];
    settings = Object.assign({}, DEFAULT_SETTINGS);
    currentFilter = DEFAULT_SETTINGS.defaultFilter;
    setError("");
    setSettingsMessage("", false);
    form.reset();
    settingsPanelEl.setAttribute("hidden", "");
    settingsToggleEl.setAttribute("aria-expanded", "false");

    appEl.setAttribute("hidden", "");
    authGateEl.removeAttribute("hidden");
    usernameInput.focus();
  }

  authForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    var username = usernameInput.value.trim();

    if (!username) {
      setAuthError("Username is required.");
      usernameInput.focus();
      return;
    }

    authForm.querySelector("button[type='submit']").disabled = true;
    try {
      setAuthError("");
      saveCurrentUser(username);
      await signInOrCreateUser(username);
      await startUserSession();
    } catch (err) {
      setAuthError("Could not sign in right now. Please try again.");
      clearCurrentUser();
    } finally {
      authForm.querySelector("button[type='submit']").disabled = false;
    }
  });

  logoutBtnEl.addEventListener("click", function () {
    endUserSession();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var title = input.value.trim();

    if (!title) {
      setError("Task title is required.");
      input.focus();
      return;
    }

    try {
      setError("");
      await createTaskRecord(title);
      render();
      form.reset();
      input.focus();
    } catch (err) {
      setError("Could not save task. Please try again.");
    }
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

  listEl.addEventListener("click", async function (event) {
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
      try {
        setError("");
        await updateTaskRecord(id, { completed: !task.completed });
        render();
      } catch (err) {
        setError("Could not update task. Please try again.");
      }
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

      try {
        setError("");
        await updateTaskRecord(id, { title: nextTitle });
        render();
      } catch (err) {
        setError("Could not update task. Please try again.");
      }
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

      try {
        setError("");
        await deleteTaskRecord(id);
        render();
      } catch (err) {
        setError("Could not delete task. Please try again.");
      }
    }
  });

  async function boot() {
    initializeSupabase();
    loadCurrentUser();

    if (!currentUser) {
      authGateEl.removeAttribute("hidden");
      appEl.setAttribute("hidden", "");
      usernameInput.focus();
      return;
    }

    try {
      await signInOrCreateUser(currentUser);
      await startUserSession();
    } catch (err) {
      clearCurrentUser();
      authGateEl.removeAttribute("hidden");
      appEl.setAttribute("hidden", "");
      setAuthError("Could not restore your session. Please sign in again.");
      usernameInput.focus();
    }
  }

  boot();
})();
