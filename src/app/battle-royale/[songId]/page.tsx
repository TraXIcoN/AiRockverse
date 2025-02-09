"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

interface BattleRoyaleProps {
  params: {
    songId: string;
  };
}

export default function BattleRoyale({ params }: BattleRoyaleProps) {
  const songId = use(Promise.resolve(params.songId)); // Properly unwrap the params
  const [loading, setLoading] = useState(true);
  const [lyrics, setLyrics] = useState<string>("");
  const [aiAudio, setAiAudio] = useState<string | null>(null); // Changed to null
  const [humanAudio, setHumanAudio] = useState<string | null>(null); // Changed to null
  const [votes, setVotes] = useState({ ai: 0, human: 0 });

  useEffect(() => {
    const fetchBattleData = async () => {
      try {
        const docRef = doc(db, "lyrics", songId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLyrics(data.rawLyrics || "");

          // Fetch the AI audio using the clip_ids
          if (data.clipIds?.[0]) {
            const clipId = data.clipIds[0];
            const audioResponse = await fetch(
              `https://api.aimlapi.com/v2/audio/suno-ai/clip/${clipId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`,
                },
              }
            );

            if (audioResponse.ok) {
              const audioBlob = await audioResponse.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              setAiAudio(audioUrl);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching battle data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBattleData();

    // Cleanup function to revoke object URLs
    return () => {
      if (aiAudio) {
        URL.revokeObjectURL(aiAudio);
      }
    };
  }, [songId]); // Updated dependency

  const handleVote = async (type: "ai" | "human") => {
    try {
      const docRef = doc(db, "lyrics", songId);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading battle...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Battle Royale: Human vs AI
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Human Side */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600"
        >
          <h2 className="text-2xl font-bold mb-4">Human Version</h2>
          <div className="mb-4">
            {humanAudio && (
              <audio controls className="w-full">
                <source src={humanAudio} type="audio/mpeg" />
              </audio>
            )}
          </div>
          <button
            onClick={() => handleVote("human")}
            className="w-full py-2 bg-white text-purple-600 rounded-lg font-bold"
          >
            Vote ({votes.human})
          </button>
        </motion.div>

        {/* AI Side */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-red-500 to-orange-600"
        >
          <h2 className="text-2xl font-bold mb-4">AI Version</h2>
          <div className="mb-4">
            {aiAudio && (
              <audio controls className="w-full">
                <source src={aiAudio} type="audio/mpeg" />
              </audio>
            )}
          </div>
          <button
            onClick={() => handleVote("ai")}
            className="w-full py-2 bg-white text-red-600 rounded-lg font-bold"
          >
            Vote ({votes.ai})
          </button>
        </motion.div>
      </div>

      {/* Lyrics Display */}
      <div className="mt-8 p-6 rounded-xl bg-gray-800">
        <h3 className="text-xl font-bold mb-4">Lyrics</h3>
        <pre className="whitespace-pre-wrap">{lyrics}</pre>
      </div>
    </div>
  );
}
