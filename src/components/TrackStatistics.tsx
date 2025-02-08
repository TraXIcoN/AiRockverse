"use client";

import { useState, useMemo } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TrackStatisticsProps {
  tracks: any[];
}

export default function TrackStatistics({ tracks }: TrackStatisticsProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [selectedMetric, setSelectedMetric] = useState<
    "genres" | "moods" | "bpmRanges" | "energyRanges"
  >("genres");

  // Process track data for statistics using useMemo
  const processedData = useMemo(() => {
    const genres: { [key: string]: number } = {};
    const moods: { [key: string]: number } = {};
    const bpmRanges: { [key: string]: number } = {};
    const energyRanges: { [key: string]: number } = {};

    tracks.forEach((track) => {
      // Process genres
      const genre = track.aiFeedback?.genre || "unknown";
      genres[genre] = (genres[genre] || 0) + 1;

      // Process moods
      const mood = track.aiFeedback?.mood || "unknown";
      moods[mood] = (moods[mood] || 0) + 1;

      // Process BPM ranges
      const bpm = track.analysis?.bpm || 0;
      const bpmRange = bpm > 150 ? ">150 BPM" : "<150 BPM";
      bpmRanges[bpmRange] = (bpmRanges[bpmRange] || 0) + 1;

      // Process energy levels
      const energy = track.analysis?.energy || "Medium";
      energyRanges[energy] = (energyRanges[energy] || 0) + 1;
    });

    return { genres, moods, bpmRanges, energyRanges };
  }, [tracks]); // Only recompute when tracks change

  const getDataForMetric = (metric: string) => {
    switch (metric) {
      case "genres":
        return processedData.genres;
      case "moods":
        return processedData.moods;
      case "bpmRanges":
        return processedData.bpmRanges;
      case "energyRanges":
        return processedData.energyRanges;
      default:
        return {};
    }
  };

  const createChartData = (data: any, label: string) => ({
    labels: Object.keys(data),
    datasets: [
      {
        label,
        data: Object.values(data),
        backgroundColor: [
          "rgba(147, 51, 234, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(192, 132, 252, 0.8)",
          "rgba(216, 180, 254, 0.8)",
          "rgba(233, 213, 255, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "rgb(229, 231, 235)",
        },
      },
    },
  };

  return (
    <div className="bg-background-light/50 border border-primary/20 rounded-xl p-4 lg:p-6 lg:sticky lg:top-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as any)}
          className="w-full sm:w-auto bg-background-light border border-primary/20 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-primary/40"
        >
          <option value="genres">Genres</option>
          <option value="moods">Moods</option>
          <option value="bpmRanges">BPM Distribution</option>
          <option value="energyRanges">Energy Levels</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("pie")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              chartType === "pie"
                ? "bg-primary text-white"
                : "bg-background-light text-gray-400 hover:text-primary"
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              chartType === "bar"
                ? "bg-primary text-white"
                : "bg-background-light text-gray-400 hover:text-primary"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="h-[250px] sm:h-[300px] lg:h-[400px] relative">
        {chartType === "pie" ? (
          <Pie
            data={createChartData(
              getDataForMetric(selectedMetric),
              selectedMetric
            )}
            options={chartOptions}
          />
        ) : (
          <Bar
            data={createChartData(
              getDataForMetric(selectedMetric),
              selectedMetric
            )}
            options={chartOptions}
          />
        )}
      </div>
    </div>
  );
}
