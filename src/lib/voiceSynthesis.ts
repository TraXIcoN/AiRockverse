export class VoiceSynthesizer {
  private bpm: number;
  private mood: string;
  private genre: string;
  private apiKey: string;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private readonly MAX_CONTENT_LENGTH = 190; // Content length without ## markers

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
    this.apiKey = process.env.NEXT_PUBLIC_AIML_API_KEY!;
    this.audioContext = new AudioContext();
    this.currentSource = null;
  }

  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = null;
    }
  }

  async speakLine(
    text: string,
    theme: string,
    keywords: string
  ): Promise<Blob> {
    try {
      const url = "https://api.aimlapi.com/v2/generate/audio/minimax/generate";

      // Format lyrics with proper structure and length limit
      const content = text.slice(0, this.MAX_CONTENT_LENGTH).trim();

      const formattedLyrics = `##\n${content}\n##`;

      console.log("Lyrics length:", formattedLyrics.length); // Should be ~184 chars

      const payload = {
        refer_voice: "vocal-2025010100000000-a0AAAaaa",
        refer_instrumental: "instrumental-2025010100000000-Aaa0aAaA",
        lyrics: formattedLyrics,
        model: "music-01",
        parameters: {
          bpm: this.bpm,
          mood: this.mood.toLowerCase(),
          genre: this.genre.toLowerCase(),
          theme,
          keywords: keywords.join(", "),
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(
          `Voice generation failed (${response.status}): ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      const audioBuffer = Buffer.from(data.data.audio, "hex");
      return new Blob([audioBuffer], { type: "audio/mpeg" });
    } catch (error) {
      console.error("Voice synthesis error:", error);
      throw error;
    }
  }
}
