"use client";

import { useState } from "react";
import { createUserDocument } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

interface UsernameFormProps {
  onSuccess?: () => void;
}

export default function UsernameForm({ onSuccess }: UsernameFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user, updateUserDataLocally } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User not authenticated");
      return;
    }

    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const userData = {
        uid: user.uid,
        displayName: username.trim(),
        email: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create user document with the new username
      await createUserDocument(user.uid, userData);

      // Update local state immediately
      updateUserDataLocally(userData);

      setSuccess(true);

      // Call the success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000); // Give user time to see success message
      }
    } catch (err) {
      console.error("Error setting username:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to set username. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-primary">
        Choose Your Username
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 mb-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-md p-3 mb-4">
          <p className="text-green-500 text-sm">
            Username updated successfully! The changes will be reflected across
            the app shortly.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-gray-300 text-sm font-medium mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
            placeholder="Enter your username"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3 px-4 rounded-md text-white font-medium
            transition-all duration-200
            ${
              loading
                ? "bg-primary/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark active:transform active:scale-[0.98]"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Setting Username...
            </span>
          ) : (
            "Set Username"
          )}
        </button>
      </form>
    </div>
  );
}
