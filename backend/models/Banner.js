const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["Guys", "Girls", "Anime"],
    required: true,
    unique: true
  },
  banners: [
    {
      desktopImage: String,
      mobileImage: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model("Banner", bannerSchema);
