import OpenAI from "openai";

const openai = new OpenAI({
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

export async function analyzeTrackWithAI(analysis: AudioAnalysis) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a professional music producer providing detailed feedback on tracks.",
        },
        {
          role: "user",
          content: `Please analyze this track with the following metrics:
            BPM: ${analysis.bpm}
            Loudness: ${analysis.loudness}
            Frequency Analysis:
            - Low End: ${analysis.frequency.low}
            - Mid Range: ${analysis.frequency.mid}
            - High End: ${analysis.frequency.high}
            
            Provide feedback on:
            1. Mix balance
            2. Sound design
            3. Rhythm and groove
            4. Areas for improvement`,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing with OpenAI:", error);
    throw error;
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
        content: `You are an expert music producer and mixing engineer. Analyze tracks and provide detailed, genre-specific feedback. Focus on actionable improvements and technical details.`,
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

          Provide detailed feedback including:
          1. Detect the likely genre
          2. Score out of 100
          3. List specific improvements needed
          4. List current strengths
          5. Technical feedback for mixing, arrangement, and sound design
          
          Format as JSON.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content) as DetailedFeedback;
}
