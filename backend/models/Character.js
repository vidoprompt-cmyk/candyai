const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema({
  name: String,
  image: String,
  category: { type: String, enum: ["girls", "guys", "anime"] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Character", characterSchema);
