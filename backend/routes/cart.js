const express = require("express");
const router = express.Router();
const { addToCart, getCart, placeOrder } = require("../controllers/cartController");

router.post("/", addToCart);
router.get("/", getCart);
router.post("/order", placeOrder);

module.exports = router;