"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { uploadToPinata } from "@/lib/pinata";

export default function UploadForm() {
  const { user, signInWithGoogle } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in first");
      return;
    }
    if (!file) {
      alert("Please select a file");
      return;
    }

    try {
      setUploading(true);
      const ipfsUrl = await uploadToPinata(file);
      console.log("File uploaded to IPFS:", ipfsUrl);
      // Here you can save the IPFS URL to your database
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {!user ? (
        <button
          onClick={signInWithGoogle}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
        >
          Sign in with Google to Upload
        </button>
      ) : (
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4"
          />
          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Beat"}
          </button>
        </form>
      )}
    </div>
  );
}
