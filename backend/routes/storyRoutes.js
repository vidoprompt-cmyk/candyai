const express = require("express");
const router = express.Router();
const multer = require("multer");
const Story = require("../models/Story");

/* ===============================
   MULTER CONFIG
=================================*/
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ===============================
   GET STORIES
=================================*/

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    if (!category)
      return res.status(400).json({ message: "Category required" });

    // 🔥 Only live stories
    const stories = await Story.find({
      category,
      isLive: true
    }).sort({ updatedAt: -1 });

    res.json(stories);

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ===============================
   ADD STORY
=================================*/
router.post(
  "/add",
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { category, characterName, number } = req.body;

      if (!category || !characterName || !number)
        return res.status(400).json({ message: "All fields required" });

      const mediaFile = req.files?.media?.[0];
      const profileFile = req.files?.profileImage?.[0];

      if (!mediaFile)
        return res.status(400).json({ message: "Story media required" });

      let story = await Story.findOne({ category, characterName });

      /* 🔥 NEW CHARACTER */
      if (!story) {

        if (!profileFile) {
          return res.status(400).json({
            message: "Profile image required for new character"
          });
        }

        story = new Story({
          category,
          characterName,
          profileImage: profileFile.filename,
          stories: [
            {
              number: Number(number),
              type: mediaFile.mimetype.startsWith("video") ? "video" : "image",
              mediaUrl: mediaFile.filename
            }
          ]
        });

      } else {

        /* 🔥 EXISTING CHARACTER */

        // ✅ If profile missing earlier, allow setting once
        if (!story.profileImage && profileFile) {
          story.profileImage = profileFile.filename;
        }

        // ❌ Prevent changing profile if already exists
        if (story.profileImage && profileFile) {
          return res.status(400).json({
            message: "Profile image already exists"
          });
        }

        // ❌ Max 4 stories
        if (story.stories.length >= 4) {
          return res.status(400).json({
            message: "Only 4 stories allowed"
          });
        }

        // ❌ Prevent duplicate story number
        const exists = story.stories.find(
          (s) => s.number === Number(number)
        );

        if (exists) {
          return res.status(400).json({
            message: "Story number already exists"
          });
        }

        story.stories.push({
          number: Number(number),
          type: mediaFile.mimetype.startsWith("video") ? "video" : "image",
          mediaUrl: mediaFile.filename
        });
      }

      await story.save();
      res.json({ message: "Story added successfully" });

    } catch (err) {
      console.error("ADD ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ===============================
   UPDATE COVER IMAGE
=================================*/
router.put(
  "/update-cover/:id",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const story = await Story.findById(req.params.id);
      if (!story)
        return res.status(404).json({ message: "Not found" });

      if (!req.file)
        return res.status(400).json({ message: "Image required" });

      story.profileImage = req.file.filename;
      await story.save();

      res.json({ message: "Cover updated successfully" });

    } catch (err) {
      console.error("UPDATE COVER ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ===============================
   TOGGLE LIVE
=================================*/
router.put("/toggle-live/:id", async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story)
      return res.status(404).json({ message: "Not found" });

    story.isLive = !story.isLive;
    await story.save();

    res.json({ message: "Live updated" });

  } catch (err) {
    console.error("LIVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   DELETE STORY
=================================*/
router.delete("/:id", async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
