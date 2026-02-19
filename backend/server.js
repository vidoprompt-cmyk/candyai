const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();

const app = express();

/* ===============================
   MIDDLEWARE
=================================*/

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// 🔥 SESSION REQUIRED FOR GOOGLE LOGIN
app.use(session({
  secret: "googleSecretKey",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   ROUTES
=================================*/

const authRoutes = require("./routes/authRoutes");
const characterRoutes = require("./routes/characterRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/character", characterRoutes);
app.use("/api/banner", require("./routes/bannerRoutes"));
app.use("/api/story", require("./routes/storyRoutes"));
app.use("/uploads", express.static("uploads"));




/* ===============================
   DATABASE
=================================*/

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ===============================
   TEST ROUTE
=================================*/

app.get("/", (req, res) => {
  res.send("API Running");
});

/* ===============================
   SERVER
=================================*/

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
