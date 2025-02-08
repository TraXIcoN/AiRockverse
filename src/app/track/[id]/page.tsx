"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDetailedAnalysis } from "@/lib/db";
import type { TrackAnalysis } from "@/lib/db";
import Navbar from "@/components/NavBar";
import DAW from "@/components/DAW";
import LyricAssistant from "@/components/LyricAssistant";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function TrackDetailPage() {
  const params = useParams();
  const [track, setTrack] = useState<TrackAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  const handlePlaybackStateChange = (
    playing: boolean,
    time: number,
    total: number
  ) => {
    setIsPlaying(playing);
    setCurrentTime(time);
    setDuration(total);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 p-8 flex items-center justify-center">
          <div className="text-primary">Analyzing track...</div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 p-8 flex items-center justify-center">
          <div className="text-red-500">{error || "Track not found"}</div>
        </div>
      </div>
    );
  }

  const { detailed } = track.aiFeedback;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Track Title and Basic Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              {track.fileName}
            </h1>
            <p className="text-gray-400">
              Uploaded on {new Date(track.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Collapsible Analysis Section */}
          <div className="mb-8 bg-background-light rounded-xl border border-primary/20 overflow-hidden">
            <button
              onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-bold text-primary">Track Analysis</h2>
              {isAnalysisExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-primary" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-primary" />
              )}
            </button>

            {isAnalysisExpanded && track?.aiFeedback.detailed && (
              <div className="px-6 pb-6 space-y-6">
                {/* Score and Genre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                    <h2 className="text-xl font-bold text-primary mb-2">
                      Score
                    </h2>
                    <div className="text-4xl font-bold text-primary">
                      {detailed.score}/100
                    </div>
                  </div>
                  <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                    <h2 className="text-xl font-bold text-primary mb-2">
                      Genre
                    </h2>
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

          {/* DAW and Lyrics Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
            <div className="bg-background-light rounded-xl border border-primary/20 p-6 h-full">
              <h2 className="text-xl font-bold text-primary mb-4">
                Live Editor
              </h2>
              {track && (
                <DAW
                  audioUrl={track.ipfsUrl}
                  bpm={track.analysis.bpm}
                  genre={track.aiFeedback.detailed?.genre || "Unknown"}
                  mood={track.aiFeedback.detailed?.mood}
                  onPlaybackStateChange={handlePlaybackStateChange}
                />
              )}
            </div>

            <div className="bg-background-light rounded-xl border border-primary/20 p-6 h-full">
              {track && track.aiFeedback.detailed && (
                <LyricAssistant
                  bpm={track.analysis.bpm}
                  genre={track.aiFeedback.detailed.genre}
                  mood={track.aiFeedback.detailed.mood}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
