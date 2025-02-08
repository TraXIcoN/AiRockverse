"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import UsernameForm from "./UsernameForm";

export default function Navbar() {
  const { signOut, userData } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <nav className="fixed w-full top-4 z-50 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background-light/90 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-primary/20">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex-shrink-0">
                <Link
                  href="/"
                  className="text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent"
                >
                  AI Rockverse
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Upload
                </Link>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  Update Profile
                </button>
                <button
                  onClick={signOut}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-light rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Update Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 mb-2">
                Current Username: {userData?.displayName || "Not set"}
              </p>
            </div>
            <UsernameForm onSuccess={() => setShowProfileModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}
