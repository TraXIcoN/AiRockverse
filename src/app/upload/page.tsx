"use client";

import FileUpload from "@/components/FileUpload";

export default function UploadPage() {
  return (
    <div className="min-h-screen pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Upload Your Track
          </h1>
          <p className="text-gray-400">
            Upload your music to get AI-powered feedback
          </p>
        </div>

        <FileUpload />
      </div>
    </div>
  );
}
