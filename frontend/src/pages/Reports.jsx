import { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import api from "../api/api";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  return `${protocol}//${base.host}${basePath}/reports/ws?token=${encodeURIComponent(
    localStorage.getItem("token") || ""
  )}`;
};

/* =========================================================
   MONEY FORMAT
========================================================= */

const money = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

/* =========================================================
   REPORTS
========================================================= */

export default function Reports() {
  const [stats, setStats] = useState({
    total_leads: 0,
    total_customers: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
  });

  const [leadStatus, setLeadStatus] = useState([]);
  const [taskStatus, setTaskStatus] = useState([]);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("All Roles");

  const [activeReport, setActiveReport] =
    useState("Employee Leaderboard");

  const [wsConnected, setWsConnected] =
    useState(false);

  /* =====================================================
     FETCH ALL REPORT DATA
  ===================================================== */

  const fetchReports = async () => {
    try {
      const [
        overviewResponse,
        leadStatusResponse,
        taskStatusResponse,
        leadsResponse,
        employeesResponse,
      ] = await Promise.all([
        api.get("/reports/overview"),
        api.get("/reports/lead-status"),
        api.get("/reports/task-status"),
        api.get("/leads/"),
        api.get("/users"),
      ]);

      setStats(
        overviewResponse.data || {}
      );

      setLeadStatus(
        leadStatusResponse.data || []
      );

      setTaskStatus(
        taskStatusResponse.data || []
      );

      setLeads(
        leadsResponse.data || []
      );

      setEmployees(
        employeesResponse.data || []
      );
    } catch (error) {
      console.error(
        "Reports fetch error:",
        error
      );
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchReports();
  }, []);

  /* =====================================================
     LIVE WEBSOCKET
  ===================================================== */

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      try {
        const url = getWebSocketUrl();

        ws = new WebSocket(url);

        ws.onopen = () => {
          console.log(
            "Reports WebSocket connected"
          );

          setWsConnected(true);

          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(
              event.data
            );

            /*
             * Backend sends live dashboard data.
             * Refresh complete report whenever
             * dashboard data changes.
             */

            if (
              data &&
              (
                data.total_leads !== undefined ||
                data.revenue !== undefined ||
                data.employees !== undefined
              )
            ) {
              fetchReports();
            }
          } catch (error) {
            console.error(
              "WebSocket message error:",
              error
            );
          }
        };

        ws.onerror = (error) => {
          console.error(
            "Reports WebSocket error:",
            error
          );
        };

        ws.onclose = () => {
          if (stopped) return;

          setWsConnected(false);

          const delay = Math.min(
            1000 *
              2 ** reconnectAttempts,
            10000
          );

          reconnectAttempts++;

          reconnectTimer =
            setTimeout(
              connect,
              delay
            );
        };
      } catch (error) {
        console.error(
          "WebSocket connection error:",
          error
        );

        reconnectTimer =
          setTimeout(
            connect,
            3000
          );
      }
    };

    connect();

    return () => {
      stopped = true;

      clearTimeout(
        reconnectTimer
      );

      if (ws) {
        ws.close();
      }
    };
  }, []);

  /* =====================================================
     CALCULATED REPORT METRICS
  ===================================================== */

  const pipelineValue = useMemo(() => {
    return leads.reduce(
      (total, lead) =>
        total +
        Number(lead.value || 0),
      0
    );
  }, [leads]);

  const activeLeads = useMemo(() => {
    return leads.filter(
      (lead) =>
        ![
          "Lost",
          "Booked",
          "Converted",
        ].includes(
          lead.status
        )
    ).length;
  }, [leads]);

  const wonRevenue = useMemo(() => {
    return leads
      .filter(
        (lead) =>
          lead.status === "Booked" ||
          lead.status === "Converted"
      )
      .reduce(
        (total, lead) =>
          total +
          Number(
            lead.value || 0
          ),
        0
      );
  }, [leads]);

  const conversionRate =
    stats.total_leads > 0
      ? Math.round(
          (stats.total_customers /
            stats.total_leads) *
            100
        )
      : 0;

  const taskFulfillment =
    stats.total_tasks > 0
      ? Math.round(
          (stats.completed_tasks /
            stats.total_tasks) *
            100
        )
      : 0;

  /* =====================================================
     EMPLOYEE PERFORMANCE
  ===================================================== */

  const employeePerformance =
    useMemo(() => {
      return employees
        .map((employee) => {
          const employeeLeads =
            leads.filter(
              (lead) =>
                Number(
                  lead.assigned_to
                ) ===
                Number(
                  employee.id
                )
            );

          const closedLeads =
            employeeLeads.filter(
              (lead) =>
                lead.status ===
                  "Booked" ||
                lead.status ===
                  "Converted"
            );

          const closedValue =
            closedLeads.reduce(
              (sum, lead) =>
                sum +
                Number(
                  lead.value || 0
                ),
              0
            );

          return {
            ...employee,

            totalLeads:
              employeeLeads.length,

            closedDeals:
              closedLeads.length,

            closedValue,

            conversion:
              employeeLeads.length >
              0
                ? Math.round(
                    (closedLeads.length /
                      employeeLeads.length) *
                      100
                  )
                : 0,
          };
        })
        .sort(
          (a, b) =>
            b.closedValue -
            a.closedValue
        );
    }, [
      employees,
      leads,
    ]);

  /* =====================================================
     FILTER EMPLOYEES
  ===================================================== */

  const filteredEmployees =
    employeePerformance.filter(
      (employee) => {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        const employeeName =
          employee.full_name ||
          employee.name ||
          "";

        const employeeEmail =
          employee.email || "";

        const employeeRole =
          employee.role || "";

        const matchesSearch =
          !searchValue ||
          employeeName
            .toLowerCase()
            .includes(
              searchValue
            ) ||
          employeeEmail
            .toLowerCase()
            .includes(
              searchValue
            );

        const matchesRole =
          roleFilter ===
            "All Roles" ||
          employeeRole
            .toLowerCase() ===
            roleFilter.toLowerCase();

        return (
          matchesSearch &&
          matchesRole
        );
      }
    );

  const topThree =
    employeePerformance.slice(
      0,
      3
    );

  /* =====================================================
     EXPORT PDF
  ===================================================== */

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(
      "TRISHUL CRM - EXECUTIVE REPORT",
      14,
      20
    );

    autoTable(doc, {
      startY: 30,

      head: [
        ["Metric", "Value"],
      ],

      body: [
        [
          "Total Leads",
          stats.total_leads,
        ],

        [
          "Customers",
          stats.total_customers,
        ],

        [
          "Pipeline Value",
          money(
            pipelineValue
          ),
        ],

        [
          "Won Revenue",
          money(
            wonRevenue
          ),
        ],

        [
          "Total Tasks",
          stats.total_tasks,
        ],

        [
          "Completed Tasks",
          stats.completed_tasks,
        ],

        [
          "Pending Tasks",
          stats.pending_tasks,
        ],
      ],
    });

    autoTable(doc, {
      startY:
        doc.lastAutoTable.finalY +
        12,

      head: [
        [
          "Rank",
          "Employee",
          "Role",
          "Closed Deals",
          "Closed Value",
          "Conversion",
        ],
      ],

      body:
        employeePerformance.map(
          (
            employee,
            index
          ) => [
            index + 1,

            employee.full_name ||
              employee.name ||
              "Unknown",

            employee.role,

            employee.closedDeals,

            money(
              employee.closedValue
            ),

            `${employee.conversion}%`,
          ]
        ),
    });

    doc.save(
      "Trishul_CRM_Executive_Report.pdf"
    );
  };

  /* =====================================================
     EXPORT EXCEL
  ===================================================== */

  const exportExcel = () => {
    const workbook =
      XLSX.utils.book_new();

    const overview =
      XLSX.utils.json_to_sheet([
        {
          "Total Leads":
            stats.total_leads,

          Customers:
            stats.total_customers,

          "Pipeline Value":
            pipelineValue,

          "Won Revenue":
            wonRevenue,

          Tasks:
            stats.total_tasks,

          Completed:
            stats.completed_tasks,

          Pending:
            stats.pending_tasks,
        },
      ]);

    const performance =
      XLSX.utils.json_to_sheet(
        employeePerformance.map(
          (
            employee,
            index
          ) => ({
            Rank:
              index + 1,

            Employee:
              employee.full_name ||
              employee.name,

            Role:
              employee.role,

            "Closed Deals":
              employee.closedDeals,

            "Closed Value":
              employee.closedValue,

            Conversion:
              `${employee.conversion}%`,
          })
        )
      );

    const leadSheet =
      XLSX.utils.json_to_sheet(
        leadStatus
      );

    const taskSheet =
      XLSX.utils.json_to_sheet(
        taskStatus
      );

    XLSX.utils.book_append_sheet(
      workbook,
      overview,
      "Overview"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      performance,
      "Employee Performance"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      leadSheet,
      "Lead Status"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      taskSheet,
      "Task Status"
    );

    const buffer =
      XLSX.write(
        workbook,
        {
          bookType: "xlsx",
          type: "array",
        }
      );

    const file =
      new Blob(
        [buffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

    saveAs(
      file,
      "Trishul_CRM_Executive_Report.xlsx"
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <Layout>

      <div className="min-h-screen bg-[#050b1c] text-white px-3 sm:px-5 lg:px-8 py-5">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bg-[#0d162d] border border-slate-800 rounded-3xl p-5 sm:p-7 mb-5 shadow-xl">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 text-xl">
                  ▥
                </div>

                <div>

                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    Real Executive Reports &
                    Analytics
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Real-time insights across live CRM
                    sales pipelines, employee conversion
                    rates & SLA execution.
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                onClick={() =>
                  window.print()
                }
                className="px-4 py-2.5 rounded-xl bg-[#18243d] border border-slate-700 hover:bg-[#202f4c] text-slate-200 text-xs font-bold transition"
              >
                🖨 Print Report
              </button>

              <button
                onClick={exportPDF}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-500/20"
              >
                ↓ Export PDF
              </button>

              <button
                onClick={exportExcel}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                ↓ Export CSV
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

          <MetricCard
            title="TOTAL WON REVENUE"
            value={money(wonRevenue)}
            sub={`${stats.total_customers} Customers`}
            icon="₹"
            valueClass="text-emerald-400"
          />

          <MetricCard
            title="PIPELINE PORTFOLIO"
            value={money(pipelineValue)}
            sub={`${activeLeads} Active Leads`}
            icon="↗"
            valueClass="text-cyan-400"
          />

          <MetricCard
            title="ACCOUNTS BASE"
            value={stats.total_customers}
            sub={`${conversionRate}% Conversion`}
            icon="♙"
            valueClass="text-white"
          />

          <MetricCard
            title="TASK FULFILLMENT"
            value={`${taskFulfillment}%`}
            sub={`${stats.completed_tasks}/${stats.total_tasks} SLA Done`}
            icon="✓"
            valueClass="text-blue-400"
          />

        </div>

        {/* =================================================
            ANALYTICS CARDS
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

          {/* CUSTOMER */}

          <AnalyticsCard
            title="CUSTOMER TIERING"
            value={`${stats.total_customers} Accounts`}
            description="Active, VIP, and inactive account distribution"
            icon="♧"
          >

            <ProgressRow
              label="ACTIVE Accounts"
              value={
                stats.total_customers
              }
              total={
                stats.total_customers
              }
              valueColor="text-emerald-400"
            />

            <ProgressRow
              label="VIP Tier"
              value={0}
              total={
                stats.total_customers
              }
              valueColor="text-amber-400"
            />

            <ProgressRow
              label="Inactive"
              value={0}
              total={
                stats.total_customers
              }
              valueColor="text-slate-300"
            />

          </AnalyticsCard>

          {/* LEADS */}

          <AnalyticsCard
            title="LEAD CHANNELS"
            value={`${stats.total_leads} Inquiries`}
            description="Multi-channel marketing source attribution"
            icon="⌕"
          >

            {leadStatus.length >
            0 ? (
              leadStatus.map(
                (item) => (
                  <DarkLeadRow
                    key={
                      item.status
                    }
                    status={
                      item.status
                    }
                    count={
                      item.count
                    }
                    total={
                      stats.total_leads
                    }
                  />
                )
              )
            ) : (
              <p className="text-xs text-slate-500 py-5">
                No lead data available
              </p>
            )}

          </AnalyticsCard>

          {/* TASK */}

          <AnalyticsCard
            title="TASK VELOCITY"
            value={`${stats.completed_tasks} Executed`}
            description="On-time task fulfillment metrics"
            icon="✓"
          >

            <div className="flex items-center justify-center py-3">

              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#06b6d4 ${taskFulfillment * 3.6}deg, #f59e0b ${taskFulfillment * 3.6}deg, #18243d ${taskFulfillment * 3.6 + 12}deg, #18243d 360deg)`,
                }}
              >

                <div className="w-20 h-20 rounded-full bg-[#101a31] flex items-center justify-center">

                  <span className="text-xl font-bold text-white">
                    {taskFulfillment}%
                  </span>

                </div>

              </div>

            </div>

            <p className="text-center text-[10px] text-slate-500">
              SLA Compliance Rate
            </p>

          </AnalyticsCard>

        </div>

        {/* =================================================
            REPORT TABS
        ================================================= */}

        <div className="bg-[#0d162d] border border-slate-800 rounded-2xl p-3 mb-5 shadow-lg">

          <div className="flex flex-wrap gap-2">

            {[
              "Employee Leaderboard",
              "Sales Pipeline Report",
              "Employee Performance",
              "Client Accounts",
              "Task Fulfillment",
            ].map(
              (tab) => (

                <button
                  key={tab}
                  onClick={() =>
                    setActiveReport(
                      tab
                    )
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeReport ===
                    tab
                      ? "bg-orange-400 text-white shadow-lg shadow-orange-400/20"
                      : "bg-[#18243d] text-slate-400 hover:text-white hover:bg-[#22304d]"
                  }`}
                >
                  {tab}
                </button>

              )
            )}

          </div>

        </div>

        {/* =================================================
            EMPLOYEE LEADERBOARD
        ================================================= */}

        {activeReport ===
          "Employee Leaderboard" && (
          <>

            {/* DARK BENCHMARK */}

            <div className="bg-[#0d1938] border border-slate-800 rounded-3xl p-5 sm:p-6 mb-5 shadow-2xl">

              <div className="mb-5">

                <div className="flex items-center gap-2">

                  <span className="text-amber-400 text-xl">
                    🏆
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
                    Performance Benchmark
                  </span>

                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Employee Performance
                  Leaderboard
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Rankings of all team members based on
                  total closed value generated and deal
                  conversion effectiveness.
                </p>

              </div>

              {/* SEARCH */}

              <div className="flex flex-col md:flex-row gap-3 mb-6">

                <div className="relative flex-1">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ⌕
                  </span>

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search performer..."
                    className="w-full bg-[#182644] border border-slate-700 rounded-xl px-9 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                  />

                </div>

                <div className="flex bg-[#182644] rounded-xl p-1 border border-slate-700 overflow-x-auto">

                  {[
                    "All Roles",
                    "User",
                    "Supervisor",
                    "Admin",
                  ].map(
                    (role) => (

                      <button
                        key={role}
                        onClick={() =>
                          setRoleFilter(
                            role
                          )
                        }
                        className={`px-3 py-2 rounded-lg text-[9px] font-bold whitespace-nowrap transition ${
                          roleFilter ===
                          role
                            ? "bg-cyan-400 text-[#0d1938]"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {role.toUpperCase()}
                      </button>

                    )
                  )}

                </div>

              </div>

              {/* TOP THREE */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {topThree.map(
                  (
                    employee,
                    index
                  ) => (

                    <TopPerformer
                      key={
                        employee.id
                      }
                      employee={
                        employee
                      }
                      rank={
                        index + 1
                      }
                    />

                  )
                )}

                {topThree.length ===
                  0 && (

                  <div className="md:col-span-3 text-center py-10 text-slate-500 text-sm">
                    No employee performance data
                    available.
                  </div>

                )}

              </div>

            </div>

            {/* FULL RANKING */}

            <div className="bg-[#0d162d] border border-slate-800 rounded-3xl p-5 shadow-xl">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h3 className="font-bold text-white">
                    ♙ Full Employee Performance
                    Ranking
                  </h3>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Ranked in descending order by total
                    closed lead value.
                  </p>

                </div>

                <span className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 px-3 py-1.5 rounded-full text-[10px] font-bold">
                  {
                    employeePerformance.length
                  }{" "}
                  Performers
                </span>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>

                    <tr className="text-left text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800">

                      <th className="p-3">
                        Rank
                      </th>

                      <th className="p-3">
                        Employee Name
                      </th>

                      <th className="p-3">
                        Role
                      </th>

                      <th className="p-3">
                        Closed Deals
                      </th>

                      <th className="p-3">
                        Total Closed Lead Value
                      </th>

                      <th className="p-3">
                        Net Profit
                      </th>

                      <th className="p-3">
                        Conversion
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredEmployees.map(
                      (
                        employee,
                        index
                      ) => (

                        <tr
                          key={
                            employee.id
                          }
                          className="border-b border-slate-800 hover:bg-[#121f39] transition"
                        >

                          <td className="p-3">

                            <span className="w-7 h-7 rounded-full bg-[#18243d] border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              #
                              {index +
                                1}
                            </span>

                          </td>

                          <td className="p-3">

                            <div>

                              <p className="text-xs font-bold text-white">
                                {employee.full_name ||
                                  employee.name ||
                                  "Unknown"}
                              </p>

                              <p className="text-[9px] text-slate-500">
                                {
                                  employee.email
                                }
                              </p>

                            </div>

                          </td>

                          <td className="p-3">

                            <span className="px-2 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[8px] font-bold uppercase">
                              {
                                employee.role
                              }
                            </span>

                          </td>

                          <td className="p-3">

                            <p className="text-xs font-bold text-white">
                              {
                                employee.closedDeals
                              }{" "}
                              Won
                            </p>

                            <p className="text-[9px] text-slate-500">
                              {
                                employee.totalLeads
                              }{" "}
                              Leads
                            </p>

                          </td>

                          <td className="p-3">

                            <p className="text-sm font-bold text-emerald-400">
                              {money(
                                employee.closedValue
                              )}
                            </p>

                            <p className="text-[9px] text-slate-500">
                              Gross Won Revenue
                            </p>

                          </td>

                          <td className="p-3">

                            <span className="text-xs font-bold text-cyan-400">
                              {money(
                                employee.closedValue
                              )}
                            </span>

                          </td>

                          <td className="p-3">

                            <div className="flex items-center gap-2">

                              <div className="w-16 h-1.5 rounded-full bg-[#18243d] overflow-hidden">

                                <div
                                  className="h-full bg-cyan-400 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      employee.conversion,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>

                              <span className="text-[9px] text-slate-400">
                                {
                                  employee.conversion
                                }
                                %
                              </span>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </>
        )}

        {/* =================================================
            SALES PIPELINE
        ================================================= */}

        {activeReport ===
          "Sales Pipeline Report" && (

          <ReportPanel title="Sales Pipeline Report">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {leadStatus.map(
                (item) => (

                  <div
                    key={
                      item.status
                    }
                    className="bg-[#111c34] border border-slate-800 rounded-2xl p-5 hover:border-cyan-400/30 transition"
                  >

                    <p className="text-[10px] uppercase font-bold text-slate-500">
                      {
                        item.status
                      }
                    </p>

                    <p className="text-3xl font-bold text-white mt-2">
                      {
                        item.count
                      }
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Leads
                    </p>

                  </div>

                )
              )}

            </div>

          </ReportPanel>

        )}

        {/* =================================================
            EMPLOYEE PERFORMANCE
        ================================================= */}

        {activeReport ===
          "Employee Performance" && (

          <ReportPanel title="Employee Performance">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {employeePerformance.map(
                (employee) => (

                  <div
                    key={
                      employee.id
                    }
                    className="bg-[#111c34] border border-slate-800 rounded-2xl p-5 hover:border-cyan-400/30 transition"
                  >

                    <h3 className="font-bold text-white">
                      {
                        employee.full_name ||
                        employee.name
                      }
                    </h3>

                    <p className="text-[10px] text-slate-500 uppercase mt-1">
                      {
                        employee.role
                      }
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-5">

                      <MiniMetric
                        label="Leads"
                        value={
                          employee.totalLeads
                        }
                      />

                      <MiniMetric
                        label="Won"
                        value={
                          employee.closedDeals
                        }
                      />

                      <MiniMetric
                        label="Value"
                        value={money(
                          employee.closedValue
                        )}
                      />

                      <MiniMetric
                        label="Conversion"
                        value={`${employee.conversion}%`}
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          </ReportPanel>

        )}

        {/* =================================================
            CLIENT ACCOUNTS
        ================================================= */}

        {activeReport ===
          "Client Accounts" && (

          <ReportPanel title="Client Accounts">

            <div className="text-center py-14">

              <p className="text-5xl font-bold text-white">
                {
                  stats.total_customers
                }
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Total CRM Customer Accounts
              </p>

            </div>

          </ReportPanel>

        )}

        {/* =================================================
            TASK FULFILLMENT
        ================================================= */}

        {activeReport ===
          "Task Fulfillment" && (

          <ReportPanel title="Task Fulfillment">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <MiniMetric
                label="Total Tasks"
                value={
                  stats.total_tasks
                }
              />

              <MiniMetric
                label="Completed"
                value={
                  stats.completed_tasks
                }
              />

              <MiniMetric
                label="Pending"
                value={
                  stats.pending_tasks
                }
              />

            </div>

          </ReportPanel>

        )}

        {/* =================================================
            LIVE STATUS
        ================================================= */}

        <div className="flex justify-end mt-4">

          <div className="flex items-center gap-2 text-[10px] text-slate-500">

            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected
                  ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                  : "bg-rose-400"
              }`}
            />

            {wsConnected
              ? "Live reports connected"
              : "Reconnecting..."}

          </div>

        </div>

      </div>

    </Layout>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  sub,
  icon,
  valueClass,
}) {
  return (
    <div className="bg-[#0d162d] border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
            {title}
          </p>

          <p
            className={`text-2xl font-bold mt-2 ${valueClass}`}
          >
            {value}
          </p>

        </div>

        <span className="text-xs font-bold text-slate-500">
          {icon}
        </span>

      </div>

      <p className="text-[10px] text-slate-500 mt-2">
        {sub}
      </p>

    </div>
  );
}

/* =========================================================
   ANALYTICS CARD
========================================================= */

function AnalyticsCard({
  title,
  value,
  description,
  icon,
  children,
}) {
  return (
    <div className="bg-[#0d162d] border border-slate-800 rounded-3xl p-5 shadow-lg min-h-[270px]">

      <div className="flex justify-between">

        <div>

          <p className="text-[9px] uppercase font-bold text-slate-500">
            {title}
          </p>

          <p className="text-xl font-bold text-white mt-2">
            {value}
          </p>

        </div>

        <span className="text-cyan-400 text-xl">
          {icon}
        </span>

      </div>

      <p className="text-[10px] text-slate-500 mt-1">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>

    </div>
  );
}

/* =========================================================
   PROGRESS ROW
========================================================= */

function ProgressRow({
  label,
  value,
  total,
  valueColor = "text-white",
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div className="mb-4">

      <div className="flex justify-between mb-1">

        <span className="text-[9px] text-slate-500">
          {label}
        </span>

        <span
          className={`text-[9px] font-bold ${valueColor}`}
        >
          {value}
        </span>

      </div>

      <div className="h-1.5 bg-[#18243d] rounded-full overflow-hidden">

        <div
          className="h-full bg-cyan-400 rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   DARK LEAD ROW
========================================================= */

function DarkLeadRow({
  status,
  count,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (count / total) * 100
        )
      : 0;

  return (
    <div className="mb-3">

      <div className="flex items-center justify-between bg-[#18243d] rounded-xl px-3 py-2.5">

        <div className="flex items-center gap-2">

          <span className="w-2 h-2 rounded-full bg-cyan-400" />

          <span className="text-[10px] font-bold text-white">
            {status}
          </span>

        </div>

        <span className="text-[10px] font-bold text-cyan-400">
          {count} leads
        </span>

      </div>

      <div className="h-1 bg-[#18243d] rounded-full mt-1 overflow-hidden">

        <div
          className="h-full bg-cyan-400 rounded-full"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   TOP PERFORMER
========================================================= */

function TopPerformer({
  employee,
  rank,
}) {
  const rankText =
    rank === 1
      ? "RANK #1 • TOP PERFORMER"
      : rank === 2
      ? "RANK #2 • SILVER"
      : "RANK #3 • BRONZE";

  const name =
    employee.full_name ||
    employee.name ||
    "Unknown";

  return (
    <div
      className={`rounded-2xl p-4 border transition ${
        rank === 1
          ? "border-amber-400 bg-[#192847] shadow-lg shadow-amber-400/10"
          : "border-slate-700 bg-[#152441]"
      }`}
    >

      <div className="flex justify-between">

        <span
          className={`text-[8px] font-bold px-2 py-1 rounded ${
            rank === 1
              ? "bg-amber-500/20 text-amber-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {rankText}
        </span>

        <span className="text-amber-400">
          {rank === 1
            ? "🏆"
            : rank === 2
            ? "♢"
            : "♧"}
        </span>

      </div>

      <div className="flex items-center gap-3 mt-6">

        <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold">
          {name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>

          <p className="text-sm font-bold text-white">
            {name}
          </p>

          <p className="text-[9px] text-slate-400 uppercase">
            {employee.role} •{" "}
            {employee.closedDeals}{" "}
            Deals Won
          </p>

        </div>

      </div>

      <div className="mt-6">

        <p
          className={`text-xl font-bold ${
            rank === 1
              ? "text-amber-300"
              : "text-white"
          }`}
        >
          {money(
            employee.closedValue
          )}
        </p>

        <p className="text-[9px] text-slate-400 mt-1">
          Total Closed Lead Value
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   REPORT PANEL
========================================================= */

function ReportPanel({
  title,
  children,
}) {
  return (
    <div className="bg-[#0d162d] border border-slate-800 rounded-3xl p-5 shadow-xl">

      <h2 className="text-lg font-bold text-white mb-5">
        {title}
      </h2>

      {children}

    </div>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
}) {
  return (
    <div className="bg-[#18243d] border border-slate-700 rounded-xl p-4">

      <p className="text-[9px] uppercase font-bold text-slate-500">
        {label}
      </p>

      <p className="text-lg font-bold text-white mt-1">
        {value}
      </p>

    </div>
  );
}