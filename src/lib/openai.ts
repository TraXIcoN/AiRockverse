import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface AudioAnalysis {
  bpm: number;
  loudness: number;
  frequency: {
    low: number;
    mid: number;
    high: number;
  };
}

interface DetailedFeedback {
  genre: string;
  score: number;
  improvements: string[];
  strengths: string[];
  technicalFeedback: {
    mixing: string;
    arrangement: string;
    sound_design: string;
  };
}

export async function analyzeTrackWithAI(analysis: any) {
  try {
    const prompt = `
      Analyze this track:
      BPM: ${analysis.bpm}
      Energy: ${analysis.averageEnergy?.toFixed(2)}
      Loudness: ${analysis.averageLoudness?.toFixed(2)}
      Spectral:
      - Centroid: ${analysis.spectralCentroid?.toFixed(2)}
      - Rolloff: ${analysis.spectralRolloff?.toFixed(2)}
      - Flatness: ${analysis.spectralFlatness?.toFixed(2)}
      Dynamics:
      - Peak: ${analysis.dynamics?.peak?.toFixed(2)}
      - Range: ${analysis.dynamics?.dynamicRange?.toFixed(2)}
      Sections: ${analysis.sections?.length || 0}

      Provide a concise JSON response:
      {
        "genre": "main genre",
        "subgenres": ["max 2 subgenres"],
        "mood": "primary mood",
        "moodTags": ["3-4 mood keywords"],
        "style": "brief style description",
        "productionQuality": {
          "strengths": ["2-3 points"],
          "weaknesses": ["2-3 points"]
        },
        "technicalFeedback": {
          "mixing": "1-2 sentences",
          "arrangement": "1-2 sentences",
          "sound_design": "1-2 sentences"
        },
        "notableElements": ["2-3 key features"],
        "character": "1-2 sentence summary"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a music producer providing concise track analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error in AI analysis:", error);
    throw new Error("Failed to analyze track with AI");
  }
}

export async function generateDetailedFeedback(
  trackData: TrackAnalysis
): Promise<DetailedFeedback> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert music producer and mixing engineer. Analyze tracks and provide detailed, genre-specific feedback. 
        Always respond in this exact JSON format:
        {
          "genre": "detected genre",
          "score": number between 0-100,
          "improvements": ["improvement1", "improvement2", "improvement3"],
          "strengths": ["strength1", "strength2", "strength3"],
          "technicalFeedback": {
            "mixing": "detailed mixing feedback",
            "arrangement": "detailed arrangement feedback",
            "sound_design": "detailed sound design feedback"
          }
        }`,
      },
      {
        role: "user",
        content: `Analyze this track with the following metrics:
          BPM: ${trackData.analysis.bpm}
          Loudness: ${trackData.analysis.loudness}
          Frequency Analysis:
          - Low End: ${trackData.analysis.frequency.low}
          - Mid Range: ${trackData.analysis.frequency.mid}
          - High End: ${trackData.analysis.frequency.high}

          Provide detailed feedback including genre detection, scoring, improvements, strengths, and technical feedback.
          Remember to respond in the exact JSON format specified.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    return JSON.parse(content) as DetailedFeedback;
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    throw new Error("Failed to generate detailed feedback");
  }
}
