import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import StatCard from "../components/dashboard/StatCard";
import LeadChart from "../components/charts/LeadChart";
import TaskChart from "../components/charts/TaskChart";
import api from "../api/api";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchOverview();
    fetchLeadStatus();
    fetchTaskStatus();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await api.get("/reports/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeadStatus = async () => {
    try {
      const response = await api.get("/reports/lead-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeadStatus(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTaskStatus = async () => {
    try {
      const response = await api.get("/reports/task-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTaskStatus(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= PDF =================

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("TRISHUL CRM REPORT", 14, 20);

    autoTable(doc, {
      startY: 35,
      head: [["Metric", "Value"]],
      body: [
        ["Total Leads", stats.total_leads],
        ["Customers", stats.total_customers],
        ["Tasks", stats.total_tasks],
        ["Completed Tasks", stats.completed_tasks],
        ["Pending Tasks", stats.pending_tasks],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Lead Status", "Count"]],
      body: leadStatus.map((item) => [
        item.status,
        item.count,
      ]),
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Task Status", "Count"]],
      body: taskStatus.map((item) => [
        item.status,
        item.count,
      ]),
    });

    doc.save("Trishul_CRM_Report.pdf");
  };

  // ================= Excel =================

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const overviewSheet = XLSX.utils.json_to_sheet([
      {
        "Total Leads": stats.total_leads,
        Customers: stats.total_customers,
        Tasks: stats.total_tasks,
        Completed: stats.completed_tasks,
        Pending: stats.pending_tasks,
      },
    ]);

    const leadSheet = XLSX.utils.json_to_sheet(leadStatus);

    const taskSheet = XLSX.utils.json_to_sheet(taskStatus);

    XLSX.utils.book_append_sheet(
      workbook,
      overviewSheet,
      "Overview"
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

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, "Trishul_CRM_Report.xlsx");
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-white">
          Reports
        </h1>

        <div className="flex gap-4">

          <button
            onClick={exportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Export PDF
          </button>

          <button
            onClick={exportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Export Excel
          </button>

        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-10">

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
          title="Completed"
          value={stats.completed_tasks}
          color="bg-purple-600"
        />

      </div>

      <div className="grid grid-cols-2 gap-8">

        <LeadChart data={leadStatus} />

        <TaskChart data={taskStatus} />

      </div>
    </Layout>
  );
}