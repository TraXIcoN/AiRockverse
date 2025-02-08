"use client";

import { useState, useRef, useEffect } from "react";
import { uploadToPinata } from "@/lib/pinata";
import { useAuth } from "@/context/AuthContext";
import { AudioAnalyzer } from "@/lib/audioAnalysis";
import { analyzeTrackWithAI } from "@/lib/openai";
import { saveTrackAnalysis } from "@/lib/db";

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const analyzerRef = useRef<AudioAnalyzer | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3"];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload MP3 or WAV files only."
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum size is 50MB.");
    }
  };

  const formatAnalysis = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const analyzeTrack = async (url: string) => {
    try {
      setUploading(true);

      // Initialize audio analyzer
      const analyzer = new AudioAnalyzer();
      await analyzer.loadAudio(url);

      // Get audio analysis
      const audioAnalysis = await analyzer.analyze();

      // Get AI feedback
      const feedback = await analyzeTrackWithAI(audioAnalysis);

      setAnalysis(feedback);
      setSuccess("Track analyzed successfully!");
    } catch (err) {
      setError("Failed to analyze track");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!user) {
      setError("Please sign in to upload tracks");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setUploading(true);

      // Validate file
      validateFile(file);

      // Upload to Pinata
      const ipfsUrl = await uploadToPinata(file);
      console.log("File uploaded to IPFS:", ipfsUrl);

      // Initialize audio analyzer
      analyzerRef.current = new AudioAnalyzer();

      // Load and analyze audio
      console.log("Loading audio...");
      await analyzerRef.current.loadAudio(ipfsUrl);

      console.log("Analyzing audio...");
      const audioAnalysis = await analyzerRef.current.analyze();
      console.log("Audio analysis complete:", audioAnalysis);

      // Validate analysis data
      if (!audioAnalysis || !audioAnalysis.averageEnergy) {
        throw new Error("Invalid audio analysis data");
      }

      // Wait a moment to ensure audio is fully processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get AI feedback
      console.log("Getting AI feedback...");
      const feedback = await analyzeTrackWithAI(audioAnalysis);
      console.log("AI feedback received:", feedback);

      // Save to Firebase
      const trackData = {
        userId: user.uid,
        fileName: file.name,
        ipfsUrl,
        analysis: audioAnalysis,
        aiFeedback: feedback,
      };

      console.log("Saving track data:", trackData);
      await saveTrackAnalysis(user.uid, trackData);

      setAnalysis(formatAnalysis(feedback));
      setSuccess("Track analyzed and saved successfully!");
    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process track");
    } finally {
      setUploading(false);
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
        analyzerRef.current = null;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files?.length) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      await handleFile(files[0]);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
        analyzerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8
          ${isDragging ? "border-primary bg-primary/10" : "border-gray-600"}
          transition-colors duration-200
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400">Uploading your track...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M24 27v-9m0 0l-3 3m3-3l3 3m-3 6v-3m-9-6h.01M9 27h.01M15 21h.01M15 27h.01M21 21h.01M21 27h.01M27 21h.01M27 27h.01M33 21h.01M33 27h.01M39 21h.01M39 27h.01"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-300 mb-2">
                Drag and drop your audio file here
              </p>
              <p className="text-sm text-gray-400 mb-4">
                or click to select a file (MP3 or WAV, max 50MB)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Select File
              </button>
            </>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="audio/mpeg,audio/wav,audio/mp3"
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-md">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded-md">
          <p className="text-green-500 text-sm">{success}</p>
        </div>
      )}

      {analysis && (
        <div className="mt-6 p-4 bg-background-light rounded-lg border border-primary/20">
          <h3 className="text-xl font-bold text-primary mb-2">
            Analysis Results
          </h3>
          <pre className="whitespace-pre-wrap text-gray-300 text-sm overflow-auto">
            {analysis}
          </pre>
        </div>
      )}
    </div>
  );
}
