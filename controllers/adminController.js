const User = require("../models/User");
const Commercial = require("../models/Commercial");
const ProductCategory = require("../models/ProductCategory");
const Notification = require("../models/Notification");
const socket = require("../socket");
const { sendApprovalEmail } = require("../utils/sendEmail");

const normalizeCategoryValue = (value) => String(value || "").trim();

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
            .populate("assignedCommercial", "name number")
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
        res.status(500).json({ message: error.message });
    }
};

// GET COMMERCIALS
exports.getCommercials = async (req, res) => {
    try {
        const commercials = await Commercial.find()
            .sort({ createdAt: -1 })
            .select("name number createdAt");

        res.json({ commercials });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE COMMERCIAL
exports.createCommercial = async (req, res) => {
    try {
        const { name, number } = req.body;

        if (!name || !number) {
            return res.status(400).json({ message: "Nom et numero de telephone requis" });
        }

        const commercial = await Commercial.create({
            name,
            number,
        });

        res.status(201).json({ message: "Commercial cree", commercial });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const messages = {
                number: "Ce numero de telephone est deja utilise",
            };
            return res.status(400).json({ message: messages[field] || "Cette valeur existe deja" });
        }

        res.status(500).json({ message: error.message });
    }
};

// GET PRODUCT CATEGORIES
exports.getProductCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.find()
            .sort({ name: 1 });

        res.json({ categories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE PRODUCT CATEGORY
exports.createProductCategory = async (req, res) => {
    try {
        const name = normalizeCategoryValue(req.body.name);

        if (!name) {
            return res.status(400).json({ message: "Nom de categorie requis" });
        }

        const existingCategory = await ProductCategory.findOne({
            name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
        });

        if (existingCategory) {
            return res.status(400).json({ message: "Cette categorie existe deja" });
        }

        const category = await ProductCategory.create({
            name,
            subCategories: []
        });

        res.status(201).json({ message: "Categorie creee", category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE PRODUCT SUBCATEGORY
exports.createProductSubCategory = async (req, res) => {
    try {
        const name = normalizeCategoryValue(req.body.name);

        if (!name) {
            return res.status(400).json({ message: "Nom de sous-categorie requis" });
        }

        const category = await ProductCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Categorie non trouvee" });
        }

        const alreadyExists = category.subCategories.some(
            (subCategory) => subCategory.toLowerCase() === name.toLowerCase()
        );

        if (alreadyExists) {
            return res.status(400).json({ message: "Cette sous-categorie existe deja dans cette categorie" });
        }

        category.subCategories.push(name);
        category.subCategories.sort((a, b) => a.localeCompare(b, "fr"));
        await category.save();

        res.status(201).json({ message: "Sous-categorie creee", category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE COMMERCIAL
exports.updateCommercial = async (req, res) => {
    try {
        const allowedFields = ["name", "number"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "Aucun champ a mettre a jour" });
        }

        if (updates.name !== undefined && !String(updates.name).trim()) {
            return res.status(400).json({ message: "Nom requis" });
        }

        if (updates.number !== undefined && !String(updates.number).trim()) {
            return res.status(400).json({ message: "Numero de telephone requis" });
        }

        const commercial = await Commercial.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!commercial) {
            return res.status(404).json({ message: "Commercial non trouve" });
        }

        res.json({ message: "Commercial mis a jour", commercial });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const messages = {
                number: "Ce numero de telephone est deja utilise",
            };
            return res.status(400).json({ message: messages[field] || "Cette valeur existe deja" });
        }

        res.status(500).json({ message: error.message });
    }
};

// DELETE COMMERCIAL
exports.deleteCommercial = async (req, res) => {
    try {
        const commercial = await Commercial.findByIdAndDelete(req.params.id);

        if (!commercial) {
            return res.status(404).json({ message: "Commercial non trouve" });
        }

        await User.updateMany(
            { assignedCommercial: commercial._id },
            { $set: { assignedCommercial: null } }
        );

        res.json({ message: "Commercial supprime" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// APPROVE USER
exports.approveUser = async (req, res) => {
    try {
        const { commercialId } = req.body;

        let assignedCommercial = null;
        if (commercialId) {
            assignedCommercial = await Commercial.findById(commercialId);

            if (!assignedCommercial) {
                return res.status(400).json({ message: "Commercial invalide" });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isValid: true,
                assignedCommercial: assignedCommercial?._id || null,
            },
            { new: true }
        ).populate("assignedCommercial", "name number");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const commercialText = assignedCommercial
            ? ` Votre commercial assigne est ${assignedCommercial.name}.`
            : "";

        const notification = await Notification.create({
            type: "user_approved",
            message: `Votre compte a ete approuve ! Vous pouvez maintenant voir les prix.${commercialText}`,
            userId: user._id,
        });

        const io = socket.getIO();
        io.emit(`notification_${user._id}`, notification);

        sendApprovalEmail(user.email, user.name).catch(() => {});

        res.json({
            message: "User approved",
            user,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// REJECT USER
exports.rejectUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isValid: false, assignedCommercial: null },
            { new: true }
        );

        res.json({
            message: "User rejected",
            user,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET SINGLE USER
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("assignedCommercial", "name number");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        )
            .populate("discounts.productId", "title")
            .populate("assignedCommercial", "name number");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const notification = await Notification.create({
            type: "profile_updated",
            message: "Vos remises personnalisees ont ete mises a jour par un administrateur.",
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
        const allowedFields = ["name", "email", "number", "address", "companyName", "companyId", "cin", "assignedCommercial"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.assignedCommercial === "") {
            updates.assignedCommercial = null;
        }

        if (updates.assignedCommercial) {
            const commercial = await Commercial.findById(updates.assignedCommercial);

            if (!commercial) {
                return res.status(400).json({ message: "Commercial invalide" });
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "Aucun champ a mettre a jour" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate("assignedCommercial", "name number");

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouve" });
        }

        const fieldLabels = {
            name: "Nom",
            email: "Email",
            number: "Telephone",
            address: "Adresse",
            companyName: "Nom de l'entreprise",
            companyId: "Identifiant entreprise",
            cin: "CIN",
            assignedCommercial: "Commercial assigne",
        };
        const changedFields = Object.keys(updates).map((f) => fieldLabels[f] || f).join(", ");

        const notification = await Notification.create({
            type: "profile_updated",
            message: `Votre profil a ete mis a jour par un administrateur. Champs modifies : ${changedFields}.`,
            userId: user._id,
        });

        const io = socket.getIO();
        io.emit(`notification_${user._id}`, notification);

        res.json({ message: "Utilisateur mis a jour", user });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const messages = {
                email: "Cet email est deja utilise",
                number: "Ce numero de telephone est deja utilise",
            };
            return res.status(400).json({ message: messages[field] || "Cette valeur existe deja" });
        }
        res.status(500).json({ message: error.message });
    }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);

        res.json({
            message: "User deleted",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
