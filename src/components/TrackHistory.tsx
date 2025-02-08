"use client";

import { useEffect, useState } from "react";
import { getUserTracks, TrackAnalysis } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";

export default function TrackHistory() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadTracks = async () => {
      if (user) {
        try {
          const userTracks = await getUserTracks(user.uid);
          setTracks(userTracks);
        } catch (error) {
          console.error("Error loading tracks:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTracks();
  }, [user]);

  const formatValue = (value: any) => {
    if (value === undefined || value === null) return "N/A";
    return typeof value === "number" ? value.toFixed(2) : value;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      // Handle Firestore Timestamp
      if (timestamp instanceof Timestamp) {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
      }
      // Handle regular Date objects
      if (timestamp instanceof Date) {
        return formatDistanceToNow(timestamp, { addSuffix: true });
      }
      // Handle timestamp numbers
      if (typeof timestamp === "number") {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      }
      // Handle timestamp strings
      if (typeof timestamp === "string") {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      }

      return "";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No tracks analyzed yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tracks.map((track, index) => {
        // Debug log to check track data
        console.log("Track in list:", track);

        if (!track.id) {
          console.warn("Track missing ID:", track);
          return null;
        }

        return (
          <Link
            key={track.id}
            href={`/track/${track.id}`}
            className="block hover:bg-background-light transition-colors duration-200"
          >
            <div className="border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  {track.fileName}
                </h3>
                <span className="text-sm text-gray-400">
                  {track.createdAt &&
                    formatDistanceToNow(
                      typeof track.createdAt === "string"
                        ? new Date(track.createdAt)
                        : track.createdAt instanceof Timestamp
                        ? track.createdAt.toDate()
                        : new Date(),
                      { addSuffix: true }
                    )}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">BPM</p>
                  <p className="text-primary">
                    {formatValue(track.analysis?.bpm)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Energy</p>
                  <p className="text-primary">
                    {formatValue(track.analysis?.averageEnergy)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Loudness</p>
                  <p className="text-primary">
                    {formatValue(track.analysis?.averageLoudness)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Sections</p>
                  <p className="text-primary">
                    {track.analysis?.sections?.length || 0}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-400">Genre</p>
                <p className="text-primary">
                  {track.aiFeedback?.genre || "Unknown"}
                </p>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-400">Mood</p>
                <p className="text-primary">
                  {track.aiFeedback?.mood || "Unknown"}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
