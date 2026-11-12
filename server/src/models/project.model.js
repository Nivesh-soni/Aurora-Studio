import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  fileName: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: "" },
  kind: { type: String, enum: ["video", "image", "audio"], required: true },
  size: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  aspectRatio: { type: String, enum: ["16:9", "9:16", "1:1", "4:3", "21:9"], default: "16:9" },
  backgroundColor: { type: String, match: /^#[\da-f]{6}$/i, default: "#000000" },
  backgroundAssetId: { type: String, default: null },
  assets: { type: [AssetSchema], default: [] },
  clips: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true });

export default mongoose.model("Project", ProjectSchema);
