import Meyda from "meyda";

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new AudioContext();
    }
  }

  async loadAudio(url: string): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log("Audio loaded successfully", {
        duration: this.audioBuffer.duration,
        sampleRate: this.audioBuffer.sampleRate,
        numberOfChannels: this.audioBuffer.numberOfChannels,
      });
    } catch (error) {
      console.error("Error loading audio:", error);
      throw new Error("Failed to load audio file");
    }
  }

  async analyze() {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error("Audio not loaded");
    }

    console.log("Starting analysis...");
    const features: any[] = [];
    const bufferSize = 2048;
    const hopSize = 1024;

    // Convert audio buffer to mono channel
    const audioData = this.audioBuffer.getChannelData(0);
    console.log("Audio data length:", audioData.length);

    // Validate audio data
    if (audioData.length === 0) {
      throw new Error("No audio data available");
    }

    // Process audio in chunks
    let validChunks = 0;
    let totalEnergy = 0;
    let maxEnergy = 0;

    for (let i = 0; i < audioData.length; i += hopSize) {
      const chunk = new Float32Array(bufferSize);
      for (let j = 0; j < bufferSize && i + j < audioData.length; j++) {
        chunk[j] = audioData[i + j];
      }

      // Calculate RMS of the chunk to check for silence
      const rms = Math.sqrt(
        chunk.reduce((sum, x) => sum + x * x, 0) / bufferSize
      );

      // Skip silent chunks
      if (rms < 0.001) continue;

      try {
        // Extract features for this chunk
        const chunkFeatures = Meyda.extract(
          [
            "rms",
            "zcr",
            "spectralCentroid",
            "spectralRolloff",
            "spectralFlatness",
            "energy",
          ],
          chunk
        );

        if (chunkFeatures) {
          // Normalize energy values
          chunkFeatures.energy = Math.max(0, chunkFeatures.energy);
          totalEnergy += chunkFeatures.energy;
          maxEnergy = Math.max(maxEnergy, chunkFeatures.energy);

          features.push(chunkFeatures);
          validChunks++;
        }
      } catch (error) {
        console.warn("Error analyzing chunk:", error);
        continue;
      }
    }

    console.log("Valid chunks analyzed:", validChunks);
    if (validChunks === 0) {
      throw new Error("No valid audio chunks found");
    }

    // Calculate averages and other metrics
    const analysis = this.processFeatures(features);

    // Normalize the analysis values
    const normalizedAnalysis = {
      ...analysis,
      averageEnergy: Math.max(0.01, analysis.averageEnergy || 0),
      averageLoudness: Math.max(-60, analysis.averageLoudness || -60),
      spectralCentroid: Math.max(0, analysis.spectralCentroid || 0),
      spectralRolloff: Math.max(0, analysis.spectralRolloff || 0),
      spectralFlatness: Math.max(0, analysis.spectralFlatness || 0),
      dynamics: {
        peak: Math.max(0, analysis.dynamics?.peak || 0),
        dynamicRange: Math.max(0, analysis.dynamics?.dynamicRange || 0),
      },
    };

    console.log("Normalized analysis results:", normalizedAnalysis);
    return normalizedAnalysis;
  }

  private processFeatures(features: any[]) {
    if (features.length === 0) {
      console.warn("No features to process");
      return this.getDefaultAnalysis();
    }

    // Calculate averages
    const sums = features.reduce((acc, feature) => {
      Object.keys(feature).forEach((key) => {
        if (typeof feature[key] === "number") {
          acc[key] = (acc[key] || 0) + Math.max(0, feature[key]);
        }
      });
      return acc;
    }, {});

    const averages = Object.keys(sums).reduce((acc, key) => {
      acc[key] = sums[key] / features.length;
      return acc;
    }, {} as any);

    // Calculate BPM using zero-crossing rate
    const zcrArray = features.map((f) => f.zcr);
    const bpm = this.estimateBPM(zcrArray);

    // Calculate dynamics
    const rmsArray = features.map((f) => f.rms).filter((v) => v > 0);
    const dynamics = {
      peak: Math.max(...rmsArray, 0.01),
      dynamicRange: Math.max(
        Math.max(...rmsArray) - Math.min(...rmsArray),
        0.01
      ),
    };

    // Detect sections using spectral changes
    const spectralChanges = features.map((f) => f.spectralCentroid);
    const sections = this.detectSections(spectralChanges);

    return {
      bpm: Math.max(60, Math.min(200, bpm)), // Clamp BPM between 60 and 200
      averageEnergy: averages.energy,
      averageLoudness: -20 * Math.log10(averages.rms || 0.0001), // Convert RMS to dB
      spectralCentroid: averages.spectralCentroid,
      spectralRolloff: averages.spectralRolloff,
      spectralFlatness: averages.spectralFlatness,
      dynamics,
      sections,
    };
  }

  private getDefaultAnalysis() {
    return {
      bpm: 120,
      averageEnergy: 0,
      averageLoudness: 0,
      spectralCentroid: 0,
      spectralRolloff: 0,
      spectralFlatness: 0,
      dynamics: {
        peak: 0,
        dynamicRange: 0,
      },
      sections: [],
    };
  }

  private estimateBPM(zcrArray: number[]): number {
    const peaks = this.findPeaks(zcrArray);
    const avgInterval = this.calculateAveragePeakInterval(peaks);
    if (!avgInterval) return 120; // Default BPM if calculation fails

    const bpm = Math.round(
      60 / ((avgInterval / this.audioBuffer!.sampleRate) * 1024)
    );
    return Math.min(Math.max(bpm, 60), 200); // Clamp between 60 and 200 BPM
  }

  private findPeaks(array: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < array.length - 1; i++) {
      if (array[i] > array[i - 1] && array[i] > array[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private calculateAveragePeakInterval(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    return intervals.reduce((a, b) => a + b) / intervals.length;
  }

  private detectSections(
    spectralChanges: number[]
  ): { start: number; end: number }[] {
    if (!this.audioBuffer) return [];

    const threshold = 0.15;
    const sections: { start: number; end: number }[] = [];
    let sectionStart = 0;

    for (let i = 1; i < spectralChanges.length; i++) {
      const change = Math.abs(spectralChanges[i] - spectralChanges[i - 1]);
      if (change > threshold) {
        sections.push({
          start: (sectionStart * 1024) / this.audioBuffer.sampleRate,
          end: (i * 1024) / this.audioBuffer.sampleRate,
        });
        sectionStart = i;
      }
    }

    // Add final section
    if (this.audioBuffer) {
      sections.push({
        start: (sectionStart * 1024) / this.audioBuffer.sampleRate,
        end: this.audioBuffer.duration,
      });
    }

    return sections;
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
