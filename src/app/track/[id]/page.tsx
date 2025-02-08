"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadTrackDetails } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Navbar from "@/components/NavBar";
import DAW from "@/components/DAW";
import LyricAssistant from "@/components/LyricAssistant";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import LyricsDisplay from "@/components/LyricsDisplay";

export default function TrackDetails() {
  const params = useParams();
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        // Log the params to debug
        console.log("Route params:", params);

        // Extract the track ID
        const trackId = params?.id;
        if (!trackId || typeof trackId !== "string") {
          throw new Error("Invalid track ID");
        }

        console.log("Fetching track with ID:", trackId);
        const trackData = await loadTrackDetails(trackId);
        console.log("Loaded track data:", trackData);

        setTrack(trackData);
        setLyrics(trackData.aiFeedback?.detailed?.lyrics || []);
      } catch (err) {
        console.error("Error fetching track:", err);
        setError(err instanceof Error ? err.message : "Failed to load track");
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [params]);

  const handlePlaybackStateChange = (
    playing: boolean,
    time: number,
    total: number
  ) => {
    setIsPlaying(playing);
    setCurrentTime(time);
    setDuration(total);
  };

  const formatValue = (value: any) => {
    if (value === undefined || value === null) return "N/A";
    return typeof value === "number" ? value.toFixed(2) : value;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      if (timestamp instanceof Timestamp) {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
      }
      if (timestamp instanceof Date) {
        return formatDistanceToNow(timestamp, { addSuffix: true });
      }
      if (typeof timestamp === "number") {
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
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 p-8 flex items-center justify-center">
          <div className="text-primary">Loading track...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 p-8 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 p-8 flex items-center justify-center">
          <div className="text-gray-400">Track not found</div>
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
              Uploaded {formatDate(track.createdAt)}
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

            {isAnalysisExpanded && (
              <div className="px-6 pb-6 space-y-6">
                {/* Score and Genre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                    <h2 className="text-xl font-bold text-primary mb-2">
                      Genre
                    </h2>
                    <div className="text-2xl font-bold text-primary">
                      {track.aiFeedback?.genre || "Unknown"}
                    </div>
                    {track.aiFeedback?.subgenres &&
                      track.aiFeedback.subgenres.length > 0 && (
                        <div className="mt-2 text-gray-400">
                          {track.aiFeedback.subgenres.join(", ")}
                        </div>
                      )}
                  </div>
                  <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                    <h2 className="text-xl font-bold text-primary mb-2">
                      Mood
                    </h2>
                    <div className="text-2xl font-bold text-primary">
                      {track.aiFeedback?.mood || "Unknown"}
                    </div>
                    {track.aiFeedback?.moodTags &&
                      track.aiFeedback.moodTags.length > 0 && (
                        <div className="mt-2 text-gray-400">
                          {track.aiFeedback.moodTags.join(", ")}
                        </div>
                      )}
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                  <h2 className="text-xl font-bold text-primary mb-4">
                    Audio Analysis
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-400">BPM</p>
                      <p className="text-xl font-bold text-primary">
                        {track.analysis?.bpm || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Energy</p>
                      <p className="text-xl font-bold text-primary">
                        {track.analysis?.averageEnergy?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Loudness</p>
                      <p className="text-xl font-bold text-primary">
                        {track.analysis?.averageLoudness?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Dynamic Range</p>
                      <p className="text-xl font-bold text-primary">
                        {track.analysis?.dynamics?.dynamicRange?.toFixed(2) ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Production Quality */}
                <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                  <h2 className="text-xl font-bold text-primary mb-4">
                    Production Quality
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        Strengths
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {track.aiFeedback?.productionQuality?.strengths?.map(
                          (strength: string, index: number) => (
                            <li key={index} className="text-gray-300">
                              {strength}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        Areas to Improve
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {track.aiFeedback?.productionQuality?.weaknesses?.map(
                          (weakness: string, index: number) => (
                            <li key={index} className="text-gray-300">
                              {weakness}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Technical Feedback */}
                <div className="bg-background-light p-6 rounded-xl border border-primary/20">
                  <h2 className="text-xl font-bold text-primary mb-4">
                    Technical Feedback
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        Mixing
                      </h3>
                      <p className="text-gray-300">
                        {track.aiFeedback?.technicalFeedback?.mixing}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        Arrangement
                      </h3>
                      <p className="text-gray-300">
                        {track.aiFeedback?.technicalFeedback?.arrangement}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        Sound Design
                      </h3>
                      <p className="text-gray-300">
                        {track.aiFeedback?.technicalFeedback?.sound_design}
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
                  bpm={track.analysis?.bpm || 120}
                  genre={track.aiFeedback?.genre || "Unknown"}
                  mood={track.aiFeedback?.mood || "Unknown"}
                  onPlaybackStateChange={handlePlaybackStateChange}
                />
              )}
            </div>

            <div className="bg-background-light rounded-xl border border-primary/20 p-6 h-full">
              {track && (
                <LyricAssistant
                  bpm={track.analysis?.bpm || 120}
                  genre={track.aiFeedback?.genre || "Unknown"}
                  mood={track.aiFeedback?.mood || "Unknown"}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  songId={track.id}
                />
              )}
            </div>
          </div>

          {lyrics.length > 0 && (
            <LyricsDisplay
              lyrics={lyrics}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              bpm={track.analysis?.bpm || 120}
              mood={track.aiFeedback?.mood || "Unknown"}
              genre={track.aiFeedback?.genre || "Unknown"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
