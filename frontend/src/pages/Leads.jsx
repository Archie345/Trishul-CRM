import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

// =========================================================
// WEBSOCKET URL
// =========================================================

const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error("VITE_API_URL is not configured");
  }

  const base = new URL(apiUrl);

  const protocol =
    base.protocol === "https:" ? "wss:" : "ws:";

  const basePath = base.pathname.replace(/\/+$/, "");

  return `${protocol}//${base.host}${basePath}/leads/ws`;
};

// =========================================================
// PIPELINE STAGES
// =========================================================

const PIPELINE_STAGES = [
  {
    key: "Future Service Interest",
    title: "Future Service Interest",
    description: "New future opportunities",
  },
  {
    key: "Follow-Up Scheduled",
    title: "Follow-Up Scheduled",
    description: "Follow-up required",
  },
  {
    key: "Qualified",
    title: "Qualified",
    description: "Potential customers",
  },
  {
    key: "Booked",
    title: "Booked / Converted",
    description: "Confirmed business",
  },
  {
    key: "Lost",
    title: "Lost",
    description: "Closed opportunities",
  },
];

// =========================================================
// OLD STATUS SUPPORT
// =========================================================

const normalizeStatus = (status) => {
  switch (status) {
    case "New":
      return "Future Service Interest";

    case "Contacted":
      return "Follow-Up Scheduled";

    case "Qualified":
      return "Qualified";

    case "Booked":
    case "Converted":
      return "Booked";

    case "Lost":
      return "Lost";

    default:
      return status || "Future Service Interest";
  }
};

