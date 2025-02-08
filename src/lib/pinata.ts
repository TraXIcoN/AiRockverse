import axios from "axios";

export const uploadToPinata = async (file: File) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    // Make request to Pinata
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
};
