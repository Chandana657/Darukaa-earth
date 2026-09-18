import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

export default function MetricChart({ metrics, field, label, color }) {
  const data = {
    labels: metrics.map((m) =>
      new Date(m.recorded_date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      }),
    ),
    datasets: [
      {
        label,
        data: metrics.map((m) => m[field]),
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } },
  };

  return <Line data={data} options={options} />;
}
