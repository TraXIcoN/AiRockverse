"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function NFTCollection() {
  const [activeTab, setActiveTab] = useState("myNFTs");
  const { user } = useAuth();

  const tabVariants = {
    inactive: {
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      scale: 1,
    },
    active: {
      backgroundColor: "rgba(139, 92, 246, 0.2)",
      scale: 1.05,
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
    },
  };

  const cardVariants = {
    initial: {
      scale: 0.9,
      opacity: 0,
      rotateY: -15,
    },
    animate: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      rotateY: 5,
      boxShadow: "0 20px 30px rgba(0,0,0,0.3)",
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex gap-4 p-2 bg-background-light/30 backdrop-blur-lg rounded-2xl">
          <motion.button
            variants={tabVariants}
            animate={activeTab === "myNFTs" ? "active" : "inactive"}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab("myNFTs")}
            className="flex-1 py-4 px-6 rounded-xl text-lg font-bold text-primary-light"
          >
            My NFTs
          </motion.button>
          <motion.button
            variants={tabVariants}
            animate={activeTab === "marketplace" ? "active" : "inactive"}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab("marketplace")}
            className="flex-1 py-4 px-6 rounded-xl text-lg font-bold text-primary-light"
          >
            Marketplace
          </motion.button>
        </div>
      </div>

      {/* NFT Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* NFT Card */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="bg-background-light/30 backdrop-blur-lg rounded-3xl overflow-hidden border border-primary/20 hover:border-primary/40 transition-colors"
          >
            <div className="relative aspect-square">
              {/* Speaker Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-primary/20 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-36 h-36 bg-primary/30 rounded-full flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-24 h-24 bg-primary/40 rounded-full"
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-primary-light mb-2">
                Alex Da Basso - Robots Attack (Dub Mix)
              </h3>
              <p className="text-gray-400 mb-4">
                Hardcore Techno track at 200 BPM
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="text-primary-light">Unknown</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Token ID</p>
                  <p className="text-primary-light">#2</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-6 py-3 px-6 bg-primary/20 hover:bg-primary/30 
                         rounded-xl text-primary-light font-medium transition-colors"
              >
                List for Sale
              </motion.button>
            </div>
          </motion.div>

          {/* Add more NFT cards here */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
