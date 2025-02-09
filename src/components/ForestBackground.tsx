"use client";

import { motion } from "framer-motion";

const ForestBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {/* Ground/Grass */}
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 100">
        <path
          d="M0,50 Q300,30 600,50 T1200,50 V100 H0 Z"
          fill="none"
          stroke="rgb(107, 142, 35)"
          strokeWidth="2"
        />
        {/* Small grass patches */}
        {[...Array(20)].map((_, i) => (
          <motion.path
            key={`grass-${i}`}
            d={`M${50 + i * 60},50 Q${55 + i * 60},40 ${60 + i * 60},50`}
            stroke="rgb(107, 142, 35)"
            strokeWidth="1"
            fill="none"
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </svg>

      {/* Flying Birds */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`bird-${i}`}
          className="absolute"
          initial={{ x: "-10%", y: `${20 + i * 10}%` }}
          animate={{
            x: "110%",
            y: [`${20 + i * 10}%`, `${15 + i * 10}%`, `${20 + i * 10}%`],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "linear",
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M2,10 Q5,5 8,10 T14,10"
              stroke="rgb(107, 142, 35)"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </motion.div>
      ))}

      {/* Pandas */}
      <motion.div
        className="absolute bottom-10 left-10 md:left-20"
        animate={{
          x: [-5, 5, -5],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          {/* Simplified panda outline */}
          <circle
            cx="30"
            cy="30"
            r="25"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="20"
            cy="20"
            r="5"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="40"
            cy="20"
            r="5"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M25,35 Q30,40 35,35"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Walking Human */}
      <motion.div
        className="absolute bottom-10 right-10 md:right-20"
        animate={{
          x: [0, -100],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <svg width="30" height="50" viewBox="0 0 30 50">
          <circle
            cx="15"
            cy="10"
            r="8"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            fill="none"
          />
          <line
            x1="15"
            y1="18"
            x2="15"
            y2="35"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
          />
          <motion.line
            x1="15"
            y1="35"
            x2="10"
            y2="45"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            animate={{ x2: [10, 20, 10] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.line
            x1="15"
            y1="35"
            x2="20"
            y2="45"
            stroke="rgb(107, 142, 35)"
            strokeWidth="2"
            animate={{ x2: [20, 10, 20] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default ForestBackground;
