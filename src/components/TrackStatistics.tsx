"use client";

import { useState } from "react";
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

  const metricLabels = {
    genres: "Genres",
    moods: "Moods",
    bpmRanges: "BPM Distribution",
    energyRanges: "Energy Levels",
  };

  // Debug log
  console.error("Tracks received:", tracks);

  // Process track data for statistics
  const processData = () => {
    if (!tracks || tracks.length === 0) {
      return {
        genres: { "No Data": 1 },
        moods: { "No Data": 1 },
        bpmRanges: { "No Data": 1 },
        energyRanges: { "No Data": 1 },
      };
    }

    const genres: { [key: string]: number } = {};
    const moods: { [key: string]: number } = {};
    const bpmRanges: { [key: string]: number } = {};
    const energyRanges: { [key: string]: number } = {};

    tracks.forEach((track) => {
      // Genre count
      const genre = track.aiFeedback?.genre || "Unknown";
      genres[genre] = (genres[genre] || 0) + 1;

      // Mood count
      const mood = track.aiFeedback?.mood || "Unknown";
      moods[mood] = (moods[mood] || 0) + 1;

      // BPM ranges
      const bpm = track.analysis?.bpm || 0;
      const bpmRange = getBpmRange(bpm);
      bpmRanges[bpmRange] = (bpmRanges[bpmRange] || 0) + 1;

      // Energy ranges
      const energy = track.analysis?.averageEnergy || 0;
      const energyRange = getEnergyRange(energy);
      energyRanges[energyRange] = (energyRanges[energyRange] || 0) + 1;
    });

    return { genres, moods, bpmRanges, energyRanges };
  };

  const getBpmRange = (bpm: number): string => {
    if (bpm < 90) return "<90 BPM";
    if (bpm < 110) return "90-110 BPM";
    if (bpm < 130) return "110-130 BPM";
    if (bpm < 150) return "130-150 BPM";
    return ">150 BPM";
  };

  const getEnergyRange = (energy: number): string => {
    if (energy < 20) return "Very Low";
    if (energy < 40) return "Low";
    if (energy < 60) return "Medium";
    if (energy < 80) return "High";
    return "Very High";
  };

  const { genres, moods, bpmRanges, energyRanges } = processData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#9CA3AF",
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const getDataForMetric = (metric: string) => {
    switch (metric) {
      case "genres":
        return genres;
      case "moods":
        return moods;
      case "bpmRanges":
        return bpmRanges;
      case "energyRanges":
        return energyRanges;
      default:
        return genres;
    }
  };

  const createChartData = (data: { [key: string]: number }, label: string) => ({
    labels: Object.keys(data),
    datasets: [
      {
        label,
        data: Object.values(data),
        backgroundColor: [
          "rgba(139, 92, 246, 0.8)", // primary
          "rgba(167, 139, 250, 0.8)", // primary-light
          "rgba(124, 58, 237, 0.8)", // primary-dark
          "rgba(139, 92, 246, 0.6)",
          "rgba(167, 139, 250, 0.6)",
          "rgba(124, 58, 237, 0.6)",
        ],
        borderColor: [
          "rgba(139, 92, 246, 1)",
          "rgba(167, 139, 250, 1)",
          "rgba(124, 58, 237, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(167, 139, 250, 1)",
          "rgba(124, 58, 237, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });

  return (
    <div className="bg-background-light/50 border border-primary/20 rounded-xl p-4 lg:p-6 lg:sticky lg:top-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as any)}
          className="w-full sm:w-auto bg-background-light border border-primary/20 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-primary/40"
        >
          {Object.entries(metricLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
              metricLabels[selectedMetric]
            )}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  position: window.innerWidth < 640 ? "bottom" : "right",
                },
              },
            }}
          />
        ) : (
          <Bar
            data={createChartData(
              getDataForMetric(selectedMetric),
              metricLabels[selectedMetric]
            )}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins.legend,
                  position: window.innerWidth < 640 ? "bottom" : "right",
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
