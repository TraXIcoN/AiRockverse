"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as Tone from "tone";
import WaveSurfer from "wavesurfer.js";
import { useAuth } from "@/context/AuthContext";
import { openai } from "@/lib/openai";
import { VoiceSynthesizer } from "@/lib/voiceSynthesis";

interface Effect {
  id: string;
  name: string;
  type: "reverb" | "eq" | "delay";
  node: Tone.Effect;
  parameters: {
    [key: string]: {
      value: number;
      min: number;
      max: number;
      step: number;
    };
  };
}

interface DAWProps {
  audioUrl: string;
  bpm: number;
  genre: string;
  mood?: string;
  lyrics?: Array<{ text: string; startTime: number; endTime: number }>;
  onPlaybackStateChange?: (
    playing: boolean,
    time: number,
    duration: number
  ) => void;
  ref?: React.RefObject<{ exportAudio: () => Promise<Blob> }>;
}

const DAW = forwardRef<{ exportAudio: () => Promise<Blob> }, DAWProps>(
  ({ audioUrl, bpm, genre, mood, lyrics = [], onPlaybackStateChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [feedback, setFeedback] = useState<string>("");
    const [effects, setEffects] = useState<Effect[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const playerRef = useRef<Tone.Player | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const effectChainRef = useRef<Tone.Effect[]>([]);
    const synthRef = useRef<VoiceSynthesizer | null>(null);

    useEffect(() => {
      // Initialize WaveSurfer
      if (!wavesurferRef.current) {
        wavesurferRef.current = WaveSurfer.create({
          container: "#waveform",
          waveColor: "#8b5cf6",
          progressColor: "#4c1d95",
          cursorColor: "#4c1d95",
          barWidth: 2,
          barRadius: 3,
          responsive: true,
          height: 100,
          backend: "WebAudio",
          normalize: true,
        });

        // Load audio
        wavesurferRef.current.load(audioUrl);

        // Event listeners
        wavesurferRef.current.on("ready", () => {
          console.log("WaveSurfer is ready");
          setIsLoaded(true);
          const totalDuration = wavesurferRef.current?.getDuration() || 0;
          setDuration(totalDuration);
          onPlaybackStateChange?.(false, 0, totalDuration);
        });

        wavesurferRef.current.on("audioprocess", (time: number) => {
          console.log("Audio processing:", time);
          setCurrentTime(time);
          onPlaybackStateChange?.(isPlaying, time, duration);
        });

        wavesurferRef.current.on("play", () => {
          console.log("Audio playing");
          setIsPlaying(true);
          onPlaybackStateChange?.(true, currentTime, duration);
        });

        wavesurferRef.current.on("pause", () => {
          console.log("Audio paused");
          setIsPlaying(false);
          onPlaybackStateChange?.(false, currentTime, duration);
        });

        wavesurferRef.current.on("finish", () => {
          console.log("Audio finished");
          setIsPlaying(false);
          onPlaybackStateChange?.(false, duration, duration);
        });

        wavesurferRef.current.on("error", (error) => {
          console.error("WaveSurfer error:", error);
        });
      }

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      };
    }, [audioUrl]);

    useEffect(() => {
      if (isLoaded && wavesurferRef.current) {
        initializeEffects();
      }
    }, [isLoaded]);

    const initializeEffects = () => {
      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.5,
      }).toDestination();

      const eq = new Tone.EQ3({
        low: 0,
        mid: 0,
        high: 0,
      }).toDestination();

      const delay = new Tone.FeedbackDelay({
        delayTime: 0.25,
        feedback: 0.3,
        wet: 0.3,
      }).toDestination();

      const newEffects: Effect[] = [
        {
          id: "reverb",
          name: "Reverb",
          type: "reverb",
          node: reverb,
          parameters: {
            decay: { value: 1.5, min: 0.1, max: 4, step: 0.1 },
            wet: { value: 0.5, min: 0, max: 1, step: 0.01 },
          },
        },
        {
          id: "eq",
          name: "EQ",
          type: "eq",
          node: eq,
          parameters: {
            low: { value: 0, min: -12, max: 12, step: 1 },
            mid: { value: 0, min: -12, max: 12, step: 1 },
            high: { value: 0, min: -12, max: 12, step: 1 },
          },
        },
        {
          id: "delay",
          name: "Delay",
          type: "delay",
          node: delay,
          parameters: {
            delayTime: { value: 0.25, min: 0, max: 1, step: 0.01 },
            feedback: { value: 0.3, min: 0, max: 0.9, step: 0.01 },
            wet: { value: 0.3, min: 0, max: 1, step: 0.01 },
          },
        },
      ];

      setEffects(newEffects);
    };

    // Initialize voice synthesizer
    useEffect(() => {
      if (lyrics?.length > 0) {
        synthRef.current = new VoiceSynthesizer({
          bpm,
          mood: mood || "neutral",
          genre,
        });
      }
      return () => {
        if (synthRef.current) {
          Tone.Transport.stop();
        }
      };
    }, [lyrics, bpm, mood, genre]);

    // Handle voice synthesis for current line
    useEffect(() => {
      if (!isPlaying || !lyrics?.length || !synthRef.current) return;

      const currentLine = lyrics.find(
        (line) => currentTime >= line.startTime && currentTime <= line.endTime
      );

      if (currentLine) {
        const duration = currentLine.endTime - currentLine.startTime;
        synthRef.current.speakLine(currentLine.text, bpm / 60, duration);
      }

      return () => {
        Tone.Transport.stop();
      };
    }, [isPlaying, currentTime, lyrics, bpm]);

    // Modified togglePlayback to handle both tracks
    const togglePlayback = async () => {
      if (!wavesurferRef.current || !isLoaded) return;

      try {
        if (isPlaying) {
          await wavesurferRef.current.pause();
          if (synthRef.current) {
            Tone.Transport.stop();
          }
        } else {
          // Ensure audio context is resumed
          const audioContext = wavesurferRef.current.getMediaElement()?.context;
          if (audioContext?.state === "suspended") {
            await audioContext.resume();
          }
          await wavesurferRef.current.play();
          // Voice synthesis will automatically sync through the currentTime effect
        }
      } catch (error) {
        console.error("Playback error:", error);
      }
    };

    const handleParameterChange = (
      effectId: string,
      parameter: string,
      value: number
    ) => {
      const effect = effects.find((e) => e.id === effectId);
      if (!effect) return;

      switch (effect.type) {
        case "reverb":
          if (parameter === "decay") {
            (effect.node as Tone.Reverb).decay = value;
          } else if (parameter === "wet") {
            (effect.node as Tone.Reverb).wet.value = value;
          }
          break;

        case "eq":
          if (parameter === "low") {
            (effect.node as Tone.EQ3).low.value = value;
          } else if (parameter === "mid") {
            (effect.node as Tone.EQ3).mid.value = value;
          } else if (parameter === "high") {
            (effect.node as Tone.EQ3).high.value = value;
          }
          break;

        case "delay":
          if (parameter === "delayTime") {
            (effect.node as Tone.FeedbackDelay).delayTime.value = value;
          } else if (parameter === "feedback") {
            (effect.node as Tone.FeedbackDelay).feedback.value = value;
          } else if (parameter === "wet") {
            (effect.node as Tone.FeedbackDelay).wet.value = value;
          }
          break;
      }

      setEffects(
        effects.map((e) =>
          e.id === effectId
            ? {
                ...e,
                parameters: {
                  ...e.parameters,
                  [parameter]: { ...e.parameters[parameter], value },
                },
              }
            : e
        )
      );

      // Set pending changes flag
      setPendingChanges(true);
    };

    const getAIFeedback = async () => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);

      try {
        const currentSettings = effects.map((effect) => ({
          name: effect.name,
          parameters: Object.entries(effect.parameters).map(([key, value]) => ({
            name: key,
            value: value.value,
          })),
        }));

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are an expert music producer providing real-time feedback on audio effects settings. Keep responses brief and actionable.",
            },
            {
              role: "user",
              content: `Current effect settings:\n${JSON.stringify(
                currentSettings,
                null,
                2
              )}\n\nProvide brief feedback on these settings and suggest improvements.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        });

        setFeedback(response.choices[0].message.content || "");
      } catch (error) {
        console.error("Error getting AI feedback:", error);
        setFeedback("Error getting feedback");
      } finally {
        setIsAnalyzing(false);
      }

      // Reset pending changes flag
      setPendingChanges(false);
    };

    // Add export functionality
    const exportAudio = async (): Promise<Blob> => {
      // This is a basic example - you'll need to implement
      // the actual logic to export audio with effects
      const response = await fetch(audioUrl);
      const audioData = await response.blob();
      return audioData;
    };

    // Expose the export function via ref
    useImperativeHandle(ref, () => ({
      exportAudio,
    }));

    return (
      <div className="w-full space-y-6">
        {/* Waveform */}
        <div id="waveform" className="bg-background-light rounded-lg p-4" />

        {/* Transport */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={togglePlayback}
            disabled={!isLoaded}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isLoaded
                ? "bg-primary hover:bg-primary-dark text-white"
                : "bg-primary/50 cursor-not-allowed text-white/50"
            }`}
          >
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>

        {/* Effects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {effects.map((effect) => (
            <div
              key={effect.id}
              className="bg-background-light p-4 rounded-lg space-y-4"
            >
              <h3 className="text-lg font-bold text-primary">{effect.name}</h3>
              {Object.entries(effect.parameters).map(([param, config]) => (
                <div key={param} className="space-y-2">
                  <label className="text-sm text-gray-400">
                    {param}: {config.value.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={config.value}
                    onChange={(e) =>
                      handleParameterChange(
                        effect.id,
                        param,
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* AI Feedback Section */}
        <div className="bg-background p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary">AI Feedback</h3>
            <button
              onClick={getAIFeedback}
              disabled={isAnalyzing || !pendingChanges}
              className={`px-4 py-2 rounded-lg ${
                isAnalyzing || !pendingChanges
                  ? "bg-primary/50 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              } text-white transition-colors`}
            >
              {isAnalyzing
                ? "Analyzing..."
                : pendingChanges
                ? "Get Feedback"
                : "No Changes"}
            </button>
          </div>

          <div className="text-gray-300">
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Analyzing...</span>
              </div>
            ) : (
              feedback ||
              'Make changes and click "Get Feedback" for AI suggestions'
            )}
          </div>
        </div>

        {/* Voice Track Visualization */}
        {lyrics?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold text-primary mb-2">Voice Track</h3>
            <div className="bg-background-light rounded-lg p-4">
              <div className="h-12 relative">
                {lyrics.map((line, index) => (
                  <div
                    key={index}
                    className={`absolute h-full transition-opacity duration-300 ${
                      currentTime >= line.startTime &&
                      currentTime <= line.endTime
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                    style={{
                      left: `${(line.startTime / duration) * 100}%`,
                      width: `${
                        ((line.endTime - line.startTime) / duration) * 100
                      }%`,
                      background:
                        "linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)",
                      borderRadius: "0.25rem",
                    }}
                  >
                    <div className="absolute bottom-full mb-1 text-xs text-gray-400 whitespace-nowrap">
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default DAW;
