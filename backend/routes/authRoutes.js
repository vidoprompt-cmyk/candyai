const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const {
  register,
  login,
  logout,
  sendOtp,
  resetPassword,
  completeProfile,
  changePassword,
  deleteAccount
} = require("../controllers/authController");

/* ===============================
   NORMAL AUTH ROUTES
=================================*/

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/reset-password", resetPassword);
router.post("/complete-profile", authMiddleware, completeProfile);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);


/* ===============================
   GOOGLE STRATEGY SETUP
=================================*/

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            password: "google-auth",
            role: "user"
          });
        }

        return done(null, user);

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));


/* ===============================
   GOOGLE LOGIN ROUTES
=================================*/

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000"
  }),
  async (req, res) => {

    const user = await User.findById(req.user._id);

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = encodeURIComponent(JSON.stringify({
      id: user._id,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender,
      isAdultConfirmed: user.isAdultConfirmed
    }));

    res.redirect(
      `http://localhost:3000/google-success?token=${token}&user=${userData}`
    );
  }
);


module.exports = router;
