import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    status: "Active",
    revenue: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const company = customer.company?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";

      const searchValue = search.toLowerCase();

      return (
        name.includes(searchValue) ||
        company.includes(searchValue) ||
        email.includes(searchValue)
      );
    });

    setFilteredCustomers(filtered);
  }, [search, customers]);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =========================
  // FETCH CUSTOMERS
  // =========================

  const fetchCustomers = async () => {
    try {
      const token = getToken();

      const response = await api.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch customers:",
        error.response?.data || error.message
      );
    }
  };

  // =========================
  // FORM INPUT
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
    setEditingCustomer(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      status: "Active",
       revenue: 0,
    });

    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
      status: customer.status || "Active",
      revenue: customer.revenue || 0,
    });

    setShowModal(true);
  };

  // =========================
  // ADD / UPDATE CUSTOMER
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Name and email are required.");
      return;
    }

    try {
      setLoading(true);

      const token = getToken();

      if (editingCustomer) {
        // UPDATE CUSTOMER

        const response = await api.put(
          `/customers/${editingCustomer.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === editingCustomer.id
              ? response.data
              : customer
          )
        );

        alert("Customer updated successfully.");
      } else {
        // ADD CUSTOMER

        const response = await api.post("/customers/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCustomers((prev) => [response.data, ...prev]);

        alert("Customer added successfully.");
      }

      setShowModal(false);
    } catch (error) {
      console.error(
        "Customer save error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Something went wrong while saving customer."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE CUSTOMER
  // =========================

  const handleDelete = async (customerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      await api.delete(`/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerId)
      );

      alert("Customer deleted successfully.");
    } catch (error) {
      console.error(
        "Delete customer error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.detail ||
          "Failed to delete customer."
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
              Customers
            </h1>

            <p className="text-gray-400 mt-2">
              Manage your customers and their information
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition shadow-lg"
          >
            + Add Customer
          </button>

        </div>

        {/* =========================
            SEARCH
        ========================= */}

        <div className="mb-6">

          <input
            type="text"
            placeholder="🔍 Search by name, company or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-slate-800 text-white rounded-lg px-4 py-3 outline-none border border-slate-700 focus:border-blue-500"
          />

        </div>

        {/* =========================
            CUSTOMER TABLE
        ========================= */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-lg"
        >

          <table className="w-full text-white">

            <thead>
              <tr className="border-b border-slate-700">

                <th className="text-left py-3 px-2">
                  Name
                </th>

                <th className="text-left py-3 px-2">
                  Email
                </th>

                <th className="text-left py-3 px-2">
                  Phone
                </th>

                <th className="text-left py-3 px-2">
                  Company
                </th>

                <th className="text-left py-3 px-2">
                  Status
                </th>

                <th className="text-left py-3 px-2">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredCustomers.length > 0 ? (

                filteredCustomers.map((customer) => (

                  <tr
                    key={customer.id}
                    className="border-b border-slate-800 hover:bg-slate-800 transition"
                  >

                    <td className="py-4 px-2 font-semibold">
                      {customer.name}
                    </td>

                    <td className="px-2 text-gray-300">
                      {customer.email}
                    </td>

                    <td className="px-2 text-gray-300">
                      {customer.phone || "-"}
                    </td>

                    <td className="px-2 text-gray-300">
                      {customer.company || "-"}
                    </td>

                    <td className="px-2">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          customer.status === "Active"
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {customer.status}
                      </span>

                    </td>

                    <td className="px-2">

                      <div className="flex gap-2">

                        <button
                          onClick={() => openEditModal(customer)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(customer.id)}
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
                    colSpan="6"
                    className="text-center py-10 text-gray-400"
                  >
                    No customers found.
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700"
            >

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold text-white">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <button
                  onClick={() => setShowModal(false)}
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
                    Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Customer name"
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
                    placeholder="customer@example.com"
                    required
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="block text-gray-300 mb-1">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  />
                </div>

                {/* COMPANY */}

                <div>
                  <label className="block text-gray-300 mb-1">
                    Company
                  </label>

                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company name"
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  />
                </div>

                {/* ADDRESS */}

                <div>
                  <label className="block text-gray-300 mb-1">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Customer address"
                    rows="3"
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500 resize-none"
                  />
                </div>
                {/* REVENUE */}

                <div>
               <label className="block text-gray-300 mb-1">
                Revenue
              </label>

               <input
                type="number"
                name="revenue"
                value={formData.revenue}
                onChange={handleChange}
                placeholder="Enter revenue amount"
                min="0"
              className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
             />
          </div>

                {/* STATUS */}

                <div>
                  <label className="block text-gray-300 mb-1">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg outline-none border border-slate-700 focus:border-blue-500"
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 pt-4">

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
                      : editingCustomer
                      ? "Update Customer"
                      : "Add Customer"}
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