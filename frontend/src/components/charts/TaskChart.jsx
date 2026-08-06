import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function TaskChart({ data }) {

  const chartData = {
    labels: data.map(item => item.status),

    datasets: [
      {
        data: data.map(item => item.count),

        backgroundColor: [
          "#22c55e",
          "#f59e0b",
        ],
      },
    ],
  };

  return (
  <div className="bg-slate-900 rounded-xl p-6">
    <h2 className="text-white text-xl font-bold mb-6">
      Task Status
    </h2>

    <div className="w-[260px] h-[260px] mx-auto">
      <Doughnut
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