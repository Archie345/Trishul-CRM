import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let data = [...tasks];

    // Search by title
    if (search) {
      data = data.filter((task) =>
        task.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "All") {
      data = data.filter((task) => task.status === statusFilter);
    }

    setFilteredTasks(data);
  }, [search, statusFilter, tasks]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(response.data);
      setFilteredTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  return (
    <Layout>
      <PageWrapper>

        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">

          <h1 className="text-4xl font-bold text-white">
            Tasks
          </h1>

        </div>

        {/* Search + Filter */}

        <div className="flex flex-col md:flex-row gap-4 mb-6">

          <input
            type="text"
            placeholder="🔍 Search task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-lg outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 text-white px-4 py-3 rounded-lg outline-none"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>

        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-lg"
        >
          <table className="w-full table-fixed text-white">

            <thead>
            <tr className="border-b border-slate-700">
            <th className="text-left py-3 w-[25%]">Title</th>
            <th className="text-left py-3 w-[40%]">Description</th>
            <th className="text-center py-3 w-[12%]">Due Date</th>
            <th className="text-center py-3 w-[11%]">Priority</th>
            <th className="text-center py-3 w-[12%]">Status</th>
          </tr>
         </thead>
            <tbody>

              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr
  key={task.id}
  className="border-b border-slate-800 hover:bg-slate-800 transition-all duration-300"
>
  <td className="py-4 pr-4 font-medium align-top">
    {task.title}
  </td>

  <td className="py-4 pr-6 text-gray-300">
    {task.description}
  </td>

  <td className="py-4 text-center whitespace-nowrap">
    {new Date(task.due_date).toLocaleDateString()}
  </td>

  <td className="py-4 text-center">
    <span
      className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1 rounded-full text-sm font-semibold ${
        task.priority === "High"
          ? "bg-red-600"
          : task.priority === "Medium"
          ? "bg-yellow-500 text-black"
          : "bg-green-600"
      }`}
    >
      {task.priority}
    </span>
  </td>

  <td className="py-4 text-center">
    <span
      className={`inline-flex items-center justify-center min-w-[100px] px-3 py-1 rounded-full text-sm font-semibold ${
        task.status === "Completed"
          ? "bg-green-600"
          : "bg-orange-500"
      }`}
    >
      {task.status}
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
                    No tasks found.
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