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
