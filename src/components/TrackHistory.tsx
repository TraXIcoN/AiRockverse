"use client";

import { useEffect, useState } from "react";
import { getUserTracks, TrackAnalysis } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function TrackHistory() {
  const [tracks, setTracks] = useState<TrackAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadTracks() {
      if (!user) return;

      try {
        const userTracks = await getUserTracks(user.uid);
        setTracks(userTracks);
      } catch (err) {
        setError("Failed to load tracks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTracks();
  }, [user]);

  if (loading) {
    return <div className="text-center py-4">Loading tracks...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No tracks analyzed yet</p>
        <p className="text-sm">Upload your first track to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <div
          key={track.id}
          className="bg-background-light p-6 rounded-xl border border-primary/20"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {track.fileName}
              </h3>
              <p className="text-sm text-gray-400">
                Analyzed on {new Date(track.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <a
                href={track.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light"
              >
                Listen
              </a>
              <Link
                href={`/track/${track.id}`}
                className="text-primary hover:text-primary-light"
              >
                View Detailed Analysis
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-md font-semibold text-primary mb-2">
              Analysis Results
            </h4>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-background p-4 rounded-md">
              {JSON.stringify(track.aiFeedback)}
            </pre>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">BPM</p>
              <p className="text-primary">{track.analysis.bpm}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Loudness</p>
              <p className="text-primary">
                {track.analysis.loudness.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Frequency Balance</p>
              <p className="text-primary">
                {(
                  (track.analysis.frequency.low +
                    track.analysis.frequency.mid +
                    track.analysis.frequency.high) /
                  3
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
