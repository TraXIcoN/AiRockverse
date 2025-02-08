"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import WaveSurfer from "wavesurfer.js";
import { useAuth } from "@/context/AuthContext";
import { openai } from "@/lib/openai";

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

export default function DAW({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [effects, setEffects] = useState<Effect[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const playerRef = useRef<Tone.Player | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const effectChainRef = useRef<Tone.Effect[]>([]);

  useEffect(() => {
    // Initialize WaveSurfer
    wavesurferRef.current = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#8b5cf6",
      progressColor: "#4c1d95",
      cursorColor: "#4c1d95",
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
    });

    // Load audio
    wavesurferRef.current.load(audioUrl);

    // Initialize Tone.js player
    playerRef.current = new Tone.Player(audioUrl, () => {
      setIsLoaded(true);
      initializeEffects();
    }).toDestination();

    return () => {
      wavesurferRef.current?.destroy();
      playerRef.current?.dispose();
      effectChainRef.current.forEach((effect) => effect.dispose());
    };
  }, [audioUrl]);

  const initializeEffects = () => {
    const reverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.5,
    });

    const eq = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
    });

    const delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.3,
      wet: 0.3,
    });

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

    // Connect effects chain
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current.chain(
        ...newEffects.map((e) => e.node),
        Tone.Destination
      );
    }

    effectChainRef.current = newEffects.map((e) => e.node);
    setEffects(newEffects);
  };

  const togglePlayback = () => {
    if (!isLoaded) return;

    if (isPlaying) {
      playerRef.current?.stop();
      wavesurferRef.current?.stop();
    } else {
      playerRef.current?.start();
      wavesurferRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleParameterChange = async (
    effectId: string,
    parameter: string,
    value: number
  ) => {
    const effect = effects.find((e) => e.id === effectId);
    if (!effect) return;

    // Update effect parameter
    (effect.node as any)[parameter] = value;

    // Update state
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

    // Get AI feedback
    await getAIFeedback();
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
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Waveform */}
      <div id="waveform" className="bg-background-light rounded-lg p-4" />

      {/* Transport */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={togglePlayback}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors"
          disabled={!isLoaded}
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

      {/* AI Feedback */}
      <div className="bg-background-light p-4 rounded-lg">
        <h3 className="text-lg font-bold text-primary mb-2">AI Feedback</h3>
        <div className="text-gray-300">
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>Analyzing...</span>
            </div>
          ) : (
            feedback || "Adjust parameters to get AI feedback"
          )}
        </div>
      </div>
    </div>
  );
}