// =========================================================
// CURRENCY
// =========================================================

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Leads() {
  const [leads, setLeads] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingLead, setEditingLead] = useState(null);

  const [wsConnected, setWsConnected] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  // =======================================================
  // FORM
  // =======================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    value: "",
    timeline: "",
    notes: "",
    status: "Future Service Interest",
  });

  // =======================================================
  // FETCH LEADS
  // =======================================================

  const fetchLeads = async () => {
    try {
      const response = await api.get("/leads/");

      setLeads(response.data || []);
    } catch (error) {
      console.error(
        "Error fetching leads:",
        error
      );
    }
  };

  // =======================================================
  // INITIAL LOAD + WEBSOCKET
  // =======================================================

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) {
        return;
      }

      try {
        const wsUrl = getWebSocketUrl();

        console.log(
          "Connecting Leads WebSocket:",
          wsUrl
        );

        ws = new WebSocket(wsUrl);

        // -----------------------------------------------
        // OPEN
        // -----------------------------------------------

        ws.onopen = async () => {
          console.log(
            "Leads WebSocket connected"
          );

          setWsConnected(true);

          reconnectAttempts = 0;

          await fetchLeads();
        };

        // -----------------------------------------------
        // MESSAGE
        // -----------------------------------------------

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(
              event.data
            );

            console.log(
              "Lead WebSocket event:",
              data
            );

            // CREATE
            if (
              data.event === "lead_created"
            ) {
              setLeads((previous) => {
                const exists =
                  previous.some(
                    (lead) =>
                      lead.id ===
                      data.lead.id
                  );

                if (exists) {
                  return previous;
                }

                return [
                  data.lead,
                  ...previous,
                ];
              });
            }

            // UPDATE
            if (
              data.event === "lead_updated"
            ) {
              setLeads((previous) =>
                previous.map((lead) =>
                  lead.id === data.lead.id
                    ? data.lead
                    : lead
                )
              );
            }

            // DELETE
            if (
              data.event === "lead_deleted"
            ) {
              setLeads((previous) =>
                previous.filter(
                  (lead) =>
                    lead.id !==
                    data.lead_id
                )
              );
            }
          } catch (error) {
            console.error(
              "Invalid WebSocket message:",
              error
            );
          }
        };

        // -----------------------------------------------
        // ERROR
        // -----------------------------------------------

        ws.onerror = (error) => {
          console.error(
            "Leads WebSocket error:",
            error
          );
        };

        // -----------------------------------------------
        // CLOSE
        // -----------------------------------------------

        ws.onclose = () => {
          console.log(
            "Leads WebSocket disconnected"
          );

          setWsConnected(false);

          if (isUnmounted) {
            return;
          }

          const delay = Math.min(
            1000 *
              2 **
              reconnectAttempts,
            10000
          );

          reconnectAttempts += 1;

          console.log(
            `Reconnecting in ${delay}ms...`
          );

          reconnectTimer =
            setTimeout(
              connectWebSocket,
              delay
            );
        };
      } catch (error) {
        console.error(
          "Unable to create WebSocket:",
          error
        );
      }
    };

    // First database load
    fetchLeads();

    // WebSocket
    connectWebSocket();

    return () => {
      isUnmounted = true;

      clearTimeout(
        reconnectTimer
      );

      if (ws) {
        ws.close();
      }
    };
  }, []);

  // =======================================================
  // NORMALIZE LEADS
  // =======================================================

  const normalizedLeads = useMemo(() => {
    return leads.map((lead) => ({
      ...lead,
      status: normalizeStatus(
        lead.status
      ),
    }));
  }, [leads]);

  // =======================================================
  // SEARCH + FILTER
  // =======================================================

  const filteredLeads = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return normalizedLeads.filter(
      (lead) => {
        const matchesSearch =
          !query ||
          lead.name
            ?.toLowerCase()
            .includes(query) ||
          lead.email
            ?.toLowerCase()
            .includes(query) ||
          lead.phone
            ?.toLowerCase()
            .includes(query) ||
          lead.company
            ?.toLowerCase()
            .includes(query) ||
          lead.service
            ?.toLowerCase()
            .includes(query) ||
          lead.notes
            ?.toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          lead.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    normalizedLeads,
    search,
    statusFilter,
  ]);

  // =======================================================
  // STATS
  // =======================================================

  const stats = useMemo(() => {
    const activeLeads =
      normalizedLeads.filter(
        (lead) =>
          lead.status !== "Booked" &&
          lead.status !== "Lost"
      );

    const bookedLeads =
      normalizedLeads.filter(
        (lead) =>
          lead.status === "Booked"
      );

    const pipelineValue =
      activeLeads.reduce(
        (total, lead) =>
          total +
          Number(lead.value || 0),
        0
      );

    const bookedValue =
      bookedLeads.reduce(
        (total, lead) =>
          total +
          Number(lead.value || 0),
        0
      );

    const totalLeads =
      normalizedLeads.length;

    const conversionRate =
      totalLeads > 0
        ? (
            bookedLeads.length /
            totalLeads
          ) *
          100
        : 0;

    return {
      pipelineValue,
      bookedValue,
      activeCount:
        activeLeads.length,
      conversionRate,
    };
  }, [normalizedLeads]);

  // =======================================================
  // ADD MODAL
  // =======================================================

  const openAddModal = () => {
    setEditingLead(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      service: "",
      value: "",
      timeline: "",
      notes: "",
      status:
        "Future Service Interest",
    });

    setShowModal(true);
  };

  // =======================================================
  // EDIT MODAL
  // =======================================================

  const openEditModal = (lead) => {
    setEditingLead(lead);

    setFormData({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      service: lead.service || "",
      value: lead.value || "",
      timeline:
        lead.timeline || "",
      notes: lead.notes || "",
      status:
        normalizeStatus(
          lead.status
        ),
    });

    setShowModal(true);
  };

  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =======================================================
  // CLOSE MODAL
  // =======================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingLead(null);
  };

  // =======================================================
  // SAVE
  // =======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);

    const payload = {
      name:
        formData.name.trim(),

      email:
        formData.email.trim() ||
        null,

      phone:
        formData.phone.trim() ||
        null,

      company:
        formData.company.trim() ||
        null,

      service:
        formData.service.trim() ||
        null,

      value:
        Number(formData.value || 0),

      timeline:
        formData.timeline.trim() ||
        null,

      notes:
        formData.notes.trim() ||
        null,

      status:
        formData.status,
    };

    try {
      if (editingLead) {
        await api.put(
          `/leads/${editingLead.id}`,
          payload
        );
      } else {
        await api.post(
          "/leads/",
          payload
        );
      }

      setShowModal(false);

      setEditingLead(null);

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "",
        value: "",
        timeline: "",
        notes: "",
        status:
          "Future Service Interest",
      });
    } catch (error) {
      console.error(
        "Error saving lead:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      alert(
        error.response?.data?.detail ||
          "Unable to save lead."
      );
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // DELETE
  // =======================================================

  const handleDelete = async (leadId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this lead?"
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(leadId);

    try {
      await api.delete(
        `/leads/${leadId}`
      );
    } catch (error) {
      console.error(
        "Error deleting lead:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to delete lead."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =======================================================
  // ADVANCE
  // =======================================================

  const advanceLead = async (lead) => {
    const currentStatus =
      normalizeStatus(
        lead.status
      );

    const currentIndex =
      PIPELINE_STAGES.findIndex(
        (stage) =>
          stage.key ===
          currentStatus
      );

    if (
      currentIndex === -1 ||
      currentIndex >=
        PIPELINE_STAGES.length - 2
    ) {
      return;
    }

    const nextStage =
      PIPELINE_STAGES[
        currentIndex + 1
      ];

    const payload = {
      name: lead.name,

      email:
        lead.email || null,

      phone:
        lead.phone || null,

      company:
        lead.company || null,

      service:
        lead.service || null,

      value:
        Number(lead.value || 0),

      timeline:
        lead.timeline || null,

      notes:
        lead.notes || null,

      status:
        nextStage.key,
    };

    try {
      await api.put(
        `/leads/${lead.id}`,
        payload
      );
    } catch (error) {
      console.error(
        "Error advancing lead:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to advance lead."
      );
    }
  };

  // =======================================================
  // STAGE LEADS
  // =======================================================

  const getStageLeads = (stageKey) => {
    return filteredLeads.filter(
      (lead) =>
        lead.status === stageKey
    );
  };

  // =======================================================
  // UI
  // =======================================================

  return (
    <Layout>
      <PageWrapper>

        {/* =================================================
            IMPORTANT CONTAINER
        ================================================= */}

        <div className="w-full min-w-0 max-w-full overflow-hidden">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Future Service Leads & Client Inquiries
                </h1>

                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">

                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      wsConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />

                  <span className="text-xs font-medium text-gray-300">
                    {wsConnected
                      ? "Live"
                      : "Offline"}
                  </span>

                </div>

              </div>

              <p className="text-gray-400 mt-2">
                Capture client contact numbers,
                service needs, timelines and future
                business opportunities.
              </p>

            </div>

            <button
              onClick={openAddModal}
              className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition shadow-lg shadow-blue-900/20"
            >
              <span className="text-xl">
                +
              </span>

              Add Lead
            </button>

          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">

            {/* Pipeline */}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0"
            >

              <div className="flex justify-between items-start gap-3">

                <div className="min-w-0">

                  <p className="text-gray-400 text-sm">
                    Future Pipeline Value
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-2 truncate">
                    {formatCurrency(
                      stats.pipelineValue
                    )}
                  </h2>

                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">
                  ₹
                </div>

              </div>

            </motion.div>

            {/* Booked */}

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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0"
            >

              <div className="flex justify-between items-start gap-3">

                <div className="min-w-0">

                  <p className="text-gray-400 text-sm">
                    Booked / Converted Value
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-2 truncate">
                    {formatCurrency(
                      stats.bookedValue
                    )}
                  </h2>

                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 text-xl">
                  ✓
                </div>

              </div>

            </motion.div>

            {/* Active */}

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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0"
            >

              <div className="flex justify-between items-start gap-3">

                <div className="min-w-0">

                  <p className="text-gray-400 text-sm">
                    Active Future Inquiries
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-2">
                    {stats.activeCount}
                  </h2>

                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-xl">
                  👥
                </div>

              </div>

            </motion.div>

            {/* Conversion */}

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
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0"
            >

              <div className="flex justify-between items-start gap-3">

                <div className="min-w-0">

                  <p className="text-gray-400 text-sm">
                    Service Conversion Rate
                  </p>

                  <h2 className="text-2xl font-bold text-white mt-2">
                    {stats.conversionRate.toFixed(1)}%
                  </h2>

                </div>

                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 text-xl">
                  ↗
                </div>

              </div>

            </motion.div>

          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="flex flex-col lg:flex-row gap-3 mb-6 min-w-0">

            <div className="relative flex-1 min-w-0">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </span>

              <input
                type="text"
                placeholder="Search by name, company, phone, service..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="w-full min-w-0 bg-slate-900 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 transition"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="lg:w-64 flex-shrink-0 bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >

              <option value="All">
                All Stages
              </option>

              {PIPELINE_STAGES.map(
                (stage) => (
                  <option
                    key={stage.key}
                    value={stage.key}
                  >
                    {stage.title}
                  </option>
                )
              )}

            </select>

          </div>

          {/* =================================================
              KANBAN OUTER CONTAINER
              
              IMPORTANT:
              ONLY THIS AREA SCROLLS HORIZONTALLY
          ================================================= */}

          <div className="w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-6">

            {/* Fixed internal width for 5 columns */}

            <div className="flex gap-5 min-w-[1650px]">

              {PIPELINE_STAGES.map(
                (stage) => {

                  const stageLeads =
                    getStageLeads(
                      stage.key
                    );

                  return (
                    <div
                      key={stage.key}
                      className="w-[310px] md:w-[320px] flex-shrink-0"
                    >

                      {/* ---------------------------------------
                          COLUMN HEADER
                      --------------------------------------- */}

                      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl p-4">

                        <div className="flex items-center justify-between gap-3">

                          <div className="min-w-0">

                            <h2 className="text-white font-semibold truncate">
                              {stage.title}
                            </h2>

                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {stage.description}
                            </p>

                          </div>

                          <span className="flex-shrink-0 min-w-7 h-7 px-2 rounded-full bg-slate-800 text-gray-300 text-xs flex items-center justify-center font-semibold">
                            {stageLeads.length}
                          </span>

                        </div>

                      </div>

                      {/* ---------------------------------------
                          COLUMN BODY
                      --------------------------------------- */}

                      <div className="bg-slate-950/70 border-x border-b border-slate-800 rounded-b-2xl p-3 min-h-[500px] space-y-3">

                        <AnimatePresence mode="popLayout">

                          {stageLeads.length > 0 ? (

                            stageLeads.map(
                              (lead) => (

                                <LeadCard
                                  key={lead.id}
                                  lead={lead}
                                  stage={stage}
                                  onEdit={
                                    openEditModal
                                  }
                                  onDelete={
                                    handleDelete
                                  }
                                  onAdvance={
                                    advanceLead
                                  }
                                  deletingId={
                                    deletingId
                                  }
                                />

                              )
                            )

                          ) : (

                            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center">

                              <div className="text-2xl mb-2 text-gray-700">
                                —
                              </div>

                              <p className="text-gray-600 text-sm">
                                No leads in this stage
                              </p>

                            </div>

                          )}

                        </AnimatePresence>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            ADD / EDIT MODAL
        ================================================= */}

        <AnimatePresence>

          {showModal && (

            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              >

                {/* Modal Header */}

                <div className="flex items-center justify-between p-6 border-b border-slate-800">

                  <div>

                    <h2 className="text-xl font-bold text-white">
                      {editingLead
                        ? "Edit Lead"
                        : "Add New Lead"}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {editingLead
                        ? "Update lead information"
                        : "Create a new service opportunity"}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-500 hover:text-white text-2xl"
                  >
                    ×
                  </button>

                </div>

                {/* Form */}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="p-6 space-y-5"
                >

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Name */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Client Name *
                      </label>

                      <input
                        name="name"
                        value={
                          formData.name
                        }
                        onChange={
                          handleChange
                        }
                        required
                        placeholder="Client name"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Company */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Company
                      </label>

                      <input
                        name="company"
                        value={
                          formData.company
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Company name"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Email */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Email
                      </label>

                      <input
                        name="email"
                        type="email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="client@example.com"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Phone */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Contact Number
                      </label>

                      <input
                        name="phone"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Service */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Service Required
                      </label>

                      <input
                        name="service"
                        value={
                          formData.service
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="e.g. Website Development"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Value */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Estimated Value
                      </label>

                      <input
                        name="value"
                        type="number"
                        min="0"
                        value={
                          formData.value
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="50000"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Timeline */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Expected Timeline
                      </label>

                      <input
                        name="timeline"
                        value={
                          formData.timeline
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="e.g. Next month"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      />

                    </div>

                    {/* Status */}

                    <div>

                      <label className="block text-sm text-gray-400 mb-2">
                        Pipeline Stage
                      </label>

                      <select
                        name="status"
                        value={
                          formData.status
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                      >

                        {PIPELINE_STAGES.map(
                          (stage) => (

                            <option
                              key={
                                stage.key
                              }
                              value={
                                stage.key
                              }
                            >
                              {
                                stage.title
                              }
                            </option>

                          )
                        )}

                      </select>

                    </div>

                  </div>

                  {/* Notes */}

                  <div>

                    <label className="block text-sm text-gray-400 mb-2">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      value={
                        formData.notes
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      placeholder="Add client requirements, conversation notes, follow-up details..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 resize-none"
                    />

                  </div>

                  {/* Buttons */}

                  <div className="flex justify-end gap-3 pt-2">

                    <button
                      type="button"
                      onClick={
                        closeModal
                      }
                      disabled={saving}
                      className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                    >
                      {saving
                        ? "Saving..."
                        : editingLead
                        ? "Update Lead"
                        : "Add Lead"}
                    </button>

                  </div>

                </form>

              </motion.div>

            </div>

          )}

        </AnimatePresence>

      </PageWrapper>
    </Layout>
  );
}

// =========================================================
// LEAD CARD
// =========================================================

function LeadCard({
  lead,
  stage,
  onEdit,
  onDelete,
  onAdvance,
  deletingId,
}) {
  const isBooked =
    stage.key === "Booked";

  const isLost =
    stage.key === "Lost";

  const isLastStage =
    isBooked || isLost;

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg transition"
    >

      {/* =================================================
          NAME + VALUE
      ================================================= */}

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <h3 className="text-white font-semibold truncate">
            {lead.name ||
              "Unnamed Lead"}
          </h3>

          <p className="text-xs text-gray-500 truncate mt-1">
            {lead.company ||
              "Individual Client"}
          </p>

        </div>

        <span className="text-green-400 font-bold text-sm whitespace-nowrap">
          {formatCurrency(
            lead.value
          )}
        </span>

      </div>

      {/* =================================================
          DETAILS
      ================================================= */}

      <div className="mt-4 space-y-2.5">

        {/* Phone */}

        {lead.phone && (
          <div className="flex items-center gap-2 text-sm min-w-0">

            <span className="text-gray-500 flex-shrink-0">
              📞
            </span>

            <span className="text-gray-300 truncate">
              {lead.phone}
            </span>

          </div>
        )}

        {/* Service */}

        {lead.service && (
          <div className="flex items-center gap-2 text-sm min-w-0">

            <span className="text-gray-500 flex-shrink-0">
              🔧
            </span>

            <span className="text-gray-300 truncate">
              {lead.service}
            </span>

          </div>
        )}

        {/* Timeline */}

        {lead.timeline && (
          <div className="flex items-center gap-2 text-sm min-w-0">

            <span className="text-gray-500 flex-shrink-0">
              🕐
            </span>

            <span className="text-gray-300 truncate">
              {lead.timeline}
            </span>

          </div>
        )}

        {/* Email */}

        {lead.email && (
          <div className="flex items-center gap-2 text-sm min-w-0">

            <span className="text-gray-500 flex-shrink-0">
              ✉
            </span>

            <span className="text-gray-400 truncate">
              {lead.email}
            </span>

          </div>
        )}

      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      {lead.notes && (
        <div className="mt-4 bg-slate-800/60 rounded-lg p-3">

          <p className="text-xs text-gray-400 line-clamp-3">
            {lead.notes}
          </p>

        </div>
      )}

      {/* =================================================
          ASSIGNED USER
      ================================================= */}

      {lead.assigned_to && (
        <div className="flex items-center gap-2 mt-4">

          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {String(
              lead.assigned_to
            ).slice(0, 2)}
          </div>

          <span className="text-xs text-gray-500">
            Agent #{lead.assigned_to}
          </span>

        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">

        {!isLastStage && (
          <button
            onClick={() =>
              onAdvance(lead)
            }
            className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-400 px-3 py-2 rounded-lg text-xs font-semibold transition"
          >
            Advance →
          </button>
        )}

        <button
          onClick={() =>
            onEdit(lead)
          }
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-xs font-semibold transition"
        >
          Edit
        </button>

        <button
          onClick={() =>
            onDelete(lead.id)
          }
          disabled={
            deletingId === lead.id
          }
          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-lg text-xs font-semibold transition disabled:opacity-50"
        >
          {deletingId === lead.id
            ? "..."
            : "Delete"}
        </button>

      </div>

    </motion.div>
  );
}