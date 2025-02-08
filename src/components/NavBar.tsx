"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b border-primary/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-primary font-bold text-xl">
            AI Rockverse
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full transition-all duration-300"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full transition-all duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
