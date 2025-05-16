const express = require("express");
const router = express.Router();
const { submitMessage, getMessages } = require("../controllers/contactController");
const auth = require("../middleware/authMiddleware");

router.post("/", submitMessage);
router.get("/messages", auth, getMessages);

module.exports = router;