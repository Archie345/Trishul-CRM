import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH EMPLOYEES
  // =========================

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================
  // SEARCH
  // =========================

  useEffect(() => {
    const searchValue = search.toLowerCase();

    const filtered = employees.filter((employee) => {
      const name = employee.full_name?.toLowerCase() || "";
      const email = employee.email?.toLowerCase() || "";
      const role = employee.role?.toLowerCase() || "";

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        role.includes(searchValue)
      );
    });

    setFilteredEmployees(filtered);
  }, [search, employees]);

  // =========================
  // TOKEN
  // =========================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =========================
  // FETCH
  // =========================

  const fetchEmployees = async () => {
    try {
      const token = getToken();

      const response = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(response.data);
    } catch (error) {
      console.error(
        "Error fetching employees:",
        error.response?.data || error.message
      );
    }
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // OPEN ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingEmployee(null);

    setFormData({
      full_name: "",
      email: "",
      password: "",
      role: "employee",
    });

    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (employee) => {
    setEditingEmployee(employee);

    setFormData({
      full_name: employee.full_name || "",
      email: employee.email || "",
      password: "",
      role: employee.role || "employee",
    });

    setShowModal(true);
  };

  // =========================
  // ADD / UPDATE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email) {
      alert("Name and email are required.");
      return;
    }

    // Password required only while adding
    if (!editingEmployee && !formData.password) {
      alert("Password is required for a new employee.");
      return;
    }

    try {
      setLoading(true);

      const token = getToken();

      // =========================
      // UPDATE
      // =========================

      if (editingEmployee) {
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
        };

        const response = await api.put(
          `/users/${editingEmployee.id}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setEmployees((prev) =>
          prev.map((employee) =>
            employee.id === editingEmployee.id
              ? response.data
              : employee
          )
        );

        alert("Employee updated successfully.");
      }

      // =========================
      // ADD
      // =========================

      else {
        const createData = {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

        const response = await api.post(
          "/users/",
          createData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setEmployees((prev) => [
          response.data,
          ...prev,
        ]);

        alert("Employee added successfully.");
      }

      setShowModal(false);

    } catch (error) {
      console.error(
        "Employee save error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Something went wrong while saving employee."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (employeeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      await api.delete(`/users/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees((prev) =>
        prev.filter(
          (employee) => employee.id !== employeeId
        )
      );

      alert("Employee deleted successfully.");

    } catch (error) {
      console.error(
        "Delete employee error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Failed to delete employee."
      );
    }
  };

  return (
    <Layout>
      <PageWrapper>

        {/* =========================
            HEADER
        ========================= */}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

          <div>
            <h1 className="text-4xl font-bold text-white">
              Employees
            </h1>

            <p className="text-gray-400 mt-2">
              Manage your team members and their roles
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition shadow-lg"
          >
            + Add Employee
          </button>

        </div>

        {/* =========================
            SEARCH
        ========================= */}

        <div className="mb-6">

          <input
            type="text"
            placeholder="🔍 Search employee by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
          />

        </div>

        {/* =========================
            EMPLOYEE TABLE
        ========================= */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900 rounded-xl overflow-x-auto shadow-lg"
        >

          <table className="w-full text-left text-white">

            <thead className="bg-slate-800 text-gray-300">

              <tr>

                <th className="p-4">
                  ID
                </th>

                <th className="p-4">
                  Name
                </th>

                <th className="p-4">
                  Email
                </th>

                <th className="p-4">
                  Role
                </th>

                <th className="p-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredEmployees.length > 0 ? (

                filteredEmployees.map((employee) => (

                  <tr
                    key={employee.id}
                    className="border-t border-slate-700 hover:bg-slate-800 transition"
                  >

                    <td className="p-4">
                      {employee.id}
                    </td>

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
                            : employee.role === "supervisor"
                            ? "bg-orange-500 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {employee.role === "admin"
                          ? "Admin"
                          : employee.role === "supervisor"
                          ? "Supervisor"
                          : "Employee"}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            openEditModal(employee)
                          }
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(employee.id)
                          }
                          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm transition"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-400"
                  >
                    No employees found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </motion.div>

        {/* =========================
            ADD / EDIT MODAL
        ========================= */}

        {showModal && (

          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="bg-slate-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700"
            >

              {/* MODAL HEADER */}

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold text-white">
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* NAME */}

                <div>

                  <label className="block text-gray-300 mb-1">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Employee full name"
                    required
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block text-gray-300 mb-1">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="employee@example.com"
                    required
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  />

                </div>

                {/* PASSWORD */}

                {!editingEmployee && (

                  <div>

                    <label className="block text-gray-300 mb-1">
                      Password *
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create password"
                      required
                      minLength="6"
                      className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                    />

                  </div>

                )}

                {/* ROLE */}

                <div>

                  <label className="block text-gray-300 mb-1">
                    Role
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  >

                    <option value="employee">
                      Employee
                    </option>

                    <option value="supervisor">
                      Supervisor
                    </option>

                    <option value="admin">
                      Admin
                    </option>

                  </select>

                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 pt-4">

                  <button
                    type="button"
                    onClick={() =>
                      setShowModal(false)
                    }
                    className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-lg font-semibold transition"
                  >
                    {loading
                      ? "Saving..."
                      : editingEmployee
                      ? "Update Employee"
                      : "Add Employee"}
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