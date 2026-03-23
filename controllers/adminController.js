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
            .populate("discounts.productId", "title price")
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

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isValid: true },
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


// UPDATE USER DISCOUNTS (per-product)
exports.updateUserDiscounts = async (req, res) => {
    try {
        const { discounts } = req.body;

        if (!Array.isArray(discounts)) {
            return res.status(400).json({ message: "discounts array is required" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { discounts },
            { new: true, runValidators: true }
        ).populate("discounts.productId", "title");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Notify user
        const notification = await Notification.create({
            type: "profile_updated",
            message: "Vos remises personnalisées ont été mises à jour par un administrateur.",
            userId: user._id,
        });

        const io = socket.getIO();
        io.emit(`notification_${user._id}`, notification);

        res.json({ message: "Discounts updated", user });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// UPDATE USER (admin edits any field)
exports.adminUpdateUser = async (req, res) => {
    try {
        const allowedFields = ["name", "email", "number", "address", "companyName", "companyId", "cin"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "Aucun champ à mettre à jour" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Build a readable list of changed fields
        const fieldLabels = {
            name: "Nom",
            email: "Email",
            number: "Téléphone",
            address: "Adresse",
            companyName: "Nom de l'entreprise",
            companyId: "Identifiant entreprise",
            cin: "CIN",
        };
        const changedFields = Object.keys(updates).map(f => fieldLabels[f] || f).join(", ");

        // Send notification to the user
        const notification = await Notification.create({
            type: "profile_updated",
            message: `Votre profil a été mis à jour par un administrateur. Champs modifiés : ${changedFields}.`,
            userId: user._id,
        });

        const io = socket.getIO();
        io.emit(`notification_${user._id}`, notification);

        res.json({ message: "Utilisateur mis à jour", user });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const messages = {
                email: "Cet email est déjà utilisé",
                number: "Ce numéro de téléphone est déjà utilisé",
            };
            return res.status(400).json({ message: messages[field] || "Cette valeur existe déjà" });
        }
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