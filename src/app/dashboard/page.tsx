"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Protect the dashboard route
  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  // Get user display name or email
  const getUserDisplayName = () => {
    if (!user) return "Producer";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0]; // Get the part before @ in email
    return "Producer";
  };

  if (!user) return null; // Don't render anything while checking auth

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Welcome, {getUserDisplayName()}
            </h1>
            <p className="text-gray-400">
              Track your progress and improve your beats
            </p>
          </div>
          <button
            onClick={signOut}
            className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-all duration-200"
          >
            Sign Out
          </button>
        </div>

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
          <div className="flex items-center justify-center h-40 border-2 border-dashed border-primary/20 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 mb-2">
                Drag and drop your audio file here
              </p>
              <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-all duration-200">
                Select File
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background-light p-6 rounded-xl border border-primary/20">
          <h2 className="text-xl font-bold text-primary mb-4">
            Recent Activity
          </h2>
          <div className="text-center text-gray-400 py-8">
            <p>No activity yet</p>
            <p className="text-sm">Upload your first track to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
