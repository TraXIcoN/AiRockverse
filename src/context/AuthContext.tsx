"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createUserDocument, getUserDocument } from "@/lib/db";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserDataLocally: (newData: UserData) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  updateUserDataLocally: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const updateUserDataLocally = (newData: UserData) => {
    setUserData(newData);
  };

  useEffect(() => {
    try {
      const unsubscribe = auth.onAuthStateChanged(
        async (user) => {
          setAuthInitialized(true);
          setUser(user);

          if (user) {
            try {
              const data = await getUserDocument(user.uid);
              if (data) {
                setUserData(data);
              }
            } catch (err) {
              console.error("Error fetching user data:", err);
              setError("Failed to load user data");
            }
          } else {
            setUserData(null);
          }

          setLoading(false);
        },
        (error) => {
          console.error("Auth state change error:", error);
          setError("Authentication error occurred");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Auth initialization error:", err);
      setError("Failed to initialize authentication");
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setError("Failed to sign in with Google");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out");
    }
  };

  // Don't render anything until Firebase Auth is initialized
  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-primary">Initializing...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateUserDataLocally,
      }}
    >
      {error ? (
        <div className="text-red-500 p-4 text-center">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
