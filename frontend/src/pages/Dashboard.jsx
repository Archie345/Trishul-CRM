import { useEffect, useState } from "react";

import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import StatCard from "../components/dashboard/StatCard";
import LeadChart from "../components/charts/LeadChart";
import TaskChart from "../components/charts/TaskChart";
import api from "../api/api";

export default function Dashboard() {
  // =====================================================
  // OVERVIEW STATS
  // =====================================================

  const [stats, setStats] = useState({
    total_leads: 0,
    total_customers: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
  });

  // =====================================================
  // CHART DATA
  // =====================================================

  const [leadStatus, setLeadStatus] = useState([]);
  const [taskStatus, setTaskStatus] = useState([]);

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState(null);

  // =====================================================
  // CLOCK
  // =====================================================

  const [time, setTime] = useState(new Date());

  // =====================================================
  // LIVE DASHBOARD DATA
  // =====================================================

  const [liveData, setLiveData] = useState({
    employees: 0,
    leads: 0,
    customers: 0,
    tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    revenue: 0,
    conversion: 0,
    latest_customers: [],
    recent_activity: [],
  });

  // =====================================================
  // WEBSOCKET STATUS
  // =====================================================

  const [isLive, setIsLive] = useState(false);

  // =====================================================
  // FETCH DASHBOARD OVERVIEW
  // =====================================================

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await api.get("/reports/overview");

      setStats(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch dashboard:",
        error.response?.data || error.message
      );
    }
  };

  // =====================================================
  // FETCH LEAD STATUS
  // =====================================================

  const fetchLeadStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await api.get("/reports/lead-status");

      setLeadStatus(response.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch lead status:",
        error.response?.data || error.message
      );
    }
  };

  // =====================================================
  // FETCH TASK STATUS
  // =====================================================

  const fetchTaskStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await api.get("/reports/task-status");

      setTaskStatus(response.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch task status:",
        error.response?.data || error.message
      );
    }
  };

  // =====================================================
  // FETCH CURRENT USER
  // =====================================================

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await api.get("/auth/me");

      console.log("Dashboard user:", response.data);

      setUser(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error.response?.data || error.message
      );
    }
  };

  // =====================================================
  // FETCH LIVE DASHBOARD
  // =====================================================

  const fetchLiveDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await api.get("/reports/dashboard-live");

      console.log("Live dashboard:", response.data);

      const data = response.data || {};

      setLiveData((previous) => ({
        ...previous,
        ...data,
        employees: data.employees ?? previous.employees,
        leads: data.leads ?? data.total_leads ?? previous.leads,
        customers:
          data.customers ??
          data.total_customers ??
          previous.customers,
        tasks: data.tasks ?? data.total_tasks ?? previous.tasks,
        completed_tasks:
          data.completed_tasks ?? previous.completed_tasks,
        pending_tasks:
          data.pending_tasks ?? previous.pending_tasks,
        revenue: data.revenue ?? previous.revenue,
        conversion: data.conversion ?? previous.conversion,
        latest_customers:
          data.latest_customers ??
          previous.latest_customers,
        recent_activity:
          data.recent_activity ??
          previous.recent_activity,
      }));

      setStats((previous) => ({
        ...previous,

        total_leads:
          data.leads ??
          data.total_leads ??
          previous.total_leads,

        total_customers:
          data.customers ??
          data.total_customers ??
          previous.total_customers,

        total_tasks:
          data.tasks ??
          data.total_tasks ??
          previous.total_tasks,

        completed_tasks:
          data.completed_tasks ??
          previous.completed_tasks,

        pending_tasks:
          data.pending_tasks ??
          previous.pending_tasks,
      }));
    } catch (error) {
      console.error(
        "Failed to fetch live dashboard:",
        error.response?.data || error.message
      );
    }
  };

  // =====================================================
  // INITIAL LOAD + CLOCK
  // =====================================================

  useEffect(() => {
    fetchDashboard();
    fetchLeadStatus();
    fetchTaskStatus();
    fetchCurrentUser();
    fetchLiveDashboard();

    const clockInterval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  // =====================================================
  // DASHBOARD WEBSOCKET
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log(
        "No token found, skipping Dashboard WebSocket"
      );
      return;
    }

    const apiBaseUrl =
      api.defaults.baseURL || window.location.origin;

    const wsBaseUrl = apiBaseUrl
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:")
      .replace(/\/api\/?$/, "")
      .replace(/\/+$/, "");

    const wsUrl =
      `${wsBaseUrl}/reports/ws?token=${encodeURIComponent(token)}`;

    console.log(
      "Connecting Dashboard WebSocket:",
      wsUrl
    );

    let ws = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      try {
        ws = new WebSocket(wsUrl);

        // =============================================
        // CONNECTED
        // =============================================

        ws.onopen = () => {
          console.log(
            "Dashboard WebSocket connected ⚡"
          );

          setIsLive(true);
          reconnectAttempts = 0;
        };

        // =============================================
        // MESSAGE
        // =============================================

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            console.log(
              "Real-time dashboard update:",
              data
            );

            // -----------------------------------------
            // LIVE DATA
            // -----------------------------------------

            setLiveData((previous) => ({
              ...previous,

              ...data,

              leads:
                data.leads ??
                data.total_leads ??
                previous.leads,

              customers:
                data.customers ??
                data.total_customers ??
                previous.customers,

              tasks:
                data.tasks ??
                data.total_tasks ??
                previous.tasks,

              completed_tasks:
                data.completed_tasks ??
                previous.completed_tasks,

              pending_tasks:
                data.pending_tasks ??
                previous.pending_tasks,

              revenue:
                data.revenue ??
                previous.revenue,

              conversion:
                data.conversion ??
                previous.conversion,

              latest_customers:
                data.latest_customers ??
                previous.latest_customers,

              recent_activity:
                data.recent_activity ??
                previous.recent_activity,
            }));

            // -----------------------------------------
            // OVERVIEW STATS
            // -----------------------------------------

            setStats((previous) => ({
              ...previous,

              total_leads:
                data.leads ??
                data.total_leads ??
                previous.total_leads,

              total_customers:
                data.customers ??
                data.total_customers ??
                previous.total_customers,

              total_tasks:
                data.tasks ??
                data.total_tasks ??
                previous.total_tasks,

              completed_tasks:
                data.completed_tasks ??
                previous.completed_tasks,

              pending_tasks:
                data.pending_tasks ??
                previous.pending_tasks,
            }));

            // -----------------------------------------
            // REFRESH CHART DATA
            // -----------------------------------------

            fetchLeadStatus();
            fetchTaskStatus();
          } catch (error) {
            console.error(
              "Dashboard WebSocket data error:",
              error
            );
          }
        };

        // =============================================
        // ERROR
        // =============================================

        ws.onerror = (error) => {
          console.error(
            "Dashboard WebSocket error:",
            error
          );

          setIsLive(false);
        };

        // =============================================
        // CLOSED
        // =============================================

        ws.onclose = () => {
          console.log(
            "Dashboard WebSocket disconnected"
          );

          setIsLive(false);

          if (stopped) return;

          const delay = Math.min(
            1000 * 2 ** reconnectAttempts,
            10000
          );

          reconnectAttempts++;

          reconnectTimer = setTimeout(() => {
            connect();
          }, delay);
        };
      } catch (error) {
        console.error(
          "Unable to create Dashboard WebSocket:",
          error
        );

        setIsLive(false);
      }
    };

    connect();

    // ===============================================
    // CLEANUP
    // ===============================================

    return () => {
      stopped = true;

      clearTimeout(reconnectTimer);

      if (ws) {
        ws.close();
      }
    };
  }, []);

  // =====================================================
  // FORMATTED REVENUE
  // =====================================================

  const formattedRevenue =
    `₹${Number(
      liveData.revenue || 0
    ).toLocaleString("en-IN")}`;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Layout>
      <PageWrapper>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row justify-between gap-5 mb-8">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Dashboard
              </h1>

              {/* LIVE INDICATOR */}

              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  isLive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >

                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />

                {isLive ? "LIVE" : "OFFLINE"}

              </div>

            </div>

            <p className="text-gray-400 mt-2">

              Welcome back,{" "}

              <span className="text-white font-semibold">

                {user?.full_name || "User"}

              </span>

              {" "}👋

            </p>

          </div>

          {/* CLOCK */}

          <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl">

            <p className="text-gray-400 text-xs">

              {time.toLocaleDateString(
                "en-IN",
                {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}

            </p>

            <p className="text-white font-bold text-lg">

              {time.toLocaleTimeString()}

            </p>

          </div>

        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 mb-8 shadow-xl">

          <div className="flex flex-col lg:flex-row justify-between gap-6">

            <div>

              <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                Trishul CRM
              </p>

              <h2 className="text-2xl lg:text-3xl font-bold text-white mt-2">
                User Performance Dashboard
              </h2>

              <p className="text-gray-400 mt-2 max-w-2xl">
                Track leads, customers, revenue, tasks
                and sales performance in real time.
              </p>

            </div>

            <div className="flex items-center">

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-5 py-4">

                <p className="text-gray-400 text-sm">
                  Live Revenue
                </p>

                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {formattedRevenue}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            MAIN STATS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <StatCard
            title="Total Leads"
            value={
              liveData.leads ??
              stats.total_leads
            }
            color="bg-blue-600"
          />

          <StatCard
            title="Customers"
            value={
              liveData.customers ??
              stats.total_customers
            }
            color="bg-green-600"
          />

          <StatCard
            title="Revenue"
            value={formattedRevenue}
            color="bg-pink-600"
          />

          <StatCard
            title="Conversion"
            value={`${liveData.conversion || 0}%`}
            color="bg-indigo-600"
          />

          <StatCard
            title="Tasks"
            value={
              liveData.tasks ??
              stats.total_tasks
            }
            color="bg-orange-500"
          />

          <StatCard
            title="Pending Tasks"
            value={
              liveData.pending_tasks ??
              stats.pending_tasks
            }
            color="bg-purple-600"
          />

          <StatCard
            title="Completed"
            value={
              liveData.completed_tasks ??
              stats.completed_tasks
            }
            color="bg-emerald-600"
          />

          <StatCard
            title="Employees"
            value={liveData.employees}
            color="bg-cyan-600"
          />

        </div>

        {/* =================================================
            CHARTS
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

          {/* LEAD CHART */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">

            <div className="flex justify-between items-center mb-5">

              <div>

                <h2 className="text-lg font-bold text-white">
                  Lead Performance
                </h2>

                <p className="text-gray-500 text-xs mt-1">
                  Live lead status distribution
                </p>

              </div>

              <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full">
                LIVE
              </span>

            </div>

            <LeadChart data={leadStatus} />

          </div>

          {/* TASK CHART */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">

            <div className="flex justify-between items-center mb-5">

              <div>

                <h2 className="text-lg font-bold text-white">
                  Task Performance
                </h2>

                <p className="text-gray-500 text-xs mt-1">
                  Current task status
                </p>

              </div>

              <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">
                LIVE
              </span>

            </div>

            <TaskChart data={taskStatus} />

          </div>

        </div>

        {/* =================================================
            LATEST CUSTOMERS
        ================================================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8 shadow-lg">

          <div className="flex justify-between items-center mb-5">

            <div>

              <h2 className="text-xl font-bold text-white">
                Latest Customers
              </h2>

              <p className="text-gray-500 text-sm">
                Recently added customer accounts
              </p>

            </div>

            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">
              {liveData.customers || 0} Total
            </span>

          </div>

          {liveData.latest_customers?.length === 0 ? (

            <div className="py-12 text-center">

              <p className="text-gray-500">
                No customers yet.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {liveData.latest_customers.map(
                (customer) => (

                  <div
                    key={customer.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-4"
                  >

                    <div>

                      <p className="text-white font-semibold">
                        {customer.name}
                      </p>

                      <p className="text-gray-500 text-sm">
                        {customer.company || "No company"}
                      </p>

                    </div>

                    <div className="flex items-center gap-4">

                      <span className="text-emerald-400 font-semibold">

                        ₹
                        {Number(
                          customer.revenue || 0
                        ).toLocaleString("en-IN")}

                      </span>

                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">
                        {customer.status}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6 shadow-lg">

          <div className="flex justify-between items-center mb-5">

            <div>

              <h2 className="text-xl font-bold text-white">
                Recent Activity
              </h2>

              <p className="text-gray-500 text-sm">
                Live CRM activity
              </p>

            </div>

            {isLive && (

              <span className="text-xs text-emerald-400">
                ● Live updates
              </span>

            )}

          </div>

          {liveData.recent_activity?.length === 0 ? (

            <p className="text-gray-500 text-sm py-8">
              No recent activity.
            </p>

          ) : (

            <div className="space-y-5">

              {liveData.recent_activity.map(
                (activity, index) => (

                  <div
                    key={`${activity.type}-${index}`}
                    className="flex gap-4"
                  >

                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0">

                      {activity.type === "lead" && "👤"}

                      {activity.type === "customer" && "💰"}

                      {activity.type === "task" && "✓"}

                    </div>

                    <div>

                      <p className="text-gray-200 text-sm">
                        {activity.message}
                      </p>

                      <p className="text-gray-500 text-xs mt-1">

                        {activity.created_at
                          ? new Date(
                              activity.created_at
                            ).toLocaleString()
                          : ""}

                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </PageWrapper>
    </Layout>
  );
}