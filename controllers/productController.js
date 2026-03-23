const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");


// Upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "pro-volaille/products" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};


// CREATE PRODUCT (ADMIN)
exports.createProduct = async (req, res) => {

    try {

        const { title, description, quantity, price } = req.body;
        let imageUrl = null;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const product = new Product({ title, description, quantity, price, imageUrl });

        await product.save();

        res.status(201).json(product);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// Helper: check if a product has an active general discount
const getActiveDiscount = (product) => {
    if (!product.discount || product.discount <= 0) return 0;
    const now = new Date();
    if (product.discountStartDate && new Date(product.discountStartDate) > now) return 0;
    if (product.discountEndDate && new Date(product.discountEndDate) < now) return 0;
    return product.discount;
};


// GET PRODUCTS (PUBLIC)
exports.getProducts = async (req, res) => {

    try {

        const products = await Product.find();

        const result = products.map(product => {
            const p = product.toObject();
            const activeDiscount = getActiveDiscount(p);
            if (activeDiscount > 0) {
                p.originalPrice = p.price;
                p.price = +(p.price * (1 - activeDiscount / 100)).toFixed(2);
                p.activeDiscount = activeDiscount;
            }
            return p;
        });

        res.json(result);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// GET PRODUCTS WITH USER DISCOUNT (AUTHENTICATED)
exports.getMyProducts = async (req, res) => {

    try {

        const User = require("../models/User");
        const user = await User.findById(req.userId);

        if (!user || !user.isValid) {
            return res.status(403).json({ message: "Compte non approuvé" });
        }

        const products = await Product.find();

        const result = products.map(product => {
            const p = product.toObject();
            const activeDiscount = getActiveDiscount(p);

            // Apply user-specific per-product discount silently to base price
            let basePrice = p.price;
            const userDiscount = (user.discounts || []).find(
                (d) => d.productId.toString() === p._id.toString()
            );
            if (userDiscount && userDiscount.percentage > 0) {
                basePrice = +(basePrice * (1 - userDiscount.percentage / 100)).toFixed(2);
            }

            if (activeDiscount > 0) {
                p.originalPrice = basePrice;
                p.price = +(basePrice * (1 - activeDiscount / 100)).toFixed(2);
                p.activeDiscount = activeDiscount;
            } else {
                p.price = basePrice;
            }

            return p;
        });

        res.json(result);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// GET PRODUCTS PAGINATED (ADMIN)
exports.getProductsPaginated = async (req, res) => {

    try {

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const search = req.query.search || "";

        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const result = products.map(product => {
            const p = product.toObject();
            const activeDiscount = getActiveDiscount(p);
            if (activeDiscount > 0) {
                p.originalPrice = p.price;
                p.activeDiscount = activeDiscount;
            }
            return p;
        });

        res.json({
            products: result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// UPDATE PRODUCT (ADMIN)
exports.updateProduct = async (req, res) => {

    try {

        const updateData = { ...req.body };

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            updateData.imageUrl = result.secure_url;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(product);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};


// DELETE PRODUCT (ADMIN)
exports.deleteProduct = async (req, res) => {

    try {

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: "Product deleted" });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};
