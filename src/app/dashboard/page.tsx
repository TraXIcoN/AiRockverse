"use client";

import { useAuth } from "@/context/AuthContext";
import WaveBackground from "@/components/WaveBackground";
import Link from "next/link";
import TrackHistory from "@/components/TrackHistory";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
export default function Dashboard() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const username =
    userData?.displayName || user?.email?.split("@")[0] || "Producer";

  return (
    <div className="relative min-h-screen mt-24">
      <WaveBackground />
      <main className="relative z-10 p-8">
        {/* Hero Section with Stats */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
          {/* Left Side - Hero Text */}
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent mb-4">
              Hi, {username}!
            </h1>
            <p className="text-xl text-gray-400 max-w-lg">
              Track your progress and improve your beats with AI-powered
              analysis
            </p>
          </div>

          {/* Right Side - Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tracks Analyzed */}
            <div className="bg-background-light p-6 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all">
              <h3 className="text-gray-400 mb-2">Tracks Analyzed</h3>
              <p className="text-4xl font-bold text-primary-light">0</p>
            </div>

            {/* Average Score */}
            <div className="bg-background-light p-6 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all">
              <h3 className="text-gray-400 mb-2">Average Score</h3>
              <p className="text-4xl font-bold text-primary-light">N/A</p>
            </div>

            {/* NFTs Earned */}
            <div className="bg-background-light p-6 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all">
              <h3 className="text-gray-400 mb-2">NFTs Earned</h3>
              <p className="text-4xl font-bold text-primary-light">0</p>
            </div>

            {/* NFT Gallery Link */}
            <button
              onClick={() => router.push("/nfts")}
              className="bg-background-light p-6 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group w-full text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-gray-400 mb-2">NFT Gallery</h3>
                  <p className="text-4xl font-bold text-primary-light">
                    View →
                  </p>
                </div>
                <svg
                  className="w-6 h-6 text-primary-light transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
          {/* Left Side - Upload Button */}
          <div className="flex items-center justify-center h-full">
            <button
              className="w-128 py-16 rounded-full bg-primary/20 hover:bg-primary/30
                         border-2 border-dashed border-primary/40 hover:border-primary/60 
                         flex flex-col items-center justify-center transition-all
                         group hover:scale-105 rounded-[40px]"
            >
              <svg
                className="w-24 h-24 text-primary-light group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 8l0 8 M8 12l4 -4l4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="mt-4 text-xl text-primary-light font-medium">
                <FileUpload />
              </span>
            </button>
          </div>

          {/* Right Side - Upload Instructions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary-light">
              How it works
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary-light">
                  1
                </span>
                <p className="text-gray-400">
                  Drop your audio file or click to upload (MP3, WAV formats
                  supported)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary-light">
                  2
                </span>
                <p className="text-gray-400">
                  Our AI analyzes your track's key features, including tempo,
                  energy, and structure
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary-light">
                  3
                </span>
                <p className="text-gray-400">
                  Get detailed feedback and suggestions to improve your
                  production
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Track History Section */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-background-light p-6 rounded-xl border border-primary/20">
            <h2 className="text-xl font-bold text-primary mb-4">
              Recent Activity
            </h2>
            <TrackHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
