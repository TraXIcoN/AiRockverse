import { useState } from "react";
import { uploadToPinata } from "@/lib/pinata";
import { mintNFT } from "@/lib/nftContract";
import Link from "next/link";

interface MintNFTButtonProps {
  audioFile: File;
  trackMetadata: {
    name: string;
    description: string;
    genre: string;
    bpm: number;
    duration: number;
  };
}

export default function MintNFTButton({
  audioFile,
  trackMetadata,
}: MintNFTButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    setIsMinting(true);
    setError(null);

    try {
      // Upload to IPFS via Pinata
      const { metadataHash } = await uploadToPinata(audioFile, trackMetadata);

      // Mint NFT using the metadata URI
      const metadataURI = `ipfs://${metadataHash}`;
      const txHash = await mintNFT(metadataURI);

      // Save minting info to your database
      // ... implementation depends on your backend

      alert("NFT minted successfully!");
    } catch (err) {
      console.error("Error minting NFT:", err);
      setError("Failed to mint NFT. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleMint}
        disabled={isMinting}
        className={`px-6 py-3 rounded-lg ${
          isMinting
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-primary hover:bg-primary-dark"
        } text-white font-semibold transition-colors`}
      >
        {isMinting ? "Minting..." : "Mint NFT"}
      </button>

      <Link
        href="/nfts"
        className="block text-primary hover:text-primary-light text-sm mt-2"
      >
        View your NFT collection
      </Link>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
