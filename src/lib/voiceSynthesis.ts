export class VoiceSynthesizer {
  private bpm: number;
  private mood: string;
  private genre: string;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null;
  private apiKey: string;

  constructor({
    bpm,
    mood,
    genre,
  }: {
    bpm: number;
    mood: string;
    genre: string;
  }) {
    this.bpm = bpm;
    this.mood = mood;
    this.genre = genre;
    this.audioContext = new AudioContext();
    this.currentSource = null;
    this.apiKey = process.env.NEXT_PUBLIC_SUNO_API_KEY!;
  }

  public async speakLine(text: string): Promise<void> {
    try {
      this.stop();

      // Prepare the prompt based on mood and genre
      const prompt = this.createMusicPrompt(text);

      // Call Suno API
      const response = await fetch("https://api.suno.ai/v1/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          tempo: this.bpm,
          duration: 8, // Adjust based on line length
          model: "bark", // or other available models
          settings: {
            mood: this.mood.toLowerCase(),
            genre: this.genre.toLowerCase(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Suno API error: ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);

      // Create and configure source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;

      // Add effects
      const effects = this.createEffects();
      let lastNode: AudioNode = this.currentSource;

      effects.forEach((effect) => {
        lastNode.connect(effect);
        lastNode = effect;
      });

      lastNode.connect(this.audioContext.destination);

      // Play the audio
      this.currentSource.start(0);

      return new Promise((resolve) => {
        if (this.currentSource) {
          this.currentSource.onended = () => resolve();
        }
      });
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }

  private createMusicPrompt(text: string): string {
    // Create a musical context based on mood and genre
    const moodContext = {
      aggressive: "Sing with power and intensity",
      dreamy: "Sing with ethereal, floating quality",
      melancholic: "Sing with emotional depth and sadness",
      romantic: "Sing with warmth and passion",
      energetic: "Sing with high energy and excitement",
      mysterious: "Sing with intrigue and suspense",
    };

    const genreStyle = {
      electronic: "with electronic vocal effects",
      rock: "with rock vocal style",
      jazz: "with jazz phrasing",
      classical: "with classical vocal technique",
    };

    const moodInstruction =
      moodContext[this.mood.toLowerCase()] || "Sing naturally";
    const styleInstruction = genreStyle[this.genre.toLowerCase()] || "";

    return `${moodInstruction} ${styleInstruction}: ${text}`;
  }

  private createEffects(): AudioNode[] {
    const effects: AudioNode[] = [];

    // Add genre-specific effects
    if (this.genre.toLowerCase() === "electronic") {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 800;
      effects.push(filter);
    }

    return effects;
  }

  public stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }
}
