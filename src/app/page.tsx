"use client";

import Link from "next/link";
import UploadForm from "@/components/UploadForm";
import { useAuth } from "@/context/AuthContext";
import UsernameForm from "@/components/UsernameForm";
import WaveBackground from "@/components/WaveBackground";
import {
  DrummerStickFigure,
  AIAnalystStickFigure,
  FeedbackStickFigure,
  LevelUpStickFigure,
} from "@/components/illustrations/StickFigures";
import DancingMinions from "@/components/DancingMinions";
import { motion } from "framer-motion";
import ForestBackground from "@/components/ForestBackground";

export default function Home() {
  const { user, loading, userData, signInWithGoogle } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // // If user is logged in but hasn't set a username
  // if (user && !userData?.displayName) {
  //   return <UsernameForm />;
  // }

  const letterVariants = {
    initial: { y: 100, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }),
  };

  const titleVariants = {
    initial: {
      scale: 1,
    },
    animate: {
      scale: [1, 1, 1.5, 0.8, 1],
      rotate: [0, 0, 5, -5, 0],
      transition: {
        duration: 3,
        times: [0, 0.4, 0.5, 0.6, 0.7],
        ease: ["easeOut", "easeIn", "backOut", "easeOut"],
      },
    },
  };

  return (
    <div className="relative min-h-screen">
      <WaveBackground />
      <DancingMinions />
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              variants={titleVariants}
              initial="initial"
              animate="animate"
              className="inline-block"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
                GrooveChain
              </h1>
            </motion.div>
            <p className="text-2xl md:text-3xl text-gray-300 mb-8">
              The Smartest DJ & Music Producer Coach
            </p>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              Get real-time feedback, personalized coaching, and track your
              progress with AI-powered music analysis
            </p>
            <Link
              href="/auth" // This links to our auth page
              className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-4 bg-background-light relative">
          <ForestBackground />
          <div className="max-w-6xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12 text-center">
              Why Most DJs & Producers Struggle
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "No Structured Feedback",
                  description:
                    "Traditional learning leaves you guessing what's wrong with your tracks",
                },
                {
                  title: "No Measurable Progress",
                  description:
                    "Without proper tracking, it's hard to see how far you've come",
                },
                {
                  title: "No Easy Way to Improve",
                  description:
                    "Generic tutorials don't provide the personalized coaching you need",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg bg-background border border-primary/20 hover:border-primary/40 transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-primary-light mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12 text-center">
              How GrooveChain Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Upload Your Beat",
                  description: "Share your track and select your genre",
                  Icon: DrummerStickFigure,
                },
                {
                  step: "2",
                  title: "AI Analysis",
                  description: "Our AI breaks down your beat's key features",
                  Icon: AIAnalystStickFigure,
                },
                {
                  step: "3",
                  title: "Get Feedback",
                  description: "Receive personalized improvement suggestions",
                  Icon: FeedbackStickFigure,
                },
                {
                  step: "4",
                  title: "Level Up",
                  description: "Track progress with NFT-backed achievements",
                  Icon: LevelUpStickFigure,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative p-6 rounded-lg bg-background border border-primary/20 hover:border-primary/40 transition-all duration-300"
                >
                  <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <item.Icon />
                  <h3 className="text-xl font-bold text-primary-light mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-background-light">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Ready to Level Up Your Music?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join GrooveChain today and start getting personalized feedback on
              your tracks
            </p>
            <Link
              href="/upload"
              className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 inline-block"
            >
              Start Free Trial
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
