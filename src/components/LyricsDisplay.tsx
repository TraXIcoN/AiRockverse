"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceSynthesizer } from "@/lib/voiceSynthesis";
import * as Tone from "tone";

interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
}

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bpm: number;
  mood: string;
  genre: string;
}

export default function LyricsDisplay({
  lyrics = [],
  isPlaying: musicPlaying,
  currentTime,
  duration,
  bpm,
  mood,
  genre,
}: LyricsDisplayProps) {
  const [activeLine, setActiveLine] = useState<number>(0);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<VoiceSynthesizer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize voice synthesizer
  useEffect(() => {
    if (lyrics?.length > 0) {
      synthRef.current = new VoiceSynthesizer({
        bpm,
        mood,
        genre,
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      Tone.Transport.stop();
    };
  }, [lyrics, bpm, mood, genre]);

  const playVoice = async () => {
    if (!synthRef.current || !lyrics.length) return;

    setIsVoicePlaying(true);
    startTimeRef.current = Date.now();

    // Start time tracking
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      const currentLineIndex = lyrics.findIndex((line, index) => {
        const nextLine = lyrics[index + 1];
        const lineStart = line.startTime;
        const lineEnd = nextLine ? nextLine.startTime : duration;
        return elapsed >= lineStart && elapsed < lineEnd;
      });

      if (currentLineIndex !== -1) {
        setActiveLine(currentLineIndex);
        const currentLine = lyrics[currentLineIndex];
        const duration = currentLine.endTime - currentLine.startTime;
        synthRef.current?.speakLine(currentLine.text, bpm / 60, duration);

        containerRef.current?.children[currentLineIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      // Stop if we've reached the end
      if (elapsed >= duration) {
        stopVoice();
      }
    }, 100);
  };

  const stopVoice = () => {
    setIsVoicePlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    Tone.Transport.stop();
    setActiveLine(0);
    // Reset scroll position
    containerRef.current?.children[0]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Don't render if no lyrics
  if (!lyrics?.length) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Voice Control Button - Made more prominent */}
      <div className="flex justify-center mb-4">
        <button
          onClick={isVoicePlaying ? stopVoice : playVoice}
          className={`px-8 py-3 rounded-lg transition-colors text-lg font-semibold ${
            isVoicePlaying
              ? "bg-red-500 hover:bg-red-600"
              : "bg-primary hover:bg-primary-dark"
          } text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
        >
          {isVoicePlaying ? "Stop Voice" : "Play Voice"}
        </button>
      </div>

      {/* Lyrics Display */}
      <div
        className="bg-background-dark/50 rounded-lg p-4 h-48 overflow-y-auto overflow-x-hidden
                  scrollbar-thin scrollbar-thumb-primary scrollbar-track-background-light"
        ref={containerRef}
      >
        <AnimatePresence>
          {lyrics.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.5 }}
              animate={{
                opacity: activeLine === index ? 1 : 0.5,
                scale: activeLine === index ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`py-2 text-center transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                activeLine === index
                  ? "text-primary font-bold"
                  : "text-gray-400"
              }`}
              style={{
                height: "3rem",
                lineHeight: "1.5rem",
              }}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
