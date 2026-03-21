const User = require("../models/User");
const Notification = require("../models/Notification");
const socket = require("../socket");
const { sendApprovalEmail } = require("../utils/sendEmail");


// GET ALL USERS (paginated + search)
exports.getAllUsers = async (req, res) => {
    try {

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const search = req.query.search || "";

        const filter = { role: "user" };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
                { companyId: { $regex: search, $options: "i" } },
                { cin: { $regex: search, $options: "i" } },
                { number: { $regex: search, $options: "i" } },
            ];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// APPROVE USER
exports.approveUser = async (req, res) => {
    try {

        const { discountPercentage } = req.body || {};

        const updateData = { isValid: true };
        if (discountPercentage !== undefined) {
            updateData.discountPercentage = discountPercentage;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        // Create and emit notification for the user
        const notification = await Notification.create({
            type: "user_approved",
            message: "Votre compte a été approuvé ! Vous pouvez maintenant voir les prix.",
            userId: user._id,
        });

        const io = socket.getIO();
        io.emit(`notification_${user._id}`, notification);

        // Send approval email
        sendApprovalEmail(user.email, user.name).catch(() => {});

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


// UPDATE USER DISCOUNT
exports.updateUserDiscount = async (req, res) => {
    try {

        const { discountPercentage } = req.body;

        if (discountPercentage === undefined) {
            return res.status(400).json({ message: "discountPercentage is required" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { discountPercentage },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Discount updated", user });

    } catch (error) {
        res.status(500).json({ message: error.message });
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