import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Marketplace from "@/models/Marketplace";

// GET all marketplace listings
export async function GET() {
  try {
    await connectDB();
    const listings = await Marketplace.find({ isListed: true }).sort({
      createdAt: -1,
    });
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching marketplace listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace listings" },
      { status: 500 }
    );
  }
}

// POST new listing
export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    // Validate required fields
    if (
      !data.tokenId ||
      !data.name ||
      !data.owner ||
      !data.price ||
      !data.currency
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new listing
    const newListing = await Marketplace.create({
      tokenId: data.tokenId,
      name: data.name,
      description: data.description,
      audioUrl: data.audioUrl,
      owner: data.owner,
      price: data.price,
      currency: data.currency,
      properties: data.properties,
    });

    return NextResponse.json(newListing, { status: 201 });
  } catch (error) {
    console.error("Error creating marketplace listing:", error);
    return NextResponse.json(
      { error: "Failed to create marketplace listing" },
      { status: 500 }
    );
  }
}
