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
    const address = await signer.getAddress();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS!,
      contractABI,
      signer
    );

    // Get the current token ID counter
    const currentId = await contract._tokenIds();
    console.log("Current token ID:", currentId);

    const userNFTs = [];

    // Iterate through possible token IDs
    for (let i = 1; i <= Number(currentId); i++) {
      try {
        // Check if token exists and get owner
        const owner = await contract.ownerOf(i);

        // If the current user owns this token
        if (owner.toLowerCase() === address.toLowerCase()) {
          const tokenURI = await contract.tokenURI(i);
          const price = await contract.getTokenPrice(i);
          const isListed = await contract.isListed(i);

          // Convert IPFS URI to HTTP URL
          const httpURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

          try {
            // Fetch metadata
            const response = await fetch(httpURI);
            const metadata = await response.json();

            userNFTs.push({
              tokenId: i,
              owner: owner,
              tokenURI: tokenURI,
              metadata: metadata,
              price: price,
              isListed: isListed,
            });
          } catch (metadataError) {
            console.error(
              `Error fetching metadata for token ${i}:`,
              metadataError
            );
          }
        }
      } catch (tokenError) {
        // Skip if token doesn't exist or other error
        continue;
      }
    }

    console.log("Found user NFTs:", userNFTs);
    return userNFTs;
  } catch (error) {
    console.error("Error getting user NFTs:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch NFTs: ${error.message}`);
    }
    throw new Error("Failed to fetch NFTs");
  }
}

// Helper function to get a single NFT's details
export async function getNFTDetails(tokenId: number) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS!,
      contractABI,
      provider
    );

    const tokenURI = await contract.tokenURI(tokenId);
    const owner = await contract.ownerOf(tokenId);
    const price = await contract.getTokenPrice(tokenId);
    const isListed = await contract.isListed(tokenId);

    // Fetch metadata
    const httpURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
    const response = await fetch(httpURI);
    const metadata = await response.json();

    return {
      tokenId,
      owner,
      tokenURI,
      metadata,
      price,
      isListed,
    };
  } catch (error) {
    console.error("Error getting NFT details:", error);
    throw new Error(`Failed to fetch NFT #${tokenId}`);
  }
}

// Helper function to format IPFS URI to HTTP URL
export function formatIPFSUrl(ipfsUrl: string) {
  if (!ipfsUrl) return "";
  return ipfsUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
}
