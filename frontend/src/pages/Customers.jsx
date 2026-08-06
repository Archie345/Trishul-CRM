import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.company.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredCustomers(filtered);
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <PageWrapper>

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-4xl font-bold text-white">
            Customers
          </h1>

        </div>

        {/* Search Bar */}

        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-slate-800 text-white rounded-lg px-4 py-3 outline-none"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
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

              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-800 hover:bg-slate-800 transition"
                  >
                    <td className="py-3">{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.company}</td>

                    <td>
                      <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                        {customer.status}
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
                    No customers found.
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