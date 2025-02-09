"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import UsernameForm from "./UsernameForm";

export default function Navbar() {
  const { signOut, userData } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed w-full top-0 z-50 px-4 transition-all duration-500 ease-in-out transform ${
          isVisible
            ? "translate-y-4 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-background-light/90 backdrop-blur-sm rounded-full px-4 md:px-8 py-3 md:py-4 shadow-lg border border-primary/20 hover:border-primary/40 transition-all duration-300 ease-bounce hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex-shrink-0">
                <Link
                  href="/"
                  className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent hover:scale-110 transition-transform duration-300 inline-block"
                >
                  GrooveBot
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-primary hover:text-primary-light transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Links - Desktop */}
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-110"
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-110"
                >
                  Upload
                </Link>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-110"
                >
                  Update Profile
                </button>
                <button
                  onClick={signOut}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-background-light rounded-lg p-6 max-w-md w-full mx-4 animate-slideUp">
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
