import axios from "axios";
import FormData from "form-data";

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToPinata(audioFile: File, metadata: any) {
  try {
    // First upload the audio file
    const formData = new FormData();
    formData.append("file", audioFile);

    const fileResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const audioHash = fileResponse.data.IpfsHash;

    // Then upload the metadata
    const metadataWithAudio = {
      ...metadata,
      audio: `ipfs://${audioHash}`,
      image: `ipfs://${audioHash}`, // Optional: if you want to use audio as display
    };

    const metadataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadataWithAudio,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY!,
          pinata_secret_api_key: PINATA_SECRET_KEY!,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      audioHash: audioHash,
      metadataHash: metadataResponse.data.IpfsHash,
    };
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw new Error("Failed to upload to Pinata");
  }
}
