"use client";

import { motion } from "framer-motion";

export default function DancingMinions() {
  const minions = [
    {
      startX: "-10vw", // Left side minion 1
      startY: "45vh",
      delay: 0,
      side: "left",
    },
    {
      startX: "-10vw", // Left side minion 2
      startY: "55vh",
      delay: 0.2,
      side: "left",
    },
    {
      startX: "110vw", // Right side minion - well outside the viewport
      startY: "50vh",
      delay: 0.1,
      side: "right",
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {minions.map((minion, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: minion.side === "right" ? "auto" : "0",
            right: minion.side === "right" ? "0" : "auto",
          }}
          initial={{
            x: minion.startX,
            y: minion.startY,
          }}
          animate={{
            x: [
              null,
              minion.side === "right" ? "-40vw" : "40vw", // Meet in middle
              minion.side === "right" ? "-110vw" : "110vw", // Exit
            ],
            y: [
              null,
              "50vh", // Meet in middle
              minion.side === "right" ? "70vh" : index === 0 ? "30vh" : "60vh",
            ],
            rotate: [0, 0, minion.side === "right" ? -360 : 360],
            scale: [1, 1, 0.8],
          }}
          transition={{
            duration: 3,
            delay: minion.delay,
            repeatDelay: 4,
            times: [0, 0.4, 1],
            ease: ["easeOut", "backIn"],
          }}
        >
          <div className="relative w-20 h-20">
            {/* Minion Body */}
            <div className="absolute w-20 h-20 bg-yellow-400 rounded-full">
              {/* Goggles */}
              <div className="absolute top-4 left-2 w-16 h-8 bg-gray-800 rounded-full">
                <div className="absolute top-1 left-2 w-5 h-5 bg-white rounded-full">
                  <div className="absolute top-1 left-1 w-3 h-3 bg-brown-500 rounded-full" />
                </div>
              </div>
              {/* Headphones */}
              <div className="absolute -top-2 left-0 w-20 h-8">
                <div className="absolute top-0 left-0 w-4 h-8 bg-purple-500 rounded-l-full" />
                <div className="absolute top-0 right-0 w-4 h-8 bg-purple-500 rounded-r-full" />
                <div className="absolute top-0 left-2 w-16 h-2 bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
