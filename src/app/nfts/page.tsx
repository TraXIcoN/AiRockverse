"use client";

import NFTGallery from "@/components/NFTGallery";

export default function NFTsPage() {
  return (
    <div className="container mx-auto py-8 mt-24">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Your NFT Collection
      </h1>
      <NFTGallery />
    </div>
  );
}
