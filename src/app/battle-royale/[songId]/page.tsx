"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

interface BattleRoyaleProps {
  params: {
    songId: string;
  };
}

export default function BattleRoyale({ params }: BattleRoyaleProps) {
  const [loading, setLoading] = useState(true);
  const [lyrics, setLyrics] = useState<string>("");
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [humanAudio, setHumanAudio] = useState<string | null>(null);
  const [votes, setVotes] = useState({ ai: 0, human: 0 });

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
                Your browser does not support the audio element.
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
