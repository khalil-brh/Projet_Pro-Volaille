const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: { type: String, required: true },
  pricePerKg: { type: Number, required: true },
  kg: { type: Number, required: true, min: 0.1 },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "shipped", "delivered", "rejected"],
      default: "pending",
    },
    estimatedDate: { type: Date, default: null },
    address: {
      street: { type: String, required: true },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      region: { type: String, default: "" },
    },
    phone: { type: String, required: true },
    notes: { type: String, default: "" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
