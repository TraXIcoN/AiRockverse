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

export async function saveTrackAnalysis(
  userId: string,
  trackData: Omit<TrackAnalysis, "id" | "createdAt" | "updatedAt">
) {
  try {
    const tracksCollectionRef = collection(db, "tracks");
    const newTrackRef = doc(tracksCollectionRef);

    const trackWithMetadata = {
      ...trackData,
      id: newTrackRef.id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(newTrackRef, trackWithMetadata);
    return trackWithMetadata;
  } catch (error) {
    console.error("Error saving track analysis:", error);
    throw error;
  }
}

export async function getUserTracks(userId: string): Promise<TrackAnalysis[]> {
  try {
    const tracksCollectionRef = collection(db, "tracks");
    // Simplified query without ordering
    const q = query(tracksCollectionRef, where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const tracks = querySnapshot.docs.map((doc) => doc.data() as TrackAnalysis);

    // Sort in memory instead
    return tracks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
