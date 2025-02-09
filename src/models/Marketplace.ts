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
  audioUrl: {
    type: String,
    required: true,
  },
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
  playCount: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.Marketplace ||
  mongoose.model("Marketplace", MarketplaceSchema);
