const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


// PUBLIC ROUTE
router.get("/products", getProducts);


// ADMIN ROUTES
router.post("/admin/products", adminAuth, upload.single("image"), createProduct);

router.put("/admin/products/:id", adminAuth, upload.single("image"), updateProduct);

router.delete("/admin/products/:id", adminAuth, deleteProduct);


module.exports = router;
