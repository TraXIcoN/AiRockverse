"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
}

export default function LyricsDisplay({
  lyrics,
  isPlaying,
  currentTime,
  duration,
}: LyricsDisplayProps) {
  const [activeLine, setActiveLine] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentLineIndex = lyrics.findIndex((line, index) => {
        const nextLine = lyrics[index + 1];
        const lineStart = (line.startTime / duration) * 100;
        const lineEnd = nextLine ? (nextLine.startTime / duration) * 100 : 100;

        return (
          (currentTime / duration) * 100 >= lineStart &&
          (currentTime / duration) * 100 < lineEnd
        );
      });

      if (currentLineIndex !== -1 && currentLineIndex !== activeLine) {
        setActiveLine(currentLineIndex);
        // Scroll to active line
        containerRef.current?.children[currentLineIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, lyrics, duration, activeLine]);

  return (
    <div
      className="bg-background-dark/50 rounded-lg p-4 mt-4 h-48 overflow-y-auto"
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
            className={`py-2 text-center transition-colors ${
              activeLine === index ? "text-primary font-bold" : "text-gray-400"
            }`}
          >
            {line.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
