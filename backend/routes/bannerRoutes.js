const express = require("express");
const router = express.Router();
const Banner = require("../models/Banner");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Upload folder create if not exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Setup
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ===============================
   ADD BANNER
================================ */
router.post(
  "/",
  upload.fields([
    { name: "desktopImage", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      if (!req.files.desktopImage || !req.files.mobileImage) {
        return res.status(400).json({ error: "Images required" });
      }

      const category = req.body.category;

      const bannerData = {
        desktopImage: req.files.desktopImage[0].path,
        mobileImage: req.files.mobileImage[0].path
      };

      const existingCategory = await Banner.findOne({ category });

      if (existingCategory) {
        existingCategory.banners.push(bannerData);
        await existingCategory.save();
      } else {
        await Banner.create({
          category,
          banners: [bannerData]
        });
      }

      res.json({ success: true });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


/* ===============================
   GET BY CATEGORY
================================ */
router.get("/:category", async (req, res) => {
  try {
    const categoryDoc = await Banner.findOne({
      category: req.params.category
    });

    if (!categoryDoc) return res.json([]);

    res.json(categoryDoc.banners);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ===============================
   DELETE BANNER
================================ */
router.delete("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    // Delete images from uploads folder
    if (fs.existsSync(banner.desktopImage)) {
      fs.unlinkSync(banner.desktopImage);
    }

    if (fs.existsSync(banner.mobileImage)) {
      fs.unlinkSync(banner.mobileImage);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
