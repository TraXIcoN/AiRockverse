"use client";

import { useState, useEffect, useRef } from "react";
import { openai } from "@/lib/openai";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceSynthesizer } from "@/lib/voiceSynthesis";
import * as Tone from "tone";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface LyricAssistantProps {
  bpm: number;
  genre: string;
  mood?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  songId: string;
}

interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
}

export default function LyricAssistant({
  bpm,
  genre,
  mood,
  isPlaying,
  currentTime,
  duration,
  songId,
}: LyricAssistantProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [selectedMood, setSelectedMood] = useState(mood || "");
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const synthRef = useRef<VoiceSynthesizer | null>(null);
  const [storyDescription, setStoryDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const currentLineRef = useRef<number>(-1);
  const [sections, setSections] = useState([
    { name: "Intro", start: "0", end: "15", description: "" },
    { name: "Verse 1", start: "15", end: "45", description: "" },
    { name: "Chorus", start: "45", end: "75", description: "" },
    { name: "Verse 2", start: "75", end: "105", description: "" },
    { name: "Bridge", start: "105", end: "120", description: "" },
    { name: "Outro", start: "120", end: "135", description: "" },
  ]);

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

  const router = useRouter();

  const handleSectionChange = (index: number, field: string, value: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  // Fetch and display lyrics on mount
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!songId) return;

      try {
        const lyricDoc = await getDoc(doc(db, "lyrics", songId));
        if (lyricDoc.exists()) {
          const data = lyricDoc.data();

          // Set form data
          setTheme(data.theme || "");
          setKeywords(data.keywords || []);
          setStoryDescription(data.storyDescription || "");
          setSelectedMood(data.mood || mood || "");
          setSections(data.sections || []);

          // Set generated lyrics if they exist
          if (data.generatedLyrics) {
            setLyrics(data.generatedLyrics);
            setLoading(false); // Ensure loading is false since we have lyrics
          }
        }
      } catch (error) {
        console.error("Error fetching lyrics:", error);
        setError("Failed to load saved lyrics");
      }
    };

    fetchLyrics();
  }, [songId, mood]);

  const generateLyrics = async () => {
    setLoading(true);
    try {
      // First generate lyrics with OpenAI
      const prompt = `Write lyrics for a ${genre} song with the following structure:
        - Theme: ${theme}
        - Mood: ${selectedMood}
        - BPM: ${bpm}
        
        Include the following sections:
        ${sections.map((s) => `- ${s.name}: ${s.description}`).join("\n")}
        
        Format the lyrics with section headers in brackets like [Verse], [Chorus], etc.
        Use the keywords: ${keywords.join(", ")}
        Story concept: ${storyDescription}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      const generatedText = completion.choices[0].message.content;
      if (!generatedText) throw new Error("No lyrics generated");

      // Parse the lyrics into timed sections
      const lines = generatedText.split("\n").filter((line) => line.trim());
      const timedLyrics = parseTimedLyrics(lines);
      setLyrics(timedLyrics);

      // Generate audio with Suno API
      const sunoResponse = await fetch(
        "https://api.aimlapi.com/v2/generate/audio/suno-ai/clip",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: generatedText,
            tags: `${genre} ${selectedMood.toLowerCase()}`,
            title: theme,
          }),
        }
      );

      const { clip_ids } = await sunoResponse.json();

      // Save everything to Firebase
      if (songId) {
        const docRef = doc(db, "lyrics", songId);
        await setDoc(
          docRef,
          {
            generatedLyrics: timedLyrics,
            rawLyrics: generatedText,
            clipIds: clip_ids,
            theme,
            keywords,
            storyDescription,
            mood: selectedMood,
            sections,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // Initialize voice synthesizer
      synthRef.current = new VoiceSynthesizer({
        bpm,
        mood: selectedMood,
        genre,
      });
    } catch (err) {
      console.error("Error generating lyrics:", err);
      setError("Failed to generate lyrics");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse lyrics with timing
  const parseTimedLyrics = (lines: string[]): LyricLine[] => {
    const timedLyrics: LyricLine[] = [];
    let currentTime = 0;
    const timePerLine = (60 / bpm) * 4; // 4 beats per line
    const spaceBetweenLines = timePerLine * 0.5;

    lines.forEach((line) => {
      // Skip section headers in brackets
      if (!line.trim().match(/^\[.*\]$/)) {
        timedLyrics.push({
          text: line.trim(),
          startTime: currentTime,
          endTime: currentTime + timePerLine,
        });
        currentTime += timePerLine + spaceBetweenLines;
      }
    });

    return timedLyrics;
  };

  const playVoice = async () => {
    if (!synthRef.current || !lyrics.length) return;

    try {
      setIsVoicePlaying(true);
      currentLineRef.current = 0;

      const speakNextLine = async (index: number) => {
        if (index >= lyrics.length) {
          stopVoice();
          return;
        }
        const combinedLyrics = lyrics.map((line) => line.text).join("\n");
        try {
          await synthRef.current?.speakLine(
            combinedLyrics,
            selectedMood,
            keywords
          );
          // Add slight pause between lines
          const pauseDuration = (60 / bpm) * 0.25; // Quarter beat pause
          setTimeout(() => {
            speakNextLine(index + 1);
          }, pauseDuration * 1000);
        } catch (error) {
          console.error("Error speaking line:", error);
          stopVoice();
        }
      };

      await speakNextLine(0);
    } catch (error) {
      console.error("Error starting voice playback:", error);
      stopVoice();
    }
  };

  const stopVoice = () => {
    setIsVoicePlaying(false);
    currentLineRef.current = -1;
    if (synthRef.current) {
      synthRef.current.stop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!songId) {
      console.error("No songId provided");
      return;
    }

    setLoading(true);
    try {
      const lyricsData = {
        sections,
        theme,
        keywords,
        storyDescription,
        mood: selectedMood,
        bpm,
        genre,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firebase
      const docRef = doc(db, "lyrics", songId);
      await setDoc(docRef, lyricsData);

      generateLyrics();
    } catch (error) {
      console.error("Error generating/saving lyrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBattleRoyale = () => {
    if (!lyrics.length || !songId) return;

    router.push(`/battle-royale/${songId}`);
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-primary mb-4">
        AI Lyric Assistant
      </h2>

      {/* Input Section */}
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

        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Story/Concept
          </label>
          <textarea
            value={storyDescription}
            onChange={(e) => setStoryDescription(e.target.value)}
            placeholder="Describe the story or concept behind your song"
            className="w-full px-4 py-2 h-24 bg-background border border-primary/20 rounded-lg focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Keywords</label>
          <input
            type="text"
            value={keywords.join(", ")}
            onChange={(e) =>
              setKeywords(e.target.value.split(",").map((k) => k.trim()))
            }
            placeholder="dark, industrial, cyberpunk, etc."
            className="w-full px-4 py-2 bg-background border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Song Structure
          </label>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) =>
                    handleSectionChange(index, "name", e.target.value)
                  }
                  className="w-24 px-2 py-1 bg-background border border-primary/20 rounded-lg"
                />
                <input
                  type="number"
                  value={section.start}
                  onChange={(e) =>
                    handleSectionChange(index, "start", e.target.value)
                  }
                  className="w-20 px-2 py-1 bg-background border border-primary/20 rounded-lg"
                />
                <input
                  type="number"
                  value={section.end}
                  onChange={(e) =>
                    handleSectionChange(index, "end", e.target.value)
                  }
                  className="w-20 px-2 py-1 bg-background border border-primary/20 rounded-lg"
                />
                <input
                  type="text"
                  value={section.description}
                  onChange={(e) =>
                    handleSectionChange(index, "description", e.target.value)
                  }
                  placeholder="Section description"
                  className="flex-1 px-2 py-1 bg-background border border-primary/20 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Display Lyrics if they exist */}
        {lyrics.length > 0 && (
          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-lg bg-background-dark/50
                        scrollbar-thin scrollbar-thumb-primary scrollbar-track-background-light
                        hover:scrollbar-thumb-primary-dark transition-colors"
          >
            {lyrics.map((line, index) => (
              <div
                key={index}
                className="p-4 text-center text-lg transition-all whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {line.text}
              </div>
            ))}
          </div>
        )}

        {/* Generate button only if no lyrics exist */}
        {lyrics.length === 0 && (
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedMood || !theme}
            className={`w-full py-2 px-4 rounded-lg ${
              loading || !selectedMood || !theme
                ? "bg-primary/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark"
            } text-white transition-colors`}
          >
            {loading ? "Generating..." : "Generate Lyrics"}
          </button>
        )}
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      {/* Lyrics Display */}
      {lyrics.length > 0 && (
        <>
          {/* <div className="flex justify-center mb-4">
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
          </div> */}

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
                      currentTime >= line.startTime &&
                      currentTime <= line.endTime
                        ? 1
                        : 0.6,
                    y: 0,
                    scale:
                      currentTime >= line.startTime &&
                      currentTime <= line.endTime
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
                    height: "3rem",
                    lineHeight: "1.5rem",
                  }}
                >
                  {line.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Add this after the lyrics display section */}
      {lyrics.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleBattleRoyale}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-red-600 
                     text-white font-bold text-lg shadow-lg hover:shadow-xl 
                     transform hover:scale-105 transition-all duration-200
                     flex items-center gap-2"
          >
            <span>🎵 Battle Royale: Human vs AI</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              New!
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
