"use client";

import { useState, useEffect } from "react";
import { getUserNFTs, formatIPFSUrl } from "@/lib/nftContract";
import NFTSaleHistory from "./NFTSaleHistory";
import { ethers } from "ethers";
import { contractABI } from "@/lib/contractABI";
import { useAuth } from "@/context/AuthContext";

interface NFT {
  tokenId: number;
  owner: string;
  tokenURI: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    audio: string;
  };
  price: bigint;
  isListed: boolean;
}

export default function NFTGallery() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNFTs();
    }
  }, [user]);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      const userNfts = await getUserNFTs();
      setNfts(userNfts);
    } catch (err) {
      console.error("Error loading NFTs:", err);
      setError("Failed to load NFTs");
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

  if (loading) {
    return <div className="text-center py-8">Loading your NFTs...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (nfts.length === 0) {
    return <div className="text-center py-8">No NFTs found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {nfts.map((nft) => (
        <div
          key={nft.tokenId}
          className="bg-background-light rounded-lg p-4 shadow-lg"
        >
          <div className="aspect-square rounded-lg overflow-hidden mb-4">
            <img
              src={formatIPFSUrl(nft.metadata.image)}
              alt={nft.metadata.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-bold mb-2">{nft.metadata.name}</h3>
          <p className="text-gray-400 mb-4">{nft.metadata.description}</p>
          {nft.isListed && (
            <p className="text-primary">
              Price: {ethers.formatEther(nft.price)} ETH
            </p>
          )}
          <audio
            controls
            className="w-full mt-4"
            src={formatIPFSUrl(nft.metadata.audio)}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      ))}
    </div>
  );
}
