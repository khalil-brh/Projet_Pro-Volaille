const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");

// Helper: check if a product has an active general discount
const getActiveDiscount = (product) => {
  if (!product.discount || product.discount <= 0) return 0;
  const now = new Date();
  if (product.discountStartDate && new Date(product.discountStartDate) > now) return 0;
  if (product.discountEndDate && new Date(product.discountEndDate) < now) return 0;
  return product.discount;
};

// Middleware: ensure user is approved
const ensureApproved = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isValid) return null;
  return user;
};

// GET CART
exports.getCart = async (req, res) => {
  try {
    const user = await ensureApproved(req.userId);
    if (!user) return res.status(403).json({ message: "Compte non approuvé" });

    let cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    if (!cart) {
      return res.json({ items: [], total: 0 });
    }

    // Calculate prices with discounts
    const items = cart.items
      .filter((item) => item.productId) // filter out deleted products
      .map((item) => {
        const product = item.productId.toObject();
        const activeDiscount = getActiveDiscount(product);

        let unitPrice = product.price;
        if (user.discountPercentage > 0) {
          unitPrice = +(unitPrice * (1 - user.discountPercentage / 100)).toFixed(2);
        }
        if (activeDiscount > 0) {
          unitPrice = +(unitPrice * (1 - activeDiscount / 100)).toFixed(2);
        }

        return {
          _id: item._id,
          productId: product._id,
          title: product.title,
          imageUrl: product.imageUrl,
          pricePerKg: unitPrice,
          availableKg: product.quantity,
          kg: item.kg,
          subtotal: +(unitPrice * item.kg).toFixed(2),
        };
      });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ items, total: +total.toFixed(2) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const user = await ensureApproved(req.userId);
    if (!user) return res.status(403).json({ message: "Compte non approuvé" });

    const { productId, kg } = req.body;

    if (!productId || !kg || kg <= 0) {
      return res.status(400).json({ message: "Produit et quantité (kg) requis" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });

    if (kg > product.quantity) {
      return res.status(400).json({ message: `Stock insuffisant. Disponible : ${product.quantity} kg` });
    }

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingItem) {
      const newKg = existingItem.kg + kg;
      if (newKg > product.quantity) {
        return res.status(400).json({ message: `Stock insuffisant. Disponible : ${product.quantity} kg` });
      }
      existingItem.kg = newKg;
    } else {
      cart.items.push({ productId, kg });
    }

    await cart.save();
    res.json({ message: "Produit ajouté au panier", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CART ITEM (change kg)
exports.updateCartItem = async (req, res) => {
  try {
    const user = await ensureApproved(req.userId);
    if (!user) return res.status(403).json({ message: "Compte non approuvé" });

    const { kg } = req.body;
    const { itemId } = req.params;

    if (!kg || kg <= 0) {
      return res.status(400).json({ message: "Quantité invalide" });
    }

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ message: "Panier non trouvé" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Article non trouvé" });

    const product = await Product.findById(item.productId);
    if (product && kg > product.quantity) {
      return res.status(400).json({ message: `Stock insuffisant. Disponible : ${product.quantity} kg` });
    }

    item.kg = kg;
    await cart.save();

    res.json({ message: "Panier mis à jour", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REMOVE FROM CART
exports.removeFromCart = async (req, res) => {
  try {
    const user = await ensureApproved(req.userId);
    if (!user) return res.status(403).json({ message: "Compte non approuvé" });

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ message: "Panier non trouvé" });

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    res.json({ message: "Article supprimé", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CLEAR CART
exports.clearCart = async (req, res) => {
  try {
    const user = await ensureApproved(req.userId);
    if (!user) return res.status(403).json({ message: "Compte non approuvé" });

    await Cart.findOneAndUpdate({ userId: req.userId }, { items: [] });
    res.json({ message: "Panier vidé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
