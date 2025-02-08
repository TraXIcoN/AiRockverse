import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { generateDetailedFeedback } from "./openai";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackAnalysis {
  id: string;
  userId: string;
  fileName: string;
  ipfsUrl: string;
  genre?: string;
  analysis: {
    bpm: number;
    loudness: number;
    frequency: {
      low: number;
      mid: number;
      high: number;
    };
  };
  aiFeedback: {
    basic: string;
    detailed?: {
      genre: string;
      score: number;
      improvements: string[];
      strengths: string[];
      technicalFeedback: {
        mixing: string;
        arrangement: string;
        sound_design: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export async function createUserDocument(uid: string, data: Partial<UserData>) {
  try {
    const userRef = doc(db, "users", uid);
    const userData = {
      uid,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, userData, { merge: true });
    return userData;
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
}

export async function getUserDocument(uid: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user document:", error);
    throw error;
  }
}

export async function updateUserDocument(uid: string, data: Partial<UserData>) {
  try {
    const userRef = doc(db, "users", uid);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(userRef, updateData);
    return updateData;
  } catch (error) {
    console.error("Error updating user document:", error);
    throw error;
  }
}

export async function saveTrackAnalysis(userId: string, data: any) {
  try {
    // Ensure all analysis values are valid numbers or default to 0
    const safeAnalysis = {
      bpm: Number(data.analysis?.bpm) || 120,
      averageEnergy: Number(data.analysis?.averageEnergy) || 0,
      averageLoudness: Number(data.analysis?.averageLoudness) || 0,
      spectralCentroid: Number(data.analysis?.spectralCentroid) || 0,
      spectralRolloff: Number(data.analysis?.spectralRolloff) || 0,
      spectralFlatness: Number(data.analysis?.spectralFlatness) || 0,
      dynamics: {
        peak: Number(data.analysis?.dynamics?.peak) || 0,
        dynamicRange: Number(data.analysis?.dynamics?.dynamicRange) || 0,
      },
      sections: Array.isArray(data.analysis?.sections)
        ? data.analysis.sections
        : [],
    };

    // Ensure AI feedback has all required fields
    const safeAiFeedback = {
      genre: data.aiFeedback?.genre || "Unknown",
      subgenres: Array.isArray(data.aiFeedback?.subgenres)
        ? data.aiFeedback.subgenres
        : [],
      mood: data.aiFeedback?.mood || "Unknown",
      moodTags: Array.isArray(data.aiFeedback?.moodTags)
        ? data.aiFeedback.moodTags
        : [],
      style: data.aiFeedback?.style || "Unknown",
      productionQuality: {
        strengths: Array.isArray(data.aiFeedback?.productionQuality?.strengths)
          ? data.aiFeedback.productionQuality.strengths
          : [],
        weaknesses: Array.isArray(
          data.aiFeedback?.productionQuality?.weaknesses
        )
          ? data.aiFeedback.productionQuality.weaknesses
          : [],
      },
      technicalFeedback: {
        mixing:
          data.aiFeedback?.technicalFeedback?.mixing || "No feedback available",
        arrangement:
          data.aiFeedback?.technicalFeedback?.arrangement ||
          "No feedback available",
        sound_design:
          data.aiFeedback?.technicalFeedback?.sound_design ||
          "No feedback available",
      },
      notableElements: Array.isArray(data.aiFeedback?.notableElements)
        ? data.aiFeedback.notableElements
        : [],
      character: data.aiFeedback?.character || "No description available",
    };

    // Create a new document with a generated ID
    const docRef = doc(collection(db, "tracks"));
    const trackDoc = {
      id: docRef.id, // Add the ID to the document data
      userId,
      fileName: data.fileName,
      ipfsUrl: data.ipfsUrl,
      createdAt: serverTimestamp(),
      analysis: safeAnalysis,
      aiFeedback: safeAiFeedback,
    };

    // Save the document
    await setDoc(docRef, trackDoc);
    return docRef.id;
  } catch (error) {
    console.error("Error saving track analysis:", error);
    throw new Error("Failed to save track analysis");
  }
}

export async function getUserTracks(userId: string): Promise<any[]> {
  try {
    const tracksCollectionRef = collection(db, "tracks");
    const q = query(tracksCollectionRef, where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const tracks = querySnapshot.docs.map((doc) => ({
      id: doc.id, // Ensure ID is included
      ...doc.data(),
    }));

    console.log("Retrieved tracks:", tracks);

    // Sort in memory
    return tracks.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Timestamp
          ? a.createdAt.toDate()
          : new Date(a.createdAt);
      const dateB =
        b.createdAt instanceof Timestamp
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error getting user tracks:", error);
    throw error;
  }
}

export async function getTrackById(
  trackId: string
): Promise<TrackAnalysis | null> {
  try {
    const trackRef = doc(db, "tracks", trackId);
    const trackDoc = await getDoc(trackRef);

    if (trackDoc.exists()) {
      return trackDoc.data() as TrackAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Error getting track:", error);
    throw error;
  }
}

export async function getDetailedAnalysis(
  trackId: string
): Promise<TrackAnalysis | null> {
  const trackRef = doc(db, "tracks", trackId);
  const trackDoc = await getDoc(trackRef);

  if (!trackDoc.exists()) return null;

  const trackData = trackDoc.data() as TrackAnalysis;

  // If detailed analysis doesn't exist, generate it
  if (!trackData.aiFeedback.detailed) {
    const detailedFeedback = await generateDetailedFeedback(trackData);

    // Update the document with detailed feedback
    await updateDoc(trackRef, {
      "aiFeedback.detailed": detailedFeedback,
      updatedAt: new Date().toISOString(),
    });

    return {
      ...trackData,
      aiFeedback: {
        ...trackData.aiFeedback,
        detailed: detailedFeedback,
      },
    };
  }

  return trackData;
}

export async function loadTrackDetails(trackId: string) {
  try {
    console.log("Loading track:", trackId);
    const trackDoc = await getDoc(doc(db, "tracks", trackId));

    if (!trackDoc.exists()) {
      console.error("Track document not found:", trackId);
      throw new Error("Track not found");
    }

    const trackData = trackDoc.data();
    console.log("Track data loaded:", trackData);

    // Ensure the track has an ID
    const track = {
      id: trackDoc.id,
      ...trackData,
      // Ensure all required fields have default values
      analysis: {
        bpm: trackData.analysis?.bpm || 120,
        averageEnergy: trackData.analysis?.averageEnergy || 0,
        averageLoudness: trackData.analysis?.averageLoudness || 0,
        spectralCentroid: trackData.analysis?.spectralCentroid || 0,
        spectralRolloff: trackData.analysis?.spectralRolloff || 0,
        spectralFlatness: trackData.analysis?.spectralFlatness || 0,
        dynamics: {
          peak: trackData.analysis?.dynamics?.peak || 0,
          dynamicRange: trackData.analysis?.dynamics?.dynamicRange || 0,
        },
        sections: trackData.analysis?.sections || [],
      },
      aiFeedback: {
        genre: trackData.aiFeedback?.genre || "Unknown",
        subgenres: trackData.aiFeedback?.subgenres || [],
        mood: trackData.aiFeedback?.mood || "Unknown",
        moodTags: trackData.aiFeedback?.moodTags || [],
        style: trackData.aiFeedback?.style || "Unknown",
        productionQuality: {
          strengths: trackData.aiFeedback?.productionQuality?.strengths || [],
          weaknesses: trackData.aiFeedback?.productionQuality?.weaknesses || [],
        },
        technicalFeedback: {
          mixing:
            trackData.aiFeedback?.technicalFeedback?.mixing ||
            "No feedback available",
          arrangement:
            trackData.aiFeedback?.technicalFeedback?.arrangement ||
            "No feedback available",
          sound_design:
            trackData.aiFeedback?.technicalFeedback?.sound_design ||
            "No feedback available",
        },
        notableElements: trackData.aiFeedback?.notableElements || [],
        character:
          trackData.aiFeedback?.character || "No description available",
      },
    };

    return track;
  } catch (error) {
    console.error("Error loading track details:", error);
    throw error;
  }
}
