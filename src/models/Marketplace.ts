import mongoose from "mongoose";

const MarketplaceSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  audioUrl: String,
  owner: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ["ETH", "MATIC", "USDT"], // restrict to supported currencies
  },
  properties: {
    genre: String,
    bpm: Number,
    duration: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.Marketplace ||
  mongoose.model("Marketplace", MarketplaceSchema);
