/* InstructorChart.jsx */
import { useMemo, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Doughnut } from "react-chartjs-2";

Chart.register(...registerables);

export default function InstructorChart({ courses = [] }) {
  const [currChart, setCurrChart] = useState("students"); // "students" | "income"
  const chartRef = useRef(null);

  const labels = useMemo(() => courses.map((c) => c.courseName || "Untitled"), [courses]);
  const studentsData = useMemo(() => courses.map((c) => c.totalStudentsEnrolled ?? 0), [courses]);
  const incomeData = useMemo(() => courses.map((c) => c.totalAmountGenerated ?? 0), [courses]);

  const totalStudents = useMemo(() => studentsData.reduce((a, b) => a + b, 0), [studentsData]);
  const totalIncome = useMemo(() => incomeData.reduce((a, b) => a + b, 0), [incomeData]);

  // deterministic HSL palette
  const colors = useMemo(() => labels.map((_, i) => {
    const hue = (i * 47) % 360;
    const bgSoft = `hsla(${hue} 80% 60% / 0.95)`;
    const border = `hsla(${hue} 80% 30% / 0.12)`;
    return { bgSoft, border };
  }), [labels]);

  const backgroundColor = useMemo(() => colors.map(c => c.bgSoft), [colors]);
  const borderColor = useMemo(() => colors.map(c => c.border), [colors]);

  const dataStudents = useMemo(() => ({
    labels,
    datasets: [{
      label: "Students",
      data: studentsData,
      backgroundColor,
      borderColor,
      borderWidth: 1,
      hoverOffset: 12,
    }],
  }), [labels, studentsData, backgroundColor, borderColor]);

  const dataIncome = useMemo(() => ({
    labels,
    datasets: [{
      label: "Income",
      data: incomeData,
      backgroundColor,
      borderColor,
      borderWidth: 1,
      hoverOffset: 12,
    }],
  }), [labels, incomeData, backgroundColor, borderColor]);

  const chartData = currChart === "students" ? dataStudents : dataIncome;

  const options = useMemo(() => ({
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          boxWidth: 14,
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#0f172a",
          font: { size: 13, weight: 600 },
        },
      },
      tooltip: {
        enabled: true,
        padding: 10,
        backgroundColor: "rgba(15,23,42,0.98)",
        titleColor: "#fff",
        bodyColor: "#e6edf3",
        bodyFont: { weight: 600 },
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || "";
            const value = ctx.formattedValue || "0";
            const dataset = ctx.dataset.data || [];
            const total = dataset.reduce((s, v) => s + Number(v || 0), 0) || 0;
            const pct = total ? ((Number(ctx.raw || 0) / total) * 100).toFixed(1) : "0.0";
            return `${label}: ${value} (${pct}%)`;
          },
        },
      },
    },
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 6, bottom: 6, left: 6, right: 6 } },
  }), []);

  // center text plugin (local, passed via `plugins` prop)
  const centerTextPlugin = useMemo(() => ({
    id: "centerTextPlugin",
    afterDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const { left, top, width, height } = chartArea;
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#0f172a";
      ctx.font = "600 16px Inter, system-ui, -apple-system, 'Segoe UI', Roboto";
      const title = currChart === "students" ? "Students" : "Income";
      ctx.fillText(title, centerX, centerY - 16);

      ctx.fillStyle = "#0b1220";
      ctx.font = "700 18px Inter, system-ui, -apple-system, 'Segoe UI', Roboto";
      const value = currChart === "students" ? totalStudents : `Rs. ${totalIncome ?? 0}`;
      ctx.fillText(value, centerX, centerY + 10);

      ctx.restore();
    },
  }), [currChart, totalStudents, totalIncome]);

  // empty state guard
  if (!courses || courses.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 min-h-[300px]">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-black/60">Not enough data to render charts yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 min-h-[320px]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-lg font-bold text-black">Summary of Your Work So Far</p>
          <p className="text-sm text-black/70 mt-1">Switch between students and income distribution</p>
        </div>

        <div className="inline-flex items-center gap-2 bg-transparent p-1">
          <button
            type="button"
            onClick={() => setCurrChart("students")}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-150 ${currChart === "students"
                ? "bg-gradient-to-tr from-[#ba7bf0] to-[#996bec] text-white shadow"
                : "bg-white/5 text-black/70 hover:bg-white/10"
              }`}
          >
            Students
          </button>

          <button
            type="button"
            onClick={() => setCurrChart("income")}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-150 ${currChart === "income"
                ? "bg-gradient-to-tr from-[#ba7bf0] to-[#996bec] text-white shadow"
                : "bg-white/5 text-black/70 hover:bg-white/10"
              }`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="w-full h-[340px] lg:h-[360px]">
        <Doughnut
          ref={chartRef}
          data={chartData}
          options={options}
          plugins={[centerTextPlugin]}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
        {labels.map((label, i) => (
          <div key={label + i} className="flex items-center gap-3">
            <span style={{ background: backgroundColor[i], width: 12, height: 12, borderRadius: 6 }} />
            <span className="text-xs text-black/80 line-clamp-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
