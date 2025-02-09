"use client";

import { useEffect, useState } from "react";
import { getUserTracks, TrackAnalysis } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackHistory() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadTracks = async () => {
      if (user) {
        try {
          const userTracks = await getUserTracks(user.uid);
          setTracks(userTracks);
        } catch (error) {
          console.error("Error loading tracks:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTracks();
  }, [user]);

  const formatValue = (value: any) => {
    if (value === undefined || value === null) return "N/A";
    return typeof value === "number" ? value.toFixed(2) : value;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      // Handle Firestore Timestamp
      if (timestamp instanceof Timestamp) {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
      }
      // Handle regular Date objects
      if (timestamp instanceof Date) {
        return formatDistanceToNow(timestamp, { addSuffix: true });
      }
      // Handle timestamp numbers
      if (typeof timestamp === "number") {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      }
      // Handle timestamp strings
      if (typeof timestamp === "string") {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      }

      return "";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const cardVariants = {
    initial: {
      y: 20,
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 20px rgba(139, 92, 246, 0.1)",
      borderColor: "rgba(139, 92, 246, 0.4)",
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const statVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  const TrackItem = ({ track, index }: { track: any; index: number }) => (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      layoutId={`track-${track.id}`}
      className="border border-primary/20 rounded-lg p-4 mb-4 bg-background/50 backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-primary-light text-lg">{track.fileName}</h3>
        <span className="text-sm text-gray-400">
          {formatDate(track.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "BPM", value: track.analysis?.bpm },
          { label: "Energy", value: track.analysis?.averageEnergy },
          { label: "Loudness", value: track.analysis?.averageLoudness },
          { label: "Sections", value: track.analysis?.sections?.length || 0 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={statVariants}
            initial="initial"
            animate="animate"
          >
            <p className="text-gray-400">{stat.label}</p>
            <p className="text-primary-light">{formatValue(stat.value)}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div>
          <span className="text-gray-400">Genre: </span>
          <span className="text-primary-light">
            {track.aiFeedback?.genre || "Unknown"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Mood: </span>
          <span className="text-primary-light">
            {track.aiFeedback?.mood || "Unknown"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      <div>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center h-64"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-8 w-8 border-b-2 border-primary"
            />
          </motion.div>
        ) : tracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <p className="text-gray-400">No tracks analyzed yet</p>
          </motion.div>
        ) : (
          <>
            <TrackItem track={tracks[0]} index={0} />

            {tracks.length > 1 && (
              <motion.div layout>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary-light hover:text-primary transition-colors mb-4 flex items-center gap-2"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                  <motion.svg
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4"
                    >
                      {tracks.slice(1, 3).map((track, index) => (
                        <TrackItem
                          key={track.id}
                          track={track}
                          index={index + 1}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <Link
                href="/archive"
                className="text-primary-light hover:text-primary transition-colors inline-flex items-center gap-2 group"
              >
                View All Tracks
                <motion.svg
                  whileHover={{ x: 4 }}
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </motion.svg>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </AnimatePresence>
  );
}
