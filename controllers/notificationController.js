const Notification = require("../models/Notification");

// GET ADMIN NOTIFICATIONS (exclude user-facing notifications)
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ type: { $in: ["new_user", "new_contact", "new_order"] } })
            .sort({ createdAt: -1 })
            .populate("userId", "name email companyName");
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MARK NOTIFICATION AS READ
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification non trouvée" });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ read: false }, { read: true });
        res.json({ message: "Toutes les notifications ont été lues" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET USER NOTIFICATIONS (for logged-in user)
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.userId,
            type: { $in: ["user_approved", "order_update"] },
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MARK USER NOTIFICATION AS READ
exports.markUserNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification non trouvée" });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
