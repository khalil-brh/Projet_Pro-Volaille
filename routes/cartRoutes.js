const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

router.get("/cart", userAuth, getCart);
router.post("/cart", userAuth, addToCart);
router.put("/cart/:itemId", userAuth, updateCartItem);
router.delete("/cart/:itemId", userAuth, removeFromCart);
router.delete("/cart", userAuth, clearCart);

module.exports = router;
