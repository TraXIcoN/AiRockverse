import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  try {
    // Deploy the contract
    console.log("Deploying MusicNFT contract...");
    const MusicNFT = await ethers.getContractFactory("MusicNFT");
    const musicNFT = await MusicNFT.deploy();
    await musicNFT.waitForDeployment();

    const address = await musicNFT.getAddress();
    console.log("MusicNFT deployed to:", address);

    // Wait for a few block confirmations
    console.log("Waiting for block confirmations...");
    await musicNFT.deploymentTransaction()?.wait(6);

    // Verify the contract on Etherscan
    console.log("Verifying contract on Etherscan...");
    await verify(address, []);

    console.log("Deployment and verification complete!");

    // Save the contract address
    console.log("\nAdd this to your .env.local file:");
    console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${address}`);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
