"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDetailedAnalysis } from "@/lib/db";
import type { TrackAnalysis } from "@/lib/db";

export default function TrackDetailPage() {
  const params = useParams();
  const [track, setTrack] = useState<TrackAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrackDetails() {
      try {
        const trackData = await getDetailedAnalysis(params.id as string);
        setTrack(trackData);
      } catch (err) {
        setError("Failed to load track details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTrackDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-primary">Analyzing track...</div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-500">{error || "Track not found"}</div>
      </div>
    );
  }

  const { detailed } = track.aiFeedback;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {track.fileName}
          </h1>
          <p className="text-gray-400">
            Uploaded on {new Date(track.createdAt).toLocaleDateString()}
          </p>
        </div>

        {detailed && (
          <div className="space-y-8">
            {/* Score and Genre */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                <h2 className="text-xl font-bold text-primary mb-2">Score</h2>
                <div className="text-4xl font-bold text-primary">
                  {detailed.score}/100
                </div>
              </div>
              <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                <h2 className="text-xl font-bold text-primary mb-2">Genre</h2>
                <div className="text-4xl font-bold text-primary">
                  {detailed.genre}
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div className="bg-background-light p-6 rounded-xl border border-primary/20">
              <h2 className="text-xl font-bold text-primary mb-4">
                Suggested Improvements
              </h2>
              <ul className="space-y-2">
                {detailed.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-gray-300">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths */}
            <div className="bg-background-light p-6 rounded-xl border border-primary/20">
              <h2 className="text-xl font-bold text-primary mb-4">
                Track Strengths
              </h2>
              <ul className="space-y-2">
                {detailed.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span className="text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Feedback */}
            <div className="bg-background-light p-6 rounded-xl border border-primary/20">
              <h2 className="text-xl font-bold text-primary mb-4">
                Technical Analysis
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    Mixing
                  </h3>
                  <p className="text-gray-300">
                    {detailed.technicalFeedback.mixing}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    Arrangement
                  </h3>
                  <p className="text-gray-300">
                    {detailed.technicalFeedback.arrangement}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    Sound Design
                  </h3>
                  <p className="text-gray-300">
                    {detailed.technicalFeedback.sound_design}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
