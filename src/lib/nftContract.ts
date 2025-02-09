import { ethers } from "ethers";
import { contractABI } from "./contractABI";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

export async function mintNFT(metadataURI: string) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    // Connect to MetaMask using newer ethers syntax
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Connect to the NFT contract
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS!,
      contractABI,
      signer
    );

    // Mint NFT
    const tx = await contract.mintNFT(metadataURI);
    await tx.wait();

    return tx.hash;
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
