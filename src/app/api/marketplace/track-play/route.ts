import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Marketplace from "@/models/Marketplace";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { tokenId } = await req.json();

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    const nft = await Marketplace.findOneAndUpdate(
      { tokenId },
      { $inc: { playCount: 1 } },
      { new: true }
    );

    if (!nft) {
      return NextResponse.json({ error: "NFT not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, playCount: nft.playCount });
  } catch (error) {
    console.error("Error tracking play:", error);
    return NextResponse.json(
      { error: "Failed to track play" },
      { status: 500 }
    );
  }
}
