(function () {
  "use strict";

  var STORAGE_KEY = "todo_app_tasks_v1";
  var tasks = [];
  var currentFilter = "all";

  var form = document.getElementById("task-form");
  var input = document.getElementById("task-input");
  var errorEl = document.getElementById("form-error");
  var listEl = document.getElementById("task-list");
  var emptyEl = document.getElementById("empty-state");
  var filterButtons = document.querySelectorAll(".filter-btn");

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
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    var filter = target.getAttribute("data-filter");
    if (!filter) {
      return;
    }

    currentFilter = filter;
    updateFilterButtons();
    render();
  });

  listEl.addEventListener("click", function (event) {
    var target = event.target;
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
      var shouldDelete = window.confirm("Delete this task?");
      if (!shouldDelete) {
        return;
      }

      tasks = tasks.filter(function (entry) {
        return entry.id !== id;
      });
      saveTasks();
      render();
    }
  });

  loadTasks();
  updateFilterButtons();
  render();
})();
