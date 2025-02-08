"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/NavBar";
import FileUpload from "@/components/FileUpload";
import TrackHistory from "@/components/TrackHistory";

export default function DashboardPage() {
  const { user, userData, loading, error } = useAuth();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Centered Welcome Message */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
            Hi, {userData?.displayName || "Producer"}!
          </h1>
          <p className="text-gray-400 mt-2">
            Track your progress and improve your beats
          </p>
        </div>

        {showUpload ? (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background-light rounded-lg p-6 max-w-3xl w-full mx-4 relative">
              <button
                onClick={() => setShowUpload(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-primary mb-6 text-center">
                Upload Your Track
              </h2>
              <FileUpload />
            </div>
          </div>
        ) : null}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Tracks Analyzed", value: "0" },
            { label: "Average Score", value: "N/A" },
            { label: "NFTs Earned", value: "0" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-background-light p-6 rounded-xl border border-primary/20"
            >
              <h3 className="text-gray-400 mb-2">{stat.label}</h3>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="bg-background-light p-6 rounded-xl border border-primary/20 mb-8">
          <h2 className="text-xl font-bold text-primary mb-4">
            Upload New Track
          </h2>
          <div
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center h-40 border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="text-center">
              <p className="text-gray-400 mb-2">
                Click here to upload your audio file
              </p>
              <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors">
                Upload Track
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background-light p-6 rounded-xl border border-primary/20">
          <h2 className="text-xl font-bold text-primary mb-4">
            Recent Activity
          </h2>
          <TrackHistory />
        </div>
      </div>
    </div>
  );
}
