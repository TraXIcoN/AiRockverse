"use client";

import { useState, useEffect } from "react";
import { getUserNFTs } from "@/lib/nftContract";
import NFTSaleHistory from "./NFTSaleHistory";
import { ethers } from "ethers";
import { contractABI } from "@/lib/contractABI";

interface NFT {
  tokenId: string;
  name: string;
  description: string;
  audioUrl?: string;
  properties?: {
    genre?: string;
    bpm?: number;
    duration?: number;
  };
}

export default function NFTGallery() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingPrice, setListingPrice] = useState<string>("");

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const userNfts = await getUserNFTs();
      setNfts(userNfts);
    } catch (err) {
      setError("Failed to load NFTs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const listForSale = async (tokenId: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
        contractABI,
        signer
      );

      const price = ethers.parseEther(listingPrice);
      const tx = await contract.listForSale(tokenId, price);
      await tx.wait();

      alert("NFT listed for sale!");
    } catch (error) {
      console.error("Error listing NFT:", error);
    }
  };

  const buyNFT = async (tokenId: string, price: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
        contractABI,
        signer
      );

      const tx = await contract.buyToken(tokenId, {
        value: ethers.parseEther(price),
      });
      await tx.wait();

      alert("NFT purchased successfully!");
      loadNFTs(); // Refresh the NFT list
    } catch (error) {
      console.error("Error buying NFT:", error);
    }
  };

  if (loading) return <div>Loading your NFTs...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (nfts.length === 0) return <div>No NFTs found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 mt-24">
      {nfts.map((nft) => (
        <div
          key={nft.tokenId}
          className="bg-background-light rounded-lg p-4 border border-primary/20 hover:border-primary/40 transition-all"
        >
          <h3 className="text-xl font-bold text-primary mb-2">
            {nft.name || "Untitled"}
          </h3>
          <p className="text-gray-400 mb-4">
            {nft.description || "No description"}
          </p>

          {nft.audioUrl && (
            <audio controls className="w-full mb-4" src={nft.audioUrl}>
              Your browser does not support the audio element.
            </audio>
          )}

          <div className="text-sm text-gray-500">
            {nft.properties && (
              <>
                {nft.properties.genre && <p>Genre: {nft.properties.genre}</p>}
                {nft.properties.bpm && <p>BPM: {nft.properties.bpm}</p>}
                {nft.properties.duration && (
                  <p>Duration: {nft.properties.duration}s</p>
                )}
              </>
            )}
            <p className="text-xs mt-2">Token ID: {nft.tokenId}</p>
          </div>

          <div className="mt-4 space-y-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Price in ETH"
              className="w-full p-2 rounded bg-background border border-primary/20 text-white"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
            />
            <button
              onClick={() => nft.tokenId && listForSale(nft.tokenId)}
              className="w-full bg-primary hover:bg-primary-dark text-white p-2 rounded transition-colors"
            >
              List for Sale
            </button>
          </div>

          <NFTSaleHistory tokenId={nft.tokenId} />
        </div>
      ))}
    </div>
  );
}
