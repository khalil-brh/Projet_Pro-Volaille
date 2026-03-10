const User = require("../models/User");


// GET ALL USERS
exports.getAllUsers = async (req, res) => {
    try {

        const users = await User.find({ role: "user" });

        res.json(users);

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// APPROVE USER
exports.approveUser = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isValid: true },
            { new: true }
        );

        res.json({
            message: "User approved",
            user
        });

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// REJECT USER
exports.rejectUser = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isValid: false },
            { new: true }
        );

        res.json({
            message: "User rejected",
            user
        });

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// GET SINGLE USER
exports.getUser = async (req, res) => {
    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// DELETE USER
exports.deleteUser = async (req, res) => {
    try {

        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: "User deleted"
        });

    } catch (error) {
        res.status(500).json(error.message);
    }
};