import * as Tone from "tone";

interface VoiceSynthOptions {
  bpm: number;
  mood: string;
  genre: string;
}

export class VoiceSynthesizer {
  private synth: Tone.Synth;
  private effects: {
    reverb: Tone.Reverb;
    delay: Tone.FeedbackDelay;
    chorus: Tone.Chorus;
  };

  constructor(options: VoiceSynthOptions) {
    // Initialize synthesizer with characteristics based on genre and mood
    this.synth = new Tone.Synth({
      oscillator: {
        type: this.getOscillatorType(options.genre),
      },
      envelope: this.getEnvelope(options.mood),
    });

    // Initialize effects
    this.effects = {
      reverb: new Tone.Reverb({
        decay: this.getReverbDecay(options.mood),
        wet: 0.5,
      }),
      delay: new Tone.FeedbackDelay({
        delayTime: "8n",
        feedback: 0.2,
        wet: 0.3,
      }),
      chorus: new Tone.Chorus({
        frequency: 4,
        delayTime: 2.5,
        depth: 0.5,
        wet: 0.3,
      }),
    };

    // Connect effects chain
    this.synth.chain(
      this.effects.chorus,
      this.effects.delay,
      this.effects.reverb,
      Tone.Destination
    );
  }

  private getOscillatorType(genre: string): Tone.ToneOscillatorType {
    switch (genre.toLowerCase()) {
      case "electronic":
        return "sawtooth";
      case "ambient":
        return "sine";
      case "rock":
        return "square";
      default:
        return "triangle";
    }
  }

  private getEnvelope(mood: string) {
    switch (mood.toLowerCase()) {
      case "aggressive":
        return {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.8,
        };
      case "dreamy":
        return {
          attack: 0.5,
          decay: 1,
          sustain: 0.8,
          release: 3,
        };
      default:
        return {
          attack: 0.1,
          decay: 0.5,
          sustain: 0.5,
          release: 1,
        };
    }
  }

  private getReverbDecay(mood: string): number {
    switch (mood.toLowerCase()) {
      case "dreamy":
        return 5;
      case "dark":
        return 3;
      case "aggressive":
        return 1;
      default:
        return 2;
    }
  }

  public async speakLine(text: string, pitch: number, duration: number) {
    await Tone.start();

    const notes = this.textToNotes(text, pitch);
    const noteDuration = duration / notes.length;

    notes.forEach((note, index) => {
      this.synth.triggerAttackRelease(
        note,
        noteDuration,
        Tone.now() + index * noteDuration
      );
    });
  }

  private textToNotes(text: string, basePitch: number): string[] {
    // Convert text to musical notes based on syllables
    const syllables = text
      .split(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi)
      .filter(Boolean);

    const scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
    return syllables.map((_, i) => scale[i % scale.length]);
  }
}
