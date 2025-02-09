"use client";

import { useState, useEffect } from "react";
import { getUserNFTs } from "@/lib/nftContract";
import { ethers } from "ethers";
import { contractABI } from "@/lib/contractABI";
import { useAuth } from "@/context/AuthContext";
import { getMarketplaceNFTs, listNFTOnMarketplace } from "@/lib/marketplaceApi";

interface NFT {
  tokenId: string;
  name: string;
  description: string;
  audioUrl?: string;
  owner: string;
  properties?: {
    genre?: string;
    bpm?: number;
    duration?: number;
  };
  price?: string;
  currency?: string;
}

export default function NFTGallery() {
  const [activeTab, setActiveTab] = useState<"owned" | "marketplace">("owned");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingPrice, setListingPrice] = useState<string>("");
  const { user } = useAuth();
  const [currency, setCurrency] = useState<string>("ETH");

  useEffect(() => {
    loadNFTs();
  }, [activeTab, user]);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      if (activeTab === "owned" && user) {
        const userNfts = await getUserNFTs();
        setNfts(userNfts);
      } else {
        const marketplaceNfts = await getMarketplaceNFTs();
        setNfts(marketplaceNfts);
      }
    } catch (err) {
      setError("Failed to load NFTs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const listForSale = async (nft: NFT) => {
    try {
      if (!listingPrice) {
        alert("Please enter a price");
        return;
      }

      const marketplaceNFT = {
        ...nft,
        price: listingPrice,
        currency: currency,
      };

      await listNFTOnMarketplace(marketplaceNFT);
      alert("NFT listed on marketplace!");
      loadNFTs();
    } catch (error) {
      console.error("Error listing NFT:", error);
      alert("Failed to list NFT");
    }
  };

  const NFTCard = ({
    nft,
    isOwned = false,
  }: {
    nft: NFT;
    isOwned?: boolean;
  }) => {
    // Function to convert IPFS URL to HTTP gateway URL
    const getPlayableUrl = (url: string) => {
      if (!url) return "";
      // Convert IPFS URL to HTTP gateway URL
      if (url.startsWith("ipfs://")) {
        return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
      }
      return url;
    };

    return (
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-primary text-xl font-medium">
            {nft.name || "Untitled"}
          </h3>
        </div>

        {nft.audioUrl && (
          <div className="mb-6">
            <audio
              controls
              className="w-full rounded-lg bg-black/30"
              src={getPlayableUrl(nft.audioUrl)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <p className="text-gray-400 mb-4 line-clamp-2">
          {nft.description || "No description"}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {nft.properties && (
            <>
              {nft.properties.genre && (
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Genre</p>
                  <p className="text-primary-light">{nft.properties.genre}</p>
                </div>
              )}
              {nft.properties.bpm && (
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">BPM</p>
                  <p className="text-primary-light">{nft.properties.bpm}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <div className="bg-black/20 px-4 py-2 rounded-lg">
            <span className="text-gray-400 text-sm">Owner: </span>
            <span className="text-primary-light text-sm">
              {nft.owner
                ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}`
                : "Unknown"}
            </span>
          </div>
          <div className="bg-black/20 px-4 py-2 rounded-lg">
            <span className="text-gray-400 text-sm">Token ID: </span>
            <span className="text-primary-light text-sm">
              {nft.tokenId || "N/A"}
            </span>
          </div>
        </div>

        {isOwned && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                className="flex-1 p-2 rounded bg-black/30 border border-primary/20 text-white"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
              />
              <select
                className="p-2 rounded bg-black/30 border border-primary/20 text-white"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="ETH">ETH</option>
                <option value="MATIC">MATIC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <button
              onClick={() => listForSale(nft)}
              className="w-full bg-primary hover:bg-primary-dark text-white p-2 rounded transition-colors"
            >
              List for Sale
            </button>
          </div>
        )}

        {!isOwned && nft.price && (
          <div className="mt-4 bg-black/20 px-4 py-2 rounded-lg">
            <span className="text-gray-400 text-sm">Price: </span>
            <span className="text-primary-light text-sm">
              {nft.price} {nft.currency}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("owned")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeTab === "owned"
              ? "bg-primary text-white"
              : "bg-black/30 text-gray-400 hover:text-primary"
          }`}
        >
          My NFTs
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeTab === "marketplace"
              ? "bg-primary text-white"
              : "bg-black/30 text-gray-400 hover:text-primary"
          }`}
        >
          Marketplace
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {activeTab === "owned"
              ? "You don't own any NFTs yet"
              : "No NFTs found in the marketplace"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              nft={nft}
              isOwned={activeTab === "owned"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
