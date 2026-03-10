const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


// PUBLIC ROUTE
router.get("/products", getProducts);


// ADMIN ROUTES
router.post("/admin/products", adminAuth, createProduct);

router.put("/admin/products/:id", adminAuth, updateProduct);

router.delete("/admin/products/:id", adminAuth, deleteProduct);


module.exports = router;