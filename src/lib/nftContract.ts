import { ethers } from "ethers";
import { contractABI } from "./contractABI";
import { uploadToPinata } from "./pinata_fileUpload";
import { listNFTOnMarketplace } from "./marketplaceApi";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

export async function mintNFT(
  audioFile: File,
  metadata: {
    name: string;
    description: string;
    properties: {
      genre?: string;
      bpm?: number;
      duration?: number;
    };
  }
) {
  try {
    // Use existing uploadToPinata function
    const audioUrl = await uploadToPinata(audioFile);

    // Create metadata with audio URL
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      audioUrl: audioUrl,
      properties: metadata.properties,
    };

    // Upload metadata to IPFS using the same function
    const metadataUrl = await uploadToPinata(
      new Blob([JSON.stringify(nftMetadata)], { type: "application/json" })
    );

    // Mint NFT
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
      contractABI,
      signer
    );

    const tx = await contract.mintNFT(metadataUrl);
    const receipt = await tx.wait();

    // Get the token ID from the event
    const event = receipt.logs.find((log: any) => log.eventName === "Transfer");
    const tokenId = event.args[2].toString();

    // List in marketplace
    await listNFTOnMarketplace({
      tokenId,
      name: metadata.name,
      description: metadata.description,
      audioUrl,
      owner: await signer.getAddress(),
      price: "0", // Initial price set to 0
      currency: "ETH",
      properties: metadata.properties,
    });

    return {
      success: true,
      tokenId,
      audioUrl,
      metadataUrl,
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}

export async function getUserNFTs() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS!,
      contractABI,
      signer
    );

    // Get token IDs owned by user
    const tokenIds = await contract.tokensOfOwner(userAddress);

    if (!tokenIds || tokenIds.length === 0) {
      return []; // Return empty array if no tokens found
    }

    // Convert tokenIds to array and remove duplicates
    const uniqueTokenIds = [
      ...new Set(tokenIds.map((id) => id.toString())),
    ].map((id) => BigInt(id));

    // Get metadata for each unique token
    const nfts = await Promise.all(
      uniqueTokenIds.map(async (tokenId: bigint) => {
        try {
          const uri = await contract.tokenURI(tokenId);
          // Remove ipfs:// prefix if present
          const cleanUri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
          const metadata = await fetch(cleanUri).then((r) => r.json());
          return {
            tokenId: tokenId.toString(),
            ...metadata,
            audioUrl: metadata.animation_url?.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            ),
          };
        } catch (error) {
          console.error(`Error fetching metadata for token ${tokenId}:`, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed metadata fetches
    return nfts.filter((nft) => nft !== null);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw error;
  }
}

export async function getAllNFTs() {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
      contractABI,
      provider
    );

    // Get total supply of NFTs
    const totalSupply = await contract.totalSupply();
    const nfts = [];

    // Fetch each NFT's data
    for (let i = 1; i <= totalSupply; i++) {
      try {
        const tokenId = i.toString();
        const tokenURI = await contract.tokenURI(tokenId);
        const owner = await contract.ownerOf(tokenId);
        const isListed = await contract.isTokenListed(tokenId);
        const price = isListed ? await contract.getTokenPrice(tokenId) : null;

        // Fetch metadata from IPFS or your storage
        const response = await fetch(tokenURI);
        const metadata = await response.json();

        nfts.push({
          tokenId,
          owner,
          price: price ? ethers.formatEther(price) : null,
          isListed,
          name: metadata.name,
          description: metadata.description,
          audioUrl: metadata.audioUrl,
          properties: {
            genre: metadata.properties?.genre,
            bpm: metadata.properties?.bpm,
            duration: metadata.properties?.duration,
          },
        });
      } catch (error) {
        console.error(`Error fetching NFT ${i}:`, error);
        // Continue with the next NFT if one fails
        continue;
      }
    }

    return nfts;
  } catch (error) {
    console.error("Error fetching all NFTs:", error);
    throw error;
  }
}
