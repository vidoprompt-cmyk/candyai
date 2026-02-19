const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/* =========================
   REGISTER
=========================*/
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be minimum 6 characters" });

    const userExist = await User.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashed
    });

    res.status(201).json({ message: "Registered Successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   LOGIN
=========================*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });


    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        gender: user.gender,
        isAdultConfirmed: user.isAdultConfirmed
      }
    });


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   LOGOUT
=========================*/
exports.logout = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      user.isLoggedIn = false;
      await user.save();
    }

    res.json({ message: "Logged out successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   SEND OTP
=========================*/
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   RESET PASSWORD
=========================*/
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be minimum 6 characters" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    user.isLoggedIn = false;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.completeProfile = async (req, res) => {
  try {
    const { nickname, gender, isAdultConfirmed } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only update fields if provided
    if (nickname !== undefined) {
      user.nickname = nickname;
    }

    if (gender !== undefined) {
      user.gender = gender;
    }

    if (isAdultConfirmed !== undefined) {
      user.isAdultConfirmed = isAdultConfirmed;
    }

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        gender: user.gender,
        isAdultConfirmed: user.isAdultConfirmed
      }
    });

  } catch (err) {
    console.error(err);   // 🔥 add this for debugging
    res.status(500).json({ error: err.message });
  }
};





exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


