const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

const userAuth = require("../middleware/userAuth");

const {
    createProduct,
    getProducts,
    getPublicProductCategories,
    getProductsPaginated,
    getMyProducts,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


// PUBLIC ROUTE
router.get("/products", getProducts);
router.get("/product-categories", getPublicProductCategories);

// AUTHENTICATED USER ROUTE (with discount applied)
router.get("/products/me", userAuth, getMyProducts);


// ADMIN ROUTES
router.get("/admin/products", adminAuth, getProductsPaginated);

router.post("/admin/products", adminAuth, upload.single("image"), createProduct);

router.put("/admin/products/:id", adminAuth, upload.single("image"), updateProduct);

router.delete("/admin/products/:id", adminAuth, deleteProduct);


module.exports = router;
