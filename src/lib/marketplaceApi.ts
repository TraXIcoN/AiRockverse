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
      throw new Error("Failed to fetch marketplace NFTs");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching marketplace NFTs:", error);
    throw error;
  }
}

export async function listNFTOnMarketplace(
  nft: Omit<MarketplaceNFT, "createdAt" | "isListed">
) {
  try {
    const response = await fetch("/api/marketplace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nft),
    });

    if (!response.ok) {
      throw new Error("Failed to list NFT on marketplace");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error listing NFT on marketplace:", error);
    throw error;
  }
}
