"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Lottie from "lottie-react";
import humanAnimation from "@/animations/Animation - 1739103050726.json";
import robotAnimation from "@/animations/Animation - 1739103132080.json";

interface BattleRoyaleProps {
  params: {
    songId: string;
  };
}

// Default songs for demo
const DEFAULT_SONGS = {
  human: "/audio/default-human.mp3", // Add your default audio files
  ai: "/audio/default-ai.mp3",
};

// Sample songs array for random selection
const SAMPLE_SONGS = {
  human: [
    "/audio/human-song1.mp3",
    "/audio/human-song2.mp3",
    "/audio/human-song3.mp3",
  ],
  ai: ["/audio/ai-song1.mp3", "/audio/ai-song2.mp3", "/audio/ai-song3.mp3"],
};

export default function BattleRoyale({ params }: BattleRoyaleProps) {
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [battleStarted, setBattleStarted] = useState(false);
  const [lyrics, setLyrics] = useState<string>("");
  const [aiAudio, setAiAudio] = useState<string | null>(DEFAULT_SONGS.ai);
  const [humanAudio, setHumanAudio] = useState<string | null>(
    DEFAULT_SONGS.human
  );
  const [votes, setVotes] = useState({ ai: 0, human: 0 });
  const [messages, setMessages] = useState<
    Array<{ text: string; sender: string }>
  >([
    { text: "Let the battle begin!", sender: "system" },
    { text: "This beat is fire! 🔥", sender: "user1" },
    { text: "AI version sounds interesting", sender: "user2" },
  ]);

  // Get random songs
  const randomHumanSong =
    SAMPLE_SONGS.human[Math.floor(Math.random() * SAMPLE_SONGS.human.length)];
  const randomAiSong =
    SAMPLE_SONGS.ai[Math.floor(Math.random() * SAMPLE_SONGS.ai.length)];

  // Countdown Animation
  useEffect(() => {
    if (countdown === null) return;

    const timer = setTimeout(() => {
      if (countdown > 0) {
        setCountdown(countdown - 1);
      } else if (countdown === 0) {
        setCountdown(null);
        setBattleStarted(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!params?.songId) return;

    const generateAndFetchAudio = async () => {
      try {
        const docRef = doc(db, "lyrics", params.songId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLyrics(data.rawLyrics || "");

          try {
            // Step 1: Generate audio using the correct endpoint
            const generateResponse = await fetch(
              "https://api.aimlapi.com/v2/generate/audio",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "stable-audio",
                  prompt: `${data.genre || "ambient"} music with ${
                    data.mood || "calm"
                  } mood, ${data.theme || "melodic"} theme`,
                  seconds_total: 30,
                  steps: 100,
                }),
              }
            );

            if (!generateResponse.ok) {
              const errorData = await generateResponse.json();
              console.error("Stable Audio Generation Error:", errorData);
              throw new Error(`Generation error: ${generateResponse.status}`);
            }

            const { generation_id } = await generateResponse.json();
            console.log("Generation started with ID:", generation_id);

            // Step 2: Poll for completion
            let audioUrl = null;
            let attempts = 0;
            const maxAttempts = 30;

            while (!audioUrl && attempts < maxAttempts) {
              const statusResponse = await fetch(
                `https://api.aimlapi.com/v2/audio/${generation_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`,
                  },
                }
              );

              if (statusResponse.ok) {
                const audioData = await statusResponse.json();
                console.log("Status check:", audioData);

                if (audioData.status === "completed") {
                  audioUrl = audioData.audio_url;
                  break;
                }
              }

              attempts++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            if (audioUrl) {
              setAiAudio(audioUrl);
              await updateDoc(docRef, {
                aiAudioUrl: audioUrl,
                generationId: generation_id,
                updatedAt: new Date().toISOString(),
              });
            } else {
              throw new Error("Audio generation timed out");
            }
          } catch (apiError) {
            console.error("Error generating audio:", apiError);
          }
        }
      } catch (error) {
        console.error("Error fetching battle data:", error);
      } finally {
        setLoading(false);
      }
    };

    generateAndFetchAudio();

    // No need for URL.revokeObjectURL cleanup since we're using direct URLs now
  }, [params?.songId]);

  const handleVote = async (type: "ai" | "human") => {
    if (!params?.songId) return;

    try {
      const docRef = doc(db, "lyrics", params.songId);
      const newVotes = {
        ...votes,
        [type]: votes[type] + 1,
      };

      await updateDoc(docRef, {
        votes: newVotes,
      });

      setVotes(newVotes);
    } catch (error) {
      console.error("Error updating votes:", error);
    }
  };

  const countdownVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [1.5, 1],
      opacity: [0, 1, 0],
    },
    exit: { scale: 0, opacity: 0 },
  };

  const avatarVariants = {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-gradient-to-b from-background to-background-dark mt-24">
      {/* Countdown Animation */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1.5, 1],
                opacity: [0, 1, 0],
              }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-9xl font-bold text-primary"
            >
              {countdown === 0 ? "FIGHT!" : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-16 text-primary-light">
          Battle Royale: Human vs AI
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
          {/* Human Side */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative"
          >
            {/* Human Avatar */}
            <motion.div className="absolute -left-8 top-0 w-64 h-64">
              <Lottie
                animationData={humanAnimation}
                loop={true}
                className="w-full h-full"
              />
            </motion.div>

            <div className="mt-48 p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-primary/20">
              <h2 className="text-2xl font-bold mb-6 text-center text-primary-light">
                Human Version
              </h2>
              <div className="mb-4 bg-background/40 p-4 rounded-lg">
                <audio controls className="w-full" autoPlay={battleStarted}>
                  <source src={randomHumanSong} type="audio/mpeg" />
                </audio>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setVotes((v) => ({ ...v, human: v.human + 1 }))}
                className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary-light rounded-lg font-bold transition-colors"
              >
                Vote ({votes.human})
              </motion.button>
            </div>
          </motion.div>

          {/* AI Side */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative"
          >
            {/* AI Avatar */}
            <motion.div className="absolute -right-8 top-0 w-64 h-64">
              <Lottie
                animationData={robotAnimation}
                loop={true}
                className="w-full h-full"
              />
            </motion.div>

            <div className="mt-48 p-6 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-600/20 backdrop-blur-sm border border-primary/20">
              <h2 className="text-2xl font-bold mb-6 text-center text-primary-light">
                AI Version
              </h2>
              <div className="mb-4 bg-background/40 p-4 rounded-lg">
                <audio controls className="w-full" autoPlay={battleStarted}>
                  <source src={randomAiSong} type="audio/mpeg" />
                </audio>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setVotes((v) => ({ ...v, ai: v.ai + 1 }))}
                className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary-light rounded-lg font-bold transition-colors"
              >
                Vote ({votes.ai})
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Chat Section */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto p-6 rounded-xl bg-background-light/10 backdrop-blur-md border border-primary/20"
        >
          <div className="h-64 overflow-y-auto mb-4 space-y-2">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x:
                    msg.sender === "system"
                      ? 0
                      : msg.sender === "user1"
                      ? -20
                      : 20,
                }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded-lg ${
                  msg.sender === "system"
                    ? "bg-primary/20 text-center"
                    : msg.sender === "user1"
                    ? "bg-blue-500/20 ml-auto w-fit"
                    : "bg-orange-500/20 w-fit"
                }`}
              >
                {msg.text}
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-background/40 border border-primary/20 rounded-lg px-4 py-2 text-primary-light focus:outline-none focus:border-primary/40"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary-light rounded-lg font-bold"
            >
              Send
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
