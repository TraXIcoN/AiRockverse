"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserTracks } from "@/lib/db";
import WaveBackground from "@/components/WaveBackground";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { debounce } from "lodash";

// Dynamically import TrackStatistics with no SSR
const DynamicTrackStatistics = dynamic(
  () => import("@/components/TrackStatistics"),
  { ssr: false }
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const trackCardVariants = {
  hidden: {
    y: 20,
    opacity: 0,
    scale: 0.95,
  },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const statVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

export default function Archive() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "bpm" | "">("");
  const [isClient, setIsClient] = useState(false);
  const tracksPerPage = 10;
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const loadTracks = async () => {
      if (user) {
        try {
          const userTracks = await getUserTracks(user.uid);
          console.log("Archive page - Tracks loaded:", userTracks); // Debug log
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

  // Debug log for render
  console.log("Archive page - Rendering with tracks:", tracks.length);

  // Filter and sort tracks
  const filteredAndSortedTracks = useMemo(() => {
    let result = [...tracks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (track) =>
          track.fileName.toLowerCase().includes(query) ||
          track.aiFeedback?.genre?.toLowerCase().includes(query) ||
          track.aiFeedback?.mood?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        result.sort((a, b) => {
          const dateA =
            a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const dateB =
            b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return dateB - dateA; // Most recent first
        });
        break;
      case "name":
        result.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "bpm":
        result.sort((a, b) => {
          const bpmA = a.analysis?.bpm || 0;
          const bpmB = b.analysis?.bpm || 0;
          return bpmB - bpmA;
        });
        break;
    }

    return result;
  }, [tracks, searchQuery, sortBy]);

  // Update pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // Calculate current page tracks
  const currentTracks = useMemo(() => {
    const indexOfLastTrack = currentPage * tracksPerPage;
    const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
    return filteredAndSortedTracks.slice(indexOfFirstTrack, indexOfLastTrack);
  }, [filteredAndSortedTracks, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedTracks.length / tracksPerPage);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 300),
    []
  );

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
      if (typeof timestamp === "string") {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      }
      return "";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const TrackItem = ({ track }: { track: any }) => (
    <motion.div
      variants={trackCardVariants}
      whileHover="hover"
      whileTap="tap"
      layoutId={`track-${track.id}`}
    >
      <Link href={`/track/${track.id}`}>
        <div className="h-full border border-primary/20 rounded-xl p-6 bg-background-light/50 hover:border-primary/40 hover:bg-background-light/70 transition-all cursor-pointer group backdrop-blur-sm">
          {/* Track Header with Animation */}
          <motion.div
            className="flex justify-between items-start mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-primary-light group-hover:text-primary transition-colors line-clamp-1">
              {track.fileName}
            </h3>
            <span className="text-sm text-gray-400">
              {formatDate(track.createdAt)}
            </span>
          </motion.div>

          {/* Main Stats with Hover Effect */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              variants={statVariants}
              className="bg-background/40 p-3 rounded-lg hover:bg-background/60 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">BPM</p>
              <p className="text-primary-light text-lg font-bold">
                {formatValue(track.analysis?.bpm)}
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              className="bg-background/40 p-3 rounded-lg hover:bg-background/60 transition-colors"
            >
              <p className="text-gray-400 text-sm mb-1">Energy</p>
              <p className="text-primary-light text-lg font-bold">
                {formatValue(track.analysis?.averageEnergy)}
              </p>
            </motion.div>
          </div>

          {/* Genre and Mood with Fade In */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 group-hover:text-primary-light transition-colors">
              <span className="text-gray-400">Genre:</span>
              <span className="text-primary-light">
                {track.aiFeedback?.genre || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2 group-hover:text-primary-light transition-colors">
              <span className="text-gray-400">Mood:</span>
              <span className="text-primary-light">
                {track.aiFeedback?.mood || "Unknown"}
              </span>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug log
  console.log("Tracks available for statistics:", tracks);

  return (
    <div className="relative min-h-screen mt-24">
      <WaveBackground />
      <motion.main
        className="relative z-10 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Animated Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent mb-4">
              Track Archive
            </h1>
            <p className="text-gray-400">
              View and analyze all your previously uploaded tracks
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:flex-1">
              {/* Animated Filters */}
              <motion.div
                className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <input
                  type="text"
                  placeholder="Search tracks..."
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="bg-background-light border border-primary/20 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-primary/40"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-background-light border border-primary/20 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-primary/40"
                >
                  <option value="">Sort by</option>
                  <option value="date">Date (Newest)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="bpm">BPM (Highest)</option>
                </select>
              </motion.div>

              {/* No results message */}
              {filteredAndSortedTracks.length === 0 && !loading && (
                <div className="text-center text-gray-400 py-8">
                  No tracks found matching your search criteria
                </div>
              )}

              {/* Tracks Grid with Stagger Animation */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6"
              >
                {currentTracks.map((track, index) => (
                  <TrackItem key={track.id || index} track={track} />
                ))}
              </motion.div>

              {/* Animated Pagination */}
              {totalPages > 1 && (
                <motion.div
                  className="mt-8 flex justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-primary/20 text-primary-light hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </motion.div>
              )}
            </div>

            {/* Statistics Panel Animation */}
            {isClient && tracks.length > 0 && (
              <motion.div
                className="w-full lg:w-[400px] xl:w-[600px] lg:shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <DynamicTrackStatistics tracks={tracks} />
              </motion.div>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
