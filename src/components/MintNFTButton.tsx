import { useState } from "react";
import { uploadToPinata } from "@/lib/pinata";
import { mintNFT } from "@/lib/nftContract";

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

      // Wait for transaction confirmation
      // await txHash.wait();

      alert("NFT minted successfully!");
    } catch (err) {
      console.error("Error minting NFT:", err);
      setError(
        typeof err === "string" ? err : "Failed to mint NFT. Please try again."
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div>
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

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
