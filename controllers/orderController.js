const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const socket = require("../socket");
const { sendOrderStatusChangeEmail } = require("../utils/sendEmail");

// Helper: check if a product has an active general discount
const getActiveDiscount = (product) => {
  if (!product.discount || product.discount <= 0) return 0;
  const now = new Date();
  if (product.discountStartDate && new Date(product.discountStartDate) > now) return 0;
  if (product.discountEndDate && new Date(product.discountEndDate) < now) return 0;
  return product.discount;
};

// USER: Create order from cart
exports.createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isValid) {
      return res.status(403).json({ message: "Compte non approuvé" });
    }

    const { address, phone, notes } = req.body;

    if (!address || !address.street || !address.city || !address.postalCode || !phone) {
      return res.status(400).json({ message: "Adresse et téléphone requis" });
    }

    const cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Le panier est vide" });
    }

    // Build order items with calculated prices
    const orderItems = [];
    for (const item of cart.items) {
      if (!item.productId) continue;

      const product = item.productId;
      const activeDiscount = getActiveDiscount(product);

      let unitPrice = product.price;
      const userDiscount = (user.discounts || []).find(
        (d) => d.productId.toString() === product._id.toString()
      );
      if (userDiscount && userDiscount.percentage > 0) {
        unitPrice = +(unitPrice * (1 - userDiscount.percentage / 100)).toFixed(2);
      }
      if (activeDiscount > 0) {
        unitPrice = +(unitPrice * (1 - activeDiscount / 100)).toFixed(2);
      }

      orderItems.push({
        productId: product._id,
        title: product.title,
        pricePerKg: unitPrice,
        kg: item.kg,
        subtotal: +(unitPrice * item.kg).toFixed(2),
      });
    }

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await Order.create({
      userId: req.userId,
      items: orderItems,
      total: +total.toFixed(2),
      address,
      phone,
      notes: notes || "",
    });

    // Clear cart after order
    cart.items = [];
    await cart.save();

    // Notify admin
    const notification = await Notification.create({
      type: "new_order",
      message: `Nouvelle commande de ${user.name} — ${total.toFixed(2)} TND`,
      userId: user._id,
    });

    const io = socket.getIO();
    io.emit("new_notification", notification);

    res.status(201).json({ message: "Commande créée avec succès", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// USER: Get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Get all orders (paginated + search)
exports.getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || "";
    const status = req.query.status || "";

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate("userId", "name email companyName number")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // If search, filter by user name/email after populate
    let filtered = orders;
    if (search) {
      const s = search.toLowerCase();
      filtered = orders.filter(
        (o) =>
          o.userId?.name?.toLowerCase().includes(s) ||
          o.userId?.email?.toLowerCase().includes(s) ||
          o.userId?.companyName?.toLowerCase().includes(s),
      );
    }

    const total = search
      ? filtered.length
      : await Order.countDocuments(filter);

    res.json({
      orders: filtered,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, estimatedDate, adminNote } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Statut requis" });
    }

    const updateData = { status };
    if (estimatedDate !== undefined) updateData.estimatedDate = estimatedDate;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const order = await Order.findByIdAndUpdate(
  req.params.id,
  updateData,
  { new: true }
).populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    // Notify user about status change
    const statusLabels = {
      approved: "approuvée",
      processing: "en préparation",
      shipped: "expédiée",
      delivered: "livrée",
      rejected: "refusée",
    };

    const label = statusLabels[status] || status;
    const notification = await Notification.create({
      type: "order_update",
      message: `Votre commande #${order._id.toString().slice(-6).toUpperCase()} a été ${label}.${estimatedDate ? ` Livraison estimée : ${new Date(estimatedDate).toLocaleDateString("fr-FR")}` : ""}`,
      userId: order.userId,
    });

    const io = socket.getIO();
    io.emit(`notification_${order.userId}`, notification);

    // Send verification email
   
    sendOrderStatusChangeEmail(
  order.userId.email,
  order.id,
  order.status,
  order.estimatedDate,
  order.adminNote
).catch(() => {});



    res.json({ message: "Commande mise à jour", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Delete order
exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Commande supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
