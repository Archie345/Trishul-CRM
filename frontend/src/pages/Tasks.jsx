import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

/* =========================================================
   WEBSOCKET URL
========================================================= */

const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error("VITE_API_URL is not configured");
  }

  const base = new URL(apiUrl);

  const protocol =
    base.protocol === "https:" ? "wss:" : "ws:";

  const basePath = base.pathname.replace(/\/+$/, "");

  return `${protocol}//${base.host}${basePath}/tasks/ws`;
};

/* =========================================================
   HELPERS
========================================================= */

const formatPriority = (priority) => {
  if (!priority) return "Medium";

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1).toLowerCase()
  );
};

const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toISOString().split("T")[0];
};

/* =========================================================
   TASKS
========================================================= */

export default function Tasks() {

  /* =======================================================
     STATE
  ======================================================= */

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    status: "Pending",
    assigned_to: "",
  });

  /* =======================================================
     CURRENT USER
  ======================================================= */

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");

      setCurrentUser(response.data);
    } catch (error) {
      console.error(
        "Error fetching current user:",
        error
      );
    }
  };

  /* =======================================================
     FETCH TASKS
  ======================================================= */

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks/");

      setTasks(response.data);
    } catch (error) {
      console.error(
        "Error fetching tasks:",
        error
      );
    }
  };

  /* =======================================================
     FETCH EMPLOYEES
  ======================================================= */

  const fetchEmployees = async () => {
    try {
      if (!currentUser) return;

      if (
        currentUser.role !== "admin" &&
        currentUser.role !== "supervisor"
      ) {
        return;
      }

      const response = await api.get("/users");

      setEmployees(response.data);
    } catch (error) {
      console.error(
        "Error fetching employees:",
        error
      );
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchCurrentUser();
    fetchTasks();
  }, []);

  /* =======================================================
     LOAD EMPLOYEES
  ======================================================= */

  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
    }
  }, [currentUser]);

  /* =======================================================
     WEBSOCKET
  ======================================================= */

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;

      try {
        const wsUrl = getWebSocketUrl();

        console.log(
          "Connecting Tasks WebSocket:",
          wsUrl
        );

        ws = new WebSocket(wsUrl);

        ws.onopen = async () => {
          console.log(
            "Tasks WebSocket connected"
          );

          setWsConnected(true);

          reconnectAttempts = 0;

          await fetchTasks();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            console.log(
              "Task WebSocket event:",
              data
            );

            /* CREATE */

            if (data.event === "task_created") {
              setTasks((prev) => {
                const exists = prev.some(
                  (task) =>
                    task.id === data.task.id
                );

                if (exists) {
                  return prev;
                }

                return [
                  data.task,
                  ...prev,
                ];
              });
            }

            /* UPDATE */

            if (data.event === "task_updated") {
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === data.task.id
                    ? data.task
                    : task
                )
              );
            }

            /* DELETE */

            if (data.event === "task_deleted") {
              setTasks((prev) =>
                prev.filter(
                  (task) =>
                    task.id !== data.task_id
                )
              );
            }

          } catch (error) {
            console.error(
              "Invalid task WebSocket message:",
              error
            );
          }
        };

        ws.onerror = (error) => {
          console.error(
            "Tasks WebSocket error:",
            error
          );
        };

        ws.onclose = () => {
          console.log(
            "Tasks WebSocket disconnected"
          );

          setWsConnected(false);

          if (isUnmounted) return;

          const delay = Math.min(
            1000 * 2 ** reconnectAttempts,
            10000
          );

          reconnectAttempts++;

          reconnectTimer = setTimeout(
            connectWebSocket,
            delay
          );
        };

      } catch (error) {
        console.error(
          "Unable to create Tasks WebSocket:",
          error
        );
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;

      clearTimeout(reconnectTimer);

      if (ws) {
        ws.close();
      }
    };
  }, []);

  /* =======================================================
     EMPLOYEE NAME
  ======================================================= */

  function getEmployeeName(userId) {
    const employee = employees.find(
      (employee) =>
        employee.id === userId
    );

    return employee
      ? employee.full_name
      : `User #${userId}`;
  }

  /* =======================================================
     FILTERED TASKS
  ======================================================= */

  const filteredTasks = useMemo(() => {

    let data = [...tasks];

    const searchValue =
      search.trim().toLowerCase();

    if (searchValue) {
      data = data.filter((task) => {

        const title =
          task.title?.toLowerCase() || "";

        const description =
          task.description?.toLowerCase() || "";

        const employeeName =
          getEmployeeName(
            task.assigned_to
          ).toLowerCase();

        return (
          title.includes(searchValue) ||
          description.includes(searchValue) ||
          employeeName.includes(searchValue)
        );
      });
    }

    if (statusFilter !== "All") {
      data = data.filter(
        (task) =>
          task.status === statusFilter
      );
    }

    if (priorityFilter !== "All") {
      data = data.filter(
        (task) =>
          task.priority?.toLowerCase() ===
          priorityFilter.toLowerCase()
      );
    }

    return data;

  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    employees,
  ]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const highPriorityTasks = tasks.filter(
    (task) =>
      task.priority?.toLowerCase() === "high"
  ).length;

  /* =======================================================
     ADD MODAL
  ======================================================= */

  const openAddModal = () => {

    setEditingTask(null);

    setForm({
      title: "",
      description: "",
      due_date: "",
      priority: "medium",
      status: "Pending",
      assigned_to:
        currentUser?.role === "employee"
          ? currentUser.id
          : "",
    });

    setShowModal(true);
  };

  /* =======================================================
     EDIT MODAL
  ======================================================= */

  const openEditModal = (task) => {

    setEditingTask(task);

    setForm({
      title: task.title || "",
      description:
        task.description || "",
      due_date:
        task.due_date || "",
      priority:
        task.priority?.toLowerCase() ||
        "medium",
      status:
        task.status || "Pending",
      assigned_to:
        task.assigned_to || "",
    });

    setShowModal(true);
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (saving) return;

    try {

      setSaving(true);

      const payload = {
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        priority: form.priority,
        status: form.status,
        assigned_to:
          currentUser?.role === "employee"
            ? currentUser.id
            : Number(form.assigned_to),
      };

      if (editingTask) {

        await api.put(
          `/tasks/${editingTask.id}`,
          payload
        );

      } else {

        await api.post(
          "/tasks/",
          payload
        );

      }

      setShowModal(false);
      setEditingTask(null);

      setForm({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        status: "Pending",
        assigned_to: "",
      });

    } catch (error) {

      console.error(
        "Error saving task:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to save task."
      );

    } finally {

      setSaving(false);

    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteTask = async (taskId) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) return;

    try {

      await api.delete(
        `/tasks/${taskId}`
      );

    } catch (error) {

      console.error(
        "Error deleting task:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to delete task."
      );
    }
  };

  /* =======================================================
     COMPLETE
  ======================================================= */

  const markCompleted = async (task) => {

    try {

      await api.put(
        `/tasks/${task.id}`,
        {
          title: task.title,
          description:
            task.description,
          due_date: task.due_date,
          priority: task.priority,
          status:
            task.status === "Completed"
              ? "Pending"
              : "Completed",
          assigned_to:
            task.assigned_to,
        }
      );

    } catch (error) {

      console.error(
        "Error changing task status:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to update task."
      );
    }
  };

  /* =======================================================
     PRIORITY STYLE
  ======================================================= */

  const getPriorityStyle = (priority) => {

    switch (
      priority?.toLowerCase()
    ) {

      case "high":
        return {
          badge:
            "bg-rose-500/10 text-rose-400 border border-rose-500/30",
          dot:
            "bg-rose-500",
        };

      case "medium":
        return {
          badge:
            "bg-orange-500/10 text-orange-400 border border-orange-500/30",
          dot:
            "bg-orange-500",
        };

      case "low":
        return {
          badge:
            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
          dot:
            "bg-emerald-500",
        };

      default:
        return {
          badge:
            "bg-slate-700 text-slate-400 border border-slate-600",
          dot:
            "bg-slate-400",
        };
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Layout>

      <PageWrapper>

        <div className="w-full min-w-0 max-w-full overflow-hidden">

          {/* =================================================
              HEADER
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-5 sm:p-6 mb-5"
          >

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="min-w-0">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl">
                    ✓
                  </div>

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <h1 className="text-xl sm:text-2xl font-bold text-white">
                        Tasks & Assignment Workflow
                      </h1>

                      <span className="text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md">
                        Firestore Synced
                      </span>

                    </div>

                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Assign tasks to supervisors & agents,
                      monitor deadlines & track execution status.
                    </p>

                  </div>

                </div>

              </div>

              <button
                onClick={openAddModal}
                className="shrink-0 bg-cyan-500 hover:bg-cyan-400 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/10 transition"
              >
                + Assign New Task
              </button>

            </div>

          </motion.div>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            {/* TOTAL */}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg"
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Tasks
                  </p>

                  <p className="text-3xl font-bold text-white mt-2">
                    {totalTasks}
                  </p>

                </div>

                <span className="text-xs font-semibold text-slate-500">
                  Assigned
                </span>

              </div>

            </motion.div>

            {/* PENDING */}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.05,
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg"
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pending Queue
                  </p>

                  <p className="text-3xl font-bold text-cyan-400 mt-2">
                    {pendingTasks}
                  </p>

                </div>

                <span className="text-xs font-semibold text-cyan-400">
                  Action Required
                </span>

              </div>

            </motion.div>

            {/* COMPLETED */}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg"
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Completed
                  </p>

                  <p className="text-3xl font-bold text-emerald-400 mt-2">
                    {completedTasks}
                  </p>

                </div>

                <span className="text-xs font-semibold text-emerald-400">
                  Done
                </span>

              </div>

            </motion.div>

            {/* HIGH PRIORITY */}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.15,
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg"
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    High Priority
                  </p>

                  <p className="text-3xl font-bold text-rose-400 mt-2">
                    {highPriorityTasks}
                  </p>

                </div>

                <span className="text-xs font-semibold text-rose-400">
                  Urgent
                </span>

              </div>

            </motion.div>

          </div>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg">

            <div className="flex flex-col lg:flex-row gap-3">

              {/* SEARCH */}

              <div className="relative flex-1 min-w-0">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search tasks or assignees..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
                />

              </div>

              {/* STATUS */}

              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">

                {[
                  "All",
                  "Pending",
                  "Completed",
                ].map((status) => (

                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                      statusFilter === status
                        ? "bg-slate-800 text-cyan-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>

                ))}

              </div>

              {/* PRIORITY */}

              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(
                    e.target.value
                  )
                }
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-500"
              >

                <option value="All">
                  All Priorities
                </option>

                <option value="high">
                  High Priority
                </option>

                <option value="medium">
                  Medium Priority
                </option>

                <option value="low">
                  Low Priority
                </option>

              </select>

            </div>

          </div>

          {/* =================================================
              TASK LIST
          ================================================= */}

          <div className="space-y-3">

            {filteredTasks.length > 0 ? (

              filteredTasks.map((task) => {

                const priorityStyle =
                  getPriorityStyle(
                    task.priority
                  );

                const completed =
                  task.status ===
                  "Completed";

                return (

                  <motion.div
                    key={task.id}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    layout
                    className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg hover:border-slate-700 hover:bg-slate-[850] transition ${
                      completed
                        ? "opacity-70"
                        : ""
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      {/* CHECK */}

                      <button
                        onClick={() =>
                          markCompleted(task)
                        }
                        className={`mt-1 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
                          completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-600 hover:border-cyan-400"
                        }`}
                        title={
                          completed
                            ? "Mark as pending"
                            : "Mark as completed"
                        }
                      >

                        {completed && (
                          <span className="text-[11px]">
                            ✓
                          </span>
                        )}

                      </button>

                      {/* MAIN */}

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">

                          <h3
                            className={`font-bold text-sm sm:text-base ${
                              completed
                                ? "line-through text-slate-500"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </h3>

                          <span
                            className={`w-fit px-2 py-1 rounded-md text-[9px] font-bold uppercase ${
                              priorityStyle.badge
                            }`}
                          >
                            {formatPriority(
                              task.priority
                            )}
                          </span>

                        </div>

                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {task.description ||
                            "No description"}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[11px] text-slate-500">

                          {/* ASSIGNEE */}

                          <span className="flex items-center gap-1">

                            <span className="text-cyan-400">
                              ♙
                            </span>

                            Assigned:

                            <strong className="text-slate-300">
                              {getEmployeeName(
                                task.assigned_to
                              )}
                            </strong>

                          </span>

                          {/* DATE */}

                          <span className="flex items-center gap-1">

                            <span className="text-orange-400">
                              ▣
                            </span>

                            Due:

                            <strong className="text-slate-300">
                              {formatDate(
                                task.due_date
                              )}
                            </strong>

                          </span>

                          {/* TYPE */}

                          <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[9px] text-slate-400">
                            Task
                          </span>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex items-center gap-2 shrink-0">

                        <button
                          onClick={() =>
                            openEditModal(
                              task
                            )
                          }
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-500/10 transition"
                          title="Edit"
                        >
                          ✎
                        </button>

                        <button
                          onClick={() =>
                            deleteTask(
                              task.id
                            )
                          }
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete"
                        >
                          🗑
                        </button>

                      </div>

                    </div>

                  </motion.div>

                );

              })

            ) : (

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">

                <div className="text-3xl text-slate-600 mb-3">
                  —
                </div>

                <p className="text-sm text-slate-400">
                  No tasks found
                </p>

                <p className="text-xs text-slate-600 mt-1">
                  Try changing your search or filters.
                </p>

              </div>

            )}

          </div>

          {/* =================================================
              WEBSOCKET STATUS
          ================================================= */}

          <div className="flex justify-end mt-4">

            <div className="flex items-center gap-2 text-[10px] text-slate-500">

              <span
                className={`w-2 h-2 rounded-full ${
                  wsConnected
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />

              {wsConnected
                ? "Live updates connected"
                : "Reconnecting..."}

            </div>

          </div>

        </div>

        {/* ===================================================
            ADD / EDIT MODAL
        =================================================== */}

        {showModal && (

          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
            >

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h2 className="text-xl font-bold text-white">
                    {editingTask
                      ? "Edit Task"
                      : "Assign New Task"}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    {editingTask
                      ? "Update task details"
                      : "Create and assign a new task"}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white text-xl"
                >
                  ×
                </button>

              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* TITLE */}

                <div>

                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Task Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={
                      handleChange
                    }
                    placeholder="Enter task title"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500"
                  />

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Describe the task..."
                    rows="3"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500 resize-none"
                  />

                </div>

                {/* DATE + PRIORITY */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Due Date
                    </label>

                    <input
                      type="date"
                      name="due_date"
                      value={
                        form.due_date
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                    />

                  </div>

                  <div>

                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={
                        form.priority
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                    >

                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                    </select>

                  </div>

                </div>

                {/* STATUS */}

                {editingTask && (

                  <div>

                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                    >

                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                    </select>

                  </div>

                )}

                {/* ASSIGNED TO */}

                {currentUser?.role !==
                  "employee" && (

                  <div>

                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Assign To
                    </label>

                    <select
                      name="assigned_to"
                      value={
                        form.assigned_to
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                    >

                      <option value="">
                        Select employee
                      </option>

                      {employees
                        .filter(
                          (employee) =>
                            employee.role ===
                              "employee" ||
                            employee.role ===
                              "supervisor"
                        )
                        .map(
                          (employee) => (
                            <option
                              key={
                                employee.id
                              }
                              value={
                                employee.id
                              }
                            >
                              {
                                employee.full_name
                              }{" "}
                              —{" "}
                              {
                                employee.role
                              }
                            </option>
                          )
                        )}

                    </select>

                  </div>

                )}

                {/* BUTTONS */}

                <div className="flex gap-3 pt-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowModal(false)
                    }
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
                  >
                    {saving
                      ? "Saving..."
                      : editingTask
                      ? "Update Task"
                      : "Create Task"}
                  </button>

                </div>

              </form>

            </motion.div>

          </div>

        )}

      </PageWrapper>

    </Layout>
  );
}