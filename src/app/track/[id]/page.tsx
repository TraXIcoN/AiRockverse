"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { loadTrackDetails } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Navbar from "@/components/NavBar";
import DAW from "@/components/DAW";
import LyricAssistant from "@/components/LyricAssistant";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import LyricsDisplay from "@/components/LyricsDisplay";
import MintNFTButton from "@/components/MintNFTButton";
import WaveBackground from "@/components/WaveBackground";
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
  const dawRef = useRef<{ exportAudio: () => Promise<Blob> }>(null);
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);

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

  useEffect(() => {
    const fetchAudio = async () => {
      if (track?.ipfsUrl) {
        try {
          console.log("Fetching audio from:", track.ipfsUrl);
          const response = await fetch(track.ipfsUrl);
          const buffer = await response.arrayBuffer();
          setAudioBuffer(buffer);
          console.log("Audio buffer loaded successfully");
        } catch (error) {
          console.error("Error fetching audio:", error);
        }
      }
    };

    fetchAudio();
  }, [track?.ipfsUrl]);

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

  // Function to export current track state with changes
  const exportCurrentTrack = async () => {
    try {
      // Get the current audio state from DAW component
      // This will include any effects and changes made
      const audioBlob = await dawRef.current?.exportAudio();
      if (audioBlob) {
        setAudioBuffer(await audioBlob.arrayBuffer());
      }
    } catch (error) {
      console.error("Error exporting track:", error);
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <WaveBackground />
      <div className="flex-1 pt-24 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Track Title and Basic Info */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                {track?.fileName}
              </h1>
              <p className="text-gray-400">
                Uploaded {formatDate(track?.createdAt)}
              </p>
            </div>

            {/* Add MintNFTButton with debug info */}
            <div>
              {!track && (
                <p className="text-sm text-gray-400">Track data not loaded</p>
              )}
              {track && !audioBuffer && (
                <p className="text-sm text-gray-400">Loading audio...</p>
              )}
              {track && audioBuffer && (
                <MintNFTButton
                  audioFile={
                    new File([audioBuffer], track.fileName, {
                      type: "audio/mpeg",
                    })
                  }
                  trackMetadata={{
                    name: track.fileName,
                    description: `${
                      track.aiFeedback?.genre || "Unknown"
                    } track at ${track.analysis?.bpm || 120} BPM`,
                    genre: track.aiFeedback?.genre || "Unknown",
                    bpm: track.analysis?.bpm || 120,
                    duration: track.analysis?.duration || 0,
                  }}
                />
              )}
            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-background-light rounded-xl border border-primary/20 p-6">
              <h2 className="text-xl font-bold text-primary mb-4">
                Live Editor
              </h2>
              <div className="h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent hover:scrollbar-thumb-purple-400">
                {track && (
                  <DAW
                    ref={dawRef}
                    audioUrl={track.ipfsUrl}
                    bpm={track.analysis?.bpm || 120}
                    genre={track.aiFeedback?.genre || "Unknown"}
                    mood={track.aiFeedback?.mood || "Unknown"}
                    onPlaybackStateChange={handlePlaybackStateChange}
                  />
                )}
              </div>
            </div>

            <div className="bg-background-light rounded-xl border border-primary/20 p-6">
              <div className="h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent hover:scrollbar-thumb-purple-400">
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
          </div>

          {/* Lyrics Display Section */}
          {lyrics.length > 0 && (
            <div className="mb-8">
              <LyricsDisplay
                lyrics={lyrics}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                bpm={track.analysis?.bpm || 120}
                mood={track.aiFeedback?.mood || "Unknown"}
                genre={track.aiFeedback?.genre || "Unknown"}
              />
            </div>
          )}
        </div>
      </div>

      {/* NFT Publishing Section as Footer */}
      <div className="w-full bg-background-light border-t border-primary/20 mt-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">
              Ready to Publish?
            </h2>
            <p className="text-gray-400 text-center max-w-2xl">
              Export your track with all current changes and publish it as an
              NFT on the blockchain. This will create a permanent record of your
              musical creation.
            </p>

            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={exportCurrentTrack}
                className="px-8 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-lg transition-colors"
              >
                Export Current Version
              </button>

              {track && audioBuffer && (
                <MintNFTButton
                  audioFile={
                    new File([audioBuffer], track.fileName, {
                      type: "audio/mpeg",
                    })
                  }
                  trackMetadata={{
                    name: track.fileName,
                    description: `${
                      track.aiFeedback?.genre || "Unknown"
                    } track at ${track.analysis?.bpm || 120} BPM`,
                    genre: track.aiFeedback?.genre || "Unknown",
                    bpm: track.analysis?.bpm || 120,
                    duration: track.analysis?.duration || 0,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
