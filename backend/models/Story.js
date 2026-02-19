const mongoose = require("mongoose");

const storyItemSchema = new mongoose.Schema({
  number: { type: Number, required: true, min: 1, max: 4 },
  type: { type: String, enum: ["image", "video"], required: true },
  mediaUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const storySchema = new mongoose.Schema({
  category: { type: String, required: true },
  characterName: { type: String, required: true },

  profileImage: {   
    type: String,
  },

  isLive: { type: Boolean, default: false },

  stories: {
    type: [storyItemSchema],
    validate: [(arr) => arr.length <= 4, "Max 4 stories allowed"]
  }
}, { timestamps: true });

// 🔥 prevent duplicate name in same category
storySchema.index({ category: 1, characterName: 1 }, { unique: true });

module.exports = mongoose.model("Story", storySchema);
