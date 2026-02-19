const router = require("express").Router();
const Character = require("../models/Character");

router.get("/:category", async (req, res) => {
  const characters = await Character.find({
    category: req.params.category
  });
  res.json(characters);
});

module.exports = router;
