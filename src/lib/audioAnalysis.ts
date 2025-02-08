export class AudioAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async loadAudio(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading audio:", error);
      throw error;
    }
  }

  async analyze(): Promise<{
    bpm: number;
    loudness: number;
    frequency: {
      low: number;
      mid: number;
      high: number;
    };
  }> {
    if (!this.audioBuffer) {
      throw new Error("No audio loaded");
    }

    // Calculate BPM
    const bpm = await this.detectBPM();

    // Calculate average loudness
    const loudness = this.calculateLoudness();

    // Analyze frequency bands
    const frequency = this.analyzeFrequencyBands();

    return {
      bpm,
      loudness,
      frequency,
    };
  }

  private async detectBPM(): Promise<number> {
    if (!this.audioBuffer) return 0;

    const peaks = await this.findPeaks();
    const intervals = this.getIntervals(peaks);
    return this.calculateBPMFromIntervals(intervals);
  }

  private async findPeaks(): Promise<number[]> {
    if (!this.audioBuffer) return [];

    const data = this.audioBuffer.getChannelData(0);
    const peaks: number[] = [];
    const threshold = 0.8;

    for (let i = 0; i < data.length; i++) {
      if (data[i] > threshold) {
        peaks.push(i);
      }
    }

    return peaks;
  }

  private getIntervals(peaks: number[]): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    return intervals;
  }

  private calculateBPMFromIntervals(intervals: number[]): number {
    if (intervals.length === 0) return 0;

    const averageInterval =
      intervals.reduce((a, b) => a + b) / intervals.length;
    return Math.round((60 * this.audioBuffer!.sampleRate) / averageInterval);
  }

  private calculateLoudness(): number {
    if (!this.audioBuffer) return 0;

    const data = this.audioBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
    }
    return sum / data.length;
  }

  private analyzeFrequencyBands() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Split frequency bands
    const lowEnd = dataArray.slice(0, bufferLength / 3);
    const midRange = dataArray.slice(bufferLength / 3, (2 * bufferLength) / 3);
    const highEnd = dataArray.slice((2 * bufferLength) / 3);

    return {
      low: this.getAverageVolume(lowEnd),
      mid: this.getAverageVolume(midRange),
      high: this.getAverageVolume(highEnd),
    };
  }

  private getAverageVolume(array: Uint8Array): number {
    const values = Array.from(array);
    return values.reduce((a, b) => a + b) / values.length;
  }
}
