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


// GET PRODUCTS (PUBLIC)
exports.getProducts = async (req, res) => {

    try {

        const products = await Product.find();

        res.json(products);

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
