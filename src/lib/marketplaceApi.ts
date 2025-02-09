import { ethers } from "ethers";

interface MarketplaceNFT {
  tokenId: string;
  name: string;
  description: string;
  audioUrl?: string;
  owner: string;
  price: string;
  currency: string; // ETH, MATIC, etc.
  properties?: {
    genre?: string;
    bpm?: number;
    duration?: number;
  };
  createdAt: string;
  isListed: boolean;
}

export async function getMarketplaceNFTs(): Promise<MarketplaceNFT[]> {
  try {
    const response = await fetch("/api/marketplace", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text(); // Get the raw response text
      console.error("API Response:", text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse the JSON response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.error("Raw Response:", await response.text());
      throw new Error("Failed to parse JSON response");
    }

    return data;
  } catch (error) {
    console.error("Error fetching marketplace NFTs:", error);
    throw error;
  }
}

export async function listNFTOnMarketplace(nft: any) {
  try {
    // Get the current user's address
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const ownerAddress = await signer.getAddress();

    const response = await fetch("/api/marketplace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...nft,
        owner: ownerAddress,
        audioUrl: nft.audio, // Map audio to audioUrl
        properties: {
          genre: nft.genre,
          bpm: nft.bpm,
          duration: nft.duration,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API Response:", text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error listing NFT on marketplace:", error);
    throw error;
  }
}

// Optional: Add function to track plays
export async function trackNFTPlay(tokenId: string) {
  try {
    const response = await fetch("/api/marketplace/track-play", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tokenId }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API Response:", text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error tracking NFT play:", error);
    throw error;
  }
}
