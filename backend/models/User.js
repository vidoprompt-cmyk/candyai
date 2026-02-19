const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nickname: { type: String },

  gender: { type: String, enum: ["Male", "Female"] },

  isAdultConfirmed: { type: Boolean, default: false },

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: { type: String, default: "user" },
  isLoggedIn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  otp: { type: String },
  otpExpiry: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
