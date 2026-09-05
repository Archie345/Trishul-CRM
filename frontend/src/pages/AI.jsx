import Layout from "../components/layout/Layout";
import { useEffect, useRef, useState } from "react";
import api from "../api/api";

export default function AI() {
  // =====================================================
  // STATE
  // =====================================================

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  const [context, setContext] = useState({
    employees: 0,
    leads: 0,
    customers: 0,
    tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    pipeline_value: 0,
    won_revenue: 0,
    inactive_clients: 0,
    latest_customers: [],
    recent_activity: [],
  });

  const [activeWorkflow, setActiveWorkflow] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const bottomRef = useRef(null);

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return `₹${number.toLocaleString("en-IN")}`;
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return "Just now";

    try {
      return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Just now";
    }
  };

  // =====================================================
  // NORMALIZE CONTEXT
  // =====================================================

  const normalizeContext = (data = {}) => {
    return {
      employees: data.employees ?? 0,

      leads:
        data.leads ??
        data.total_leads ??
        0,

      customers:
        data.customers ??
        data.total_customers ??
        0,

      tasks:
        data.tasks ??
        data.total_tasks ??
        0,

      completed_tasks:
        data.completed_tasks ??
        0,

      pending_tasks:
        data.pending_tasks ??
        0,

      pipeline_value:
        data.pipeline_value ??
        data.pipeline ??
        0,

      won_revenue:
        data.won_revenue ??
        data.revenue ??
        0,

      inactive_clients:
        data.inactive_clients ??
        0,

      latest_customers:
        Array.isArray(data.latest_customers)
          ? data.latest_customers
          : [],

      recent_activity:
        Array.isArray(data.recent_activity)
          ? data.recent_activity
          : [],
    };
  };

  // =====================================================
  // LOAD LIVE CRM CONTEXT
  // =====================================================

  const loadContext = async () => {
    try {
      const result = await api.get("/ai/dashboard-context");

      const data = normalizeContext(result.data);

      setContext(data);

      setError("");
    } catch (err) {
      console.error(
        "AI context error:",
        err.response?.data || err.message
      );
    }
  };

  // =====================================================
  // WEBSOCKET
  // =====================================================

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLive(false);
      return;
    }

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        "http://127.0.0.1:8000";

      const wsBaseUrl = apiUrl
        .replace(/^http:/, "ws:")
        .replace(/^https:/, "wss:")
        .replace(/\/$/, "");

      const wsUrl =
        `${wsBaseUrl}/ai/ws?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);

      wsRef.current = ws;

      ws.onopen = () => {
        console.log("AI WebSocket connected");
        setLive(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "crm_context") {
            setContext((previous) => ({
              ...previous,
              ...normalizeContext(data.data),
            }));
          }

          if (data.type === "crm_update") {
            loadContext();
          }
        } catch (err) {
          console.error("AI WS message error:", err);
        }
      };

      ws.onerror = () => {
        setLive(false);
      };

      ws.onclose = () => {
        console.log("AI WebSocket disconnected");

        setLive(false);

        reconnectTimer.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (err) {
      console.error("AI WebSocket error:", err);
      setLive(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadContext();
    connectWebSocket();

    // Fallback refresh.
    // Even if WebSocket is temporarily unavailable,
    // CRM data stays fresh.
    const interval = setInterval(() => {
      loadContext();
    }, 5000);

    return () => {
      clearInterval(interval);

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // =====================================================
  // SCROLL CHAT
  // =====================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // =====================================================
  // ADD MESSAGE
  // =====================================================

  const addMessage = (message) => {
    setMessages((previous) => [
      ...previous,
      message,
    ]);
  };

  // =====================================================
  // ASK GENERAL AI
  // =====================================================

  const askAI = async (customQuestion = null) => {
    const text = (
      customQuestion !== null
        ? customQuestion
        : question
    ).trim();

    if (!text) return;

    setQuestion("");
    setError("");
    setLoading(true);

    addMessage({
      id: Date.now(),
      role: "user",
      text,
      created_at: new Date().toISOString(),
    });

    try {
      const result = await api.post(
        "/ai/chat",
        {
          question: text,
        }
      );

      addMessage({
        id: Date.now() + 1,
        role: "assistant",
        text:
          result.data?.answer ||
          "I could not generate a response.",
        created_at: new Date().toISOString(),
      });

      if (result.data?.context) {
        setContext((previous) => ({
          ...previous,
          ...normalizeContext(result.data.context),
        }));
      }
    } catch (err) {
      console.error("AI error:", err);

      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to get AI response.";

      setError(message);

      addMessage({
        id: Date.now() + 1,
        role: "assistant",
        text:
          "Sorry, I was unable to process that request.",
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // WORKFLOW
  // =====================================================

  const runWorkflow = async (workflow) => {
    setActiveWorkflow(workflow.id);

    await askAI(workflow.prompt);

    setActiveWorkflow(null);
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetChat = () => {
    setMessages([]);
    setQuestion("");
    setError("");
  };

  // =====================================================
  // COPY
  // =====================================================

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  // =====================================================
  // READ ALOUD
  // =====================================================

  const readAloud = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.rate = 0.95;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  // =====================================================
  // WORKFLOWS
  // =====================================================

  const workflows = [
    {
      id: "summary",
      icon: "↗",
      title: "Executive Daily Summary",
      description:
        "Full breakdown of active pipeline, won deals & task fulfilment.",
      prompt:
        "Give me an executive daily summary of the CRM. Include pipeline value, won revenue, active leads, customers, pending tasks, completed tasks, employees and important recent activity.",
    },
    {
      id: "followup",
      icon: "✉",
      title: "Draft Lead Follow-up Email",
      description:
        "Personalized sales email for highest-value open leads.",
      prompt:
        "Identify the most important open leads from the CRM context and draft a personalized professional follow-up email strategy for them.",
    },
    {
      id: "proposal",
      icon: "▤",
      title: "Enterprise Business Proposal",
      description:
        "Complete CRM solution quote & timeline for target client.",
      prompt:
        "Based on the current CRM pipeline, suggest how I should prepare an enterprise business proposal for the highest-value opportunity.",
    },
    {
      id: "winback",
      icon: "△",
      title: "Inactive Win-Back Campaign",
      description:
        "Targeted re-engagement campaign for dormant client accounts.",
      prompt:
        "Create a practical win-back campaign strategy for inactive CRM customers. Include messaging, timing and follow-up steps.",
    },
    {
      id: "audit",
      icon: "♙",
      title: "Sales Agent Audit",
      description:
        "Leaderboard of employee conversion rates & generated revenue.",
      prompt:
        "Give me a sales agent performance audit using the CRM data available. Explain what metrics should be reviewed and identify areas needing attention.",
    },
  ];

  // =====================================================
  // SHORTCUTS
  // =====================================================

  const shortcuts = [
    {
      label: "⚡ Lead & Task SLAs",
      prompt:
        "Analyze the CRM task and lead workload. Tell me which SLA items require immediate attention.",
    },
    {
      label: "◉ Commission Tiers",
      prompt:
        "Explain the commission tiers I should consider based on the current CRM sales performance.",
    },
    {
      label: "🚨 Escalation Rules",
      prompt:
        "Identify situations in the current CRM that should be escalated and suggest escalation rules.",
    },
    {
      label: "🎯 Lead Scoring Rules",
      prompt:
        "Create practical lead scoring rules using the CRM data and explain which leads should receive the highest scores.",
    },
    {
      label: "▣ Support & Policies",
      prompt:
        "Give me a concise overview of CRM support and sales policies that should be followed.",
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Layout>
      <div className="min-h-screen bg-[#05091a] text-white p-3 sm:p-5">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="rounded-2xl border border-slate-700/70 bg-gradient-to-r from-[#14223d] via-[#10233d] to-[#092d3c] p-5 shadow-xl">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div className="flex items-start gap-4">

              <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-2xl">
                🤖
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">

                  <h1 className="text-xl sm:text-2xl font-bold">
                    Trishul AI Assistant
                  </h1>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-semibold">
                    ⚡ TRISHUL CRM AI INTELLIGENCE
                  </span>

                </div>

                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
                  Live enterprise AI grounded on your real CRM
                  leads, accounts, team performance, and SLA
                  tasks with automated follow-ups, proposal
                  drafting, and intelligence.
                </p>
              </div>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  window.print()
                }
                className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800/70 hover:bg-slate-700 text-xs"
              >
                ⇩ Export
              </button>

              <button
                onClick={resetChat}
                className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs"
              >
                🗑 Reset
              </button>

            </div>

          </div>
        </div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-4">

          {/* Pipeline */}
          <div className="rounded-xl border border-slate-700 bg-[#111a30] p-4">

            <div className="flex justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">
                Pipeline Value
              </span>

              <span className="text-cyan-400">
                ↗
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold mt-2">
              {formatMoney(context.pipeline_value)}
            </div>

            <button
              onClick={() =>
                askAI(
                  "Analyze the current sales pipeline and tell me the most important opportunities."
                )
              }
              className="text-[10px] text-cyan-400 mt-1"
            >
              Ask Assistant →
            </button>

          </div>

          {/* Won Revenue */}
          <div className="rounded-xl border border-slate-700 bg-[#111a30] p-4">

            <div className="flex justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">
                Won Revenue
              </span>

              <span className="text-emerald-400">
                ♧
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2">
              {formatMoney(context.won_revenue)}
            </div>

            <button
              onClick={() =>
                askAI(
                  "Analyze won revenue and tell me what is driving the current performance."
                )
              }
              className="text-[10px] text-emerald-400 mt-1"
            >
              Won Deals Review →
            </button>

          </div>

          {/* Inactive */}
          <div className="rounded-xl border border-slate-700 bg-[#111a30] p-4">

            <div className="flex justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">
                Inactive Clients
              </span>

              <span className="text-amber-400">
                ⚠
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-2">
              {context.inactive_clients} Dormant
            </div>

            <button
              onClick={() =>
                askAI(
                  "Create a win-back strategy for inactive clients."
                )
              }
              className="text-[10px] text-amber-400 mt-1"
            >
              Draft Win-Back Email →
            </button>

          </div>

          {/* SLA */}
          <div className="rounded-xl border border-slate-700 bg-[#111a30] p-4">

            <div className="flex justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">
                SLA Pending
              </span>

              <span className="text-blue-400">
                ✓
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold mt-2">
              {context.pending_tasks} Open Tasks
            </div>

            <button
              onClick={() =>
                askAI(
                  "Analyze pending tasks and tell me which ones need immediate attention."
                )
              }
              className="text-[10px] text-blue-400 mt-1"
            >
              Audit SLA Queue →
            </button>

          </div>

        </div>

        {/* =================================================
            RULE BASED ENGINE
        ================================================= */}

        <div className="mt-4 rounded-xl border border-amber-600/40 bg-[#211817] p-4">

          <div className="text-xs font-bold text-amber-400 mb-3">
            ⚡ RULE-BASED ENGINE SHORTCUTS:
          </div>

          <div className="flex flex-wrap gap-2">

            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                onClick={() =>
                  askAI(shortcut.prompt)
                }
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20 transition"
              >
                {shortcut.label}
              </button>
            ))}

          </div>

        </div>

        {/* =================================================
            ACTION WORKFLOWS
        ================================================= */}

        <div className="mt-4 rounded-2xl border border-slate-700 bg-[#10182c] p-4">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-sm font-bold">
              ⚡ ACTION WORKFLOWS
            </h2>

            <span className="text-[9px] text-slate-500">
              {workflows.length} Templates
            </span>

          </div>

          <div className="flex gap-2 mb-3">

            <span className="px-3 py-1 rounded-full bg-cyan-500 text-white text-[9px]">
              ALL
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[9px]">
              SALES
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[9px]">
              EMAIL
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[9px]">
              AUDIT
            </span>

          </div>

          <div className="space-y-2">

            {workflows.map((workflow) => (

              <button
                key={workflow.id}
                onClick={() =>
                  runWorkflow(workflow)
                }
                disabled={activeWorkflow === workflow.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1b2942] border border-slate-700 hover:border-cyan-500/50 hover:bg-[#20314d] transition text-left"
              >

                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  {workflow.icon}
                </div>

                <div className="flex-1">

                  <div className="text-xs font-semibold">
                    {workflow.title}
                  </div>

                  <div className="text-[9px] text-slate-400 mt-1">
                    {workflow.description}
                  </div>

                </div>

                <div className="text-slate-400">
                  {activeWorkflow === workflow.id
                    ? "..."
                    : "→"}
                </div>

              </button>

            ))}

          </div>

        </div>

        {/* =================================================
            AI CHAT
        ================================================= */}

        <div className="mt-4 rounded-2xl border border-slate-700 bg-[#10182c] overflow-hidden">

          {/* Chat Header */}

          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

              <span className="text-xs font-semibold">
                Interactive AI Session
              </span>

            </div>

            <div className="text-[9px] text-emerald-400">
              ⚡ {live ? "Live Context Synced" : "Syncing CRM Context"}
            </div>

          </div>

          {/* Initial AI Message */}

          <div className="p-4">

            {messages.length === 0 && (

              <div className="flex gap-3">

                <div className="w-9 h-9 shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                  🤖
                </div>

                <div className="flex-1 rounded-xl bg-[#1a2941] border border-slate-700 p-4">

                  <div className="text-xs font-semibold text-cyan-300 mb-2">
                    👑 Trishul AI Executive Intelligence Synchronized
                  </div>

                  <p className="text-xs text-slate-300 leading-6">
                    Welcome Admin! I am connected live to your
                    <b className="text-white">
                      {" "}Trishul CRM
                    </b>{" "}
                    instance.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-slate-300">

                    <div>
                      Client Base:{" "}
                      <b>{context.customers}</b>{" "}
                      Accounts
                    </div>

                    <div>
                      Live Pipeline:{" "}
                      <b>
                        {context.leads}
                      </b>{" "}
                      Leads
                    </div>

                    <div>
                      Active Agents:{" "}
                      <b>
                        {context.employees}
                      </b>{" "}
                      Staff Members
                    </div>

                    <div>
                      Pending Tasks:{" "}
                      <b>
                        {context.pending_tasks}
                      </b>{" "}
                      Tasks
                    </div>

                  </div>

                  <p className="text-xs text-slate-400 mt-3">
                    How can I assist you with automated
                    follow-ups, proposal drafting, or risk
                    analysis today?
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">

                    <button
                      onClick={() =>
                        askAI(
                          "Create a CRM task based on the most urgent current work."
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[9px]"
                    >
                      ⚙ Add CRM Task
                    </button>

                    <button
                      onClick={() =>
                        askAI(
                          "Recommend the most important lead to add or follow up today."
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[9px]"
                    >
                      ♙ Log Recommended Lead
                    </button>

                    <button
                      onClick={() =>
                        readAloud(
                          `Welcome Admin. Your CRM currently has ${context.leads} leads, ${context.customers} customers, and ${context.pending_tasks} pending tasks.`
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 text-[9px]"
                    >
                      🔊 Read Aloud
                    </button>

                    <button
                      onClick={() =>
                        copyText(
                          `Trishul CRM: ${context.leads} leads, ${context.customers} customers, ${context.pending_tasks} pending tasks.`
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 text-[9px]"
                    >
                      ▣ Copy
                    </button>

                  </div>

                </div>

              </div>

            )}

            {/* Conversation */}

            <div className="space-y-4 mt-4">

              {messages.map((message) => (

                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user"
                      ? "justify-end"
                      : ""
                  }`}
                >

                  {message.role === "assistant" && (
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] rounded-xl p-4 text-xs leading-6 ${
                      message.role === "user"
                        ? "bg-cyan-600/20 border border-cyan-500/30 text-cyan-100"
                        : "bg-[#1a2941] border border-slate-700 text-slate-300"
                    }`}
                  >

                    <div className="whitespace-pre-wrap">
                      {message.text}
                    </div>

                    {message.role === "assistant" && (

                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">

                        <button
                          onClick={() =>
                            readAloud(message.text)
                          }
                          className="text-[9px] text-slate-400 hover:text-white"
                        >
                          🔊 Read Aloud
                        </button>

                        <button
                          onClick={() =>
                            copyText(message.text)
                          }
                          className="text-[9px] text-slate-400 hover:text-white"
                        >
                          ▣ Copy
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              ))}

              {loading && (

                <div className="flex gap-3">

                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    🤖
                  </div>

                  <div className="rounded-xl bg-[#1a2941] border border-slate-700 px-4 py-3 text-xs text-slate-400">
                    Trishul AI is thinking...
                  </div>

                </div>

              )}

              <div ref={bottomRef} />

            </div>

          </div>

          {/* Error */}

          {error && (

            <div className="mx-4 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              {error}
            </div>

          )}

          {/* Input */}

          <div className="p-3 border-t border-slate-700 bg-[#0c1426]">

            <div className="flex items-center gap-2">

              <button
                onClick={() => {
                  if (
                    "webkitSpeechRecognition" in window
                  ) {
                    const Recognition =
                      window.webkitSpeechRecognition;

                    const recognition =
                      new Recognition();

                    recognition.lang = "en-IN";

                    recognition.onresult = (event) => {
                      setQuestion(
                        event.results[0][0].transcript
                      );
                    };

                    recognition.start();
                  }
                }}
                className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"
              >
                🎙
              </button>

              <input
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    askAI();
                  }
                }}
                placeholder="Type your question or select an AI workflow on the left..."
                className="flex-1 h-10 rounded-xl bg-slate-800 border border-slate-700 px-4 text-xs text-white outline-none focus:border-cyan-500"
              />

              <button
                onClick={() => askAI()}
                disabled={
                  loading ||
                  !question.trim()
                }
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-40 text-xs font-semibold"
              >
                Send ➤
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-4 rounded-2xl border border-slate-700 bg-[#10182c] p-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

             <div className="flex items-center gap-3">

              

              

            </div>

            

          </div>

        </div>

      </div>
    </Layout>
  );
}