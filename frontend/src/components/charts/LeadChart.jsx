import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function LeadChart({ data }) {

  const chartData = {
    labels: data.map(item => item.status),

    datasets: [
      {
        data: data.map(item => item.count),

        backgroundColor: [
          "#3b82f6",
          "#22c55e",
          "#ef4444",
          "#f97316",
        ],
      },
    ],
  };

return (
  <div className="bg-slate-900 rounded-xl p-6">
    <h2 className="text-white text-xl font-bold mb-6">
      Lead Status
    </h2>

    <div className="w-[260px] h-[260px] mx-auto">
      <Pie
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
        }}
      />
    </div>
  </div>
);
}