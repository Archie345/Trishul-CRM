import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let data = [...leads];

    // Search by Name or Company
    if (search) {
      data = data.filter(
        (lead) =>
          lead.name.toLowerCase().includes(search.toLowerCase()) ||
          lead.company.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by Status
    if (statusFilter !== "All") {
      data = data.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(data);
  }, [search, statusFilter, leads]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/leads", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeads(response.data);
      setFilteredLeads(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <PageWrapper>

        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">

          <h1 className="text-4xl font-bold text-white">
            Leads
          </h1>

          <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold transition">
            + Add Lead
          </button>

        </div>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">

          <input
            type="text"
            placeholder="🔍 Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-3 outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 text-white rounded-lg px-4 py-3 outline-none"
          >
            <option>All</option>
            <option>New</option>
            <option>Contacted</option>
            <option>Qualified</option>
            <option>Lost</option>
          </select>

        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-lg"
        >
          <table className="w-full text-white">

            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Phone</th>
                <th className="text-left py-3">Company</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-800 hover:bg-slate-800 transition"
                  >
                    <td className="py-3">{lead.name}</td>
                    <td>{lead.email}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.company}</td>

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-sm
                          ${
                            lead.status === "Qualified"
                              ? "bg-green-600"
                              : lead.status === "Contacted"
                              ? "bg-orange-500"
                              : lead.status === "Lost"
                              ? "bg-red-600"
                              : "bg-blue-600"
                          }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-8 text-gray-400"
                  >
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </motion.div>

      </PageWrapper>
    </Layout>
  );
}