import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const filtered = employees.filter(
      (employee) =>
        employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
        employee.email.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredEmployees(filtered);
  }, [search, employees]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  return (
    <Layout>
      <PageWrapper>

        <h1 className="text-4xl font-bold text-white mb-8">
          Employees
        </h1>

        {/* Search */}

        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-slate-800 text-white px-4 py-3 rounded-lg outline-none"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900 rounded-xl overflow-x-auto shadow-lg"
        >
          <table className="w-full text-left text-white">

            <thead className="bg-slate-800 text-gray-300">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
              </tr>
            </thead>

            <tbody>

              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-t border-slate-700 hover:bg-slate-800 transition"
                  >
                    <td className="p-4">{employee.id}</td>

                    <td className="p-4 font-medium">
                      {employee.full_name}
                    </td>

                    <td className="p-4">
                      {employee.email}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          employee.role === "admin"
                            ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {employee.role}
                      </span>

                    </td>

                  </tr>
                ))
              ) : (
                <tr>

                  <td
                    colSpan="4"
                    className="text-center py-8 text-gray-400"
                  >
                    No employees found.
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