const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

// USER
router.post("/orders", userAuth, createOrder);
router.get("/orders/me", userAuth, getMyOrders);

// ADMIN
router.get("/admin/orders", adminAuth, getAllOrders);
router.put("/admin/orders/:id", adminAuth, updateOrderStatus);
router.delete("/admin/orders/:id", adminAuth, deleteOrder);

module.exports = router;
