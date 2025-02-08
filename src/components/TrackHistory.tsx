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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const TrackItem = ({ track }: { track: any }) => (
    <div className="border border-primary/20 rounded-lg p-4 mb-4 bg-background/50">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-primary-light text-lg">{track.fileName}</h3>
        <span className="text-sm text-gray-400">
          {formatDate(track.createdAt)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-gray-400">BPM</p>
          <p className="text-primary-light">
            {formatValue(track.analysis?.bpm)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Energy</p>
          <p className="text-primary-light">
            {formatValue(track.analysis?.averageEnergy)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Loudness</p>
          <p className="text-primary-light">
            {formatValue(track.analysis?.averageLoudness)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Sections</p>
          <p className="text-primary-light">
            {track.analysis?.sections?.length || 0}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Genre: </span>
          <span className="text-primary-light">
            {track.aiFeedback?.genre || "Unknown"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Mood: </span>
          <span className="text-primary-light">
            {track.aiFeedback?.mood || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Always show the most recent track */}
      <TrackItem track={tracks[0]} />

      {/* Collapsible section for two more tracks */}
      {tracks.length > 1 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-light hover:text-primary transition-colors mb-4 flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </>
            ) : (
              <>
                <span>Show More</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>

          {isExpanded && (
            <div className="space-y-4">
              {tracks.slice(1, 3).map((track, index) => (
                <TrackItem key={index} track={track} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link to archive */}
      <div className="mt-6 text-center">
        <Link
          href="/archive"
          className="text-primary-light hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          View All Tracks
          <svg
            className="w-4 h-4"
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
        </Link>
      </div>
    </div>
  );
}
