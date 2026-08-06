import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import PageWrapper from "../components/PageWrapper";
import StatCard from "../components/dashboard/StatCard";
import LeadChart from "../components/charts/LeadChart";
import TaskChart from "../components/charts/TaskChart";
import api from "../api/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_leads: 0,
    total_customers: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
  });

  const [leadStatus, setLeadStatus] = useState([]);
  const [taskStatus, setTaskStatus] = useState([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetchDashboard();
    fetchLeadStatus();
    fetchTaskStatus();

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/reports/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeadStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/reports/lead-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeadStatus(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTaskStatus = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/reports/task-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTaskStatus(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <PageWrapper>

        {/* Header */}

        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-4xl font-bold text-white">
              Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Welcome back, Admin 👋
            </p>
          </div>

          <div className="bg-slate-900 px-6 py-4 rounded-xl text-right shadow-lg">
            <p className="text-gray-400 text-sm">
              {time.toLocaleDateString()}
            </p>

            <p className="text-white font-bold text-xl">
              {time.toLocaleTimeString()}
            </p>
          </div>

        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <StatCard
            title="Total Leads"
            value={stats.total_leads}
            color="bg-blue-600"
          />

          <StatCard
            title="Customers"
            value={stats.total_customers}
            color="bg-green-600"
          />

          <StatCard
            title="Tasks"
            value={stats.total_tasks}
            color="bg-orange-500"
          />

          <StatCard
            title="Pending Tasks"
            value={stats.pending_tasks}
            color="bg-purple-600"
          />

          <StatCard
            title="Completed"
            value={stats.completed_tasks}
            color="bg-emerald-600"
          />

          <StatCard
            title="Employees"
            value={2}
            color="bg-cyan-600"
          />

          <StatCard
            title="Revenue"
            value="₹8.45L"
            color="bg-pink-600"
          />

          <StatCard
            title="Conversion"
            value="72%"
            color="bg-indigo-600"
          />

        </div>

        {/* Charts */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">

          <LeadChart data={leadStatus} />

          <TaskChart data={taskStatus} />

        </div>

        {/* Bottom Cards */}

        <div className="grid lg:grid-cols-2 gap-8 mt-10">

          {/* Latest Customers */}

          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">

            <h2 className="text-xl text-white font-bold mb-5">
              Latest Customers
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between border-b border-slate-700 pb-3">
                <div>
                  <p className="text-white font-semibold">
                    Sonalika Gupta
                  </p>

                  <p className="text-gray-400 text-sm">
                    Wipro
                  </p>
                </div>

                <span className="text-green-400">
                  Active
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-700 pb-3">
                <div>
                  <p className="text-white font-semibold">
                    Rahul Sharma
                  </p>

                  <p className="text-gray-400 text-sm">
                    Infosys
                  </p>
                </div>

                <span className="text-green-400">
                  Active
                </span>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-white font-semibold">
                    Priya Singh
                  </p>

                  <p className="text-gray-400 text-sm">
                    TCS
                  </p>
                </div>

                <span className="text-green-400">
                  Active
                </span>
              </div>

            </div>

          </div>

          {/* Recent Activity */}

          <div className="bg-slate-900 rounded-xl p-6 shadow-lg">

            <h2 className="text-xl text-white font-bold mb-5">
              Recent Activity
            </h2>

            <div className="space-y-4 text-gray-300">

              <p>✅ New lead added</p>

              <p>📞 Customer converted successfully</p>

              <p>📝 Task completed</p>

              <p>🤖 AI generated follow-up email</p>

              <p>📊 Report exported</p>

            </div>

          </div>

        </div>

      </PageWrapper>
    </Layout>
  );
}