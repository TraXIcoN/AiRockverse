"use client";

import { useState, useEffect, useRef } from "react";
import { openai } from "@/lib/openai";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceSynthesizer } from "@/lib/voiceSynthesis";
import * as Tone from "tone";

interface LyricAssistantProps {
  bpm: number;
  genre: string;
  mood?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
}

const SAMPLE_LYRICS = [
  {
    text: "Through the mist of digital dreams",
    startTime: 0,
    endTime: 4,
  },
  {
    text: "Waves of sound cascade in streams",
    startTime: 4,
    endTime: 8,
  },
  {
    text: "Electronic pulses dance and flow",
    startTime: 8,
    endTime: 12,
  },
  {
    text: "In this space where rhythms grow",
    startTime: 12,
    endTime: 16,
  },
  {
    text: "Synthesized emotions take their flight",
    startTime: 16,
    endTime: 20,
  },
  {
    text: "Through the darkness of the night",
    startTime: 20,
    endTime: 24,
  },
  {
    text: "Every beat tells a story untold",
    startTime: 24,
    endTime: 28,
  },
  {
    text: "As these digital moments unfold",
    startTime: 28,
    endTime: 32,
  },
];

export default function LyricAssistant({
  bpm,
  genre,
  mood,
  isPlaying,
  currentTime,
  duration,
}: LyricAssistantProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [selectedMood, setSelectedMood] = useState(mood || "");
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<VoiceSynthesizer | null>(null);

  const moodOptions = [
    "Melancholic",
    "Energetic",
    "Dreamy",
    "Aggressive",
    "Romantic",
    "Nostalgic",
    "Dark",
    "Uplifting",
    "Mysterious",
    "Peaceful",
  ];

  const generateLyrics = async () => {
    setLoading(true);
    try {
      const timePerLine = (60 / bpm) * 4;
      const spaceBetweenLines = timePerLine * 0.5;

      const timedLyrics = SAMPLE_LYRICS.map((line, index) => ({
        text: line.text,
        startTime: index * (timePerLine + spaceBetweenLines),
        endTime: index * (timePerLine + spaceBetweenLines) + timePerLine,
      }));

      setLyrics(timedLyrics);
      initializeSpeechSynthesis(timedLyrics);
    } catch (err) {
      console.error("Error setting lyrics:", err);
      setError("Failed to set lyrics");
    } finally {
      setLoading(false);
    }
  };

  const initializeSpeechSynthesis = (lines: LyricLine[]) => {
    speechSynthRef.current = new SpeechSynthesisUtterance();
    speechSynthRef.current.rate = bpm / 120;
    speechSynthRef.current.pitch = selectedMood === "Dark" ? 0.8 : 1.2;
  };

  useEffect(() => {
    if (lyrics.length > 0) {
      synthRef.current = new VoiceSynthesizer({
        bpm,
        mood: selectedMood,
        genre,
      });
    }
  }, [lyrics, bpm, selectedMood, genre]);

  useEffect(() => {
    if (!isPlaying || !lyrics.length || !synthRef.current) return;

    const currentLine = lyrics.find(
      (line) => currentTime >= line.startTime && currentTime <= line.endTime
    );

    if (currentLine) {
      const duration = currentLine.endTime - currentLine.startTime;
      synthRef.current.speakLine(currentLine.text, bpm / 60, duration);
    }

    return () => {
      // Cleanup
      Tone.Transport.stop();
    };
  }, [isPlaying, currentTime, lyrics]);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-primary mb-4">
        AI Lyric Assistant
      </h2>

      {/* Input Section - More compact */}
      <div className={`${lyrics.length > 0 ? "mb-2" : "mb-4"}`}>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Enter a theme or topic for your lyrics"
          className="w-full px-4 py-2 mb-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
        />

        <div className="flex flex-wrap gap-1 mb-2">
          {moodOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSelectedMood(option)}
              className={`px-2 py-1 rounded-full text-xs ${
                selectedMood === option
                  ? "bg-primary text-white"
                  : "bg-background border border-primary/20 text-gray-400 hover:border-primary"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={generateLyrics}
          disabled={loading || !selectedMood || !theme}
          className={`w-full py-2 px-4 rounded-lg ${
            loading || !selectedMood || !theme
              ? "bg-primary/50 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          } text-white transition-colors`}
        >
          {loading ? "Loading..." : "Generate Lyrics"}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      {/* Lyrics Display - Fixed height for 8 lines */}
      {lyrics.length > 0 && (
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-lg bg-background-dark/50 
                    scrollbar-thin scrollbar-thumb-primary scrollbar-track-background-light
                    hover:scrollbar-thumb-primary-dark transition-colors"
        >
          <AnimatePresence>
            {lyrics.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity:
                    currentTime >= line.startTime && currentTime <= line.endTime
                      ? 1
                      : 0.6,
                  y: 0,
                  scale:
                    currentTime >= line.startTime && currentTime <= line.endTime
                      ? 1.05
                      : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`p-4 text-center text-lg transition-all whitespace-nowrap overflow-hidden text-ellipsis ${
                  currentTime >= line.startTime && currentTime <= line.endTime
                    ? "text-primary font-bold"
                    : "text-gray-400"
                }`}
                style={{
                  height: "3rem", // Fixed height for each line
                  lineHeight: "1.5rem", // Consistent line height
                }}
              >
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
