const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const adminAuth = require("../middleware/adminAuth");

router.post("/admin/login", async (req, res) => {

    const { email, password } = req.body;

    const admin = await User.findOne({ email });

    if (!admin || admin.role !== "admin") {
        return res.status(401).json({ message: "Not admin" });
    }

    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
        {
            id: admin._id,
            role: admin.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        message: "Admin logged in",
        token
    });

});

const {
    getAllUsers,
    getUser,
    approveUser,
    rejectUser,
    deleteUser
} = require("../controllers/adminController");


// GET USERS
router.get("/admin/users", adminAuth, getAllUsers);

// GET SINGLE USER
router.get("/admin/users/:id", adminAuth, getUser);

// APPROVE USER
router.put("/admin/users/:id/approve", adminAuth,approveUser);

// REJECT USER
router.put("/admin/users/:id/reject", adminAuth,rejectUser);

// DELETE USER
router.delete("/admin/users/:id", adminAuth,deleteUser);

module.exports = router;