"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractABI } from "@/lib/contractABI";

interface SaleRecord {
  seller: string;
  buyer: string;
  price: string;
  timestamp: Date;
}

export default function NFTSaleHistory({ tokenId }: { tokenId: string }) {
  const [saleHistory, setSaleHistory] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaleHistory();
  }, [tokenId]);

  const loadSaleHistory = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!,
        contractABI,
        provider
      );

      const history = await contract.getTokenSaleHistory(tokenId);

      const formattedHistory = history.map((record: any) => ({
        seller: record.seller,
        buyer: record.buyer,
        price: ethers.formatEther(record.price),
        timestamp: new Date(Number(record.timestamp) * 1000),
      }));

      setSaleHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading sale history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading sale history...</div>;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">Sale History</h3>
      {saleHistory.length === 0 ? (
        <p>No sales recorded</p>
      ) : (
        <div className="space-y-2">
          {saleHistory.map((sale, index) => (
            <div key={index} className="bg-background-light p-3 rounded-lg">
              <p>Price: {sale.price} ETH</p>
              <p className="text-sm">
                From: {sale.seller.slice(0, 6)}...{sale.seller.slice(-4)}
              </p>
              <p className="text-sm">
                To: {sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}
              </p>
              <p className="text-xs text-gray-400">
                {sale.timestamp.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
