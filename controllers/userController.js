const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");
const socket = require("../socket");
const { sendVerificationEmail } = require("../utils/sendEmail");


// Upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, originalname, mimetype) => {
    const isPdf = mimetype === "application/pdf";
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "pro-volaille/users",
                resource_type: isPdf ? "raw" : "image",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ filename: originalname, url: result.secure_url });
            }
        );
        stream.end(fileBuffer);
    });
};


// CREATE USER
exports.createUser = async (req, res) => {
    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Veuillez fournir au moins un document (PDF ou image)" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const uploads = req.files.map(file =>
            uploadToCloudinary(file.buffer, file.originalname, file.mimetype)
        );
        const files = await Promise.all(uploads);

        const user = new User({
            companyName: req.body.companyName,
            name: req.body.name,
            number: req.body.number,
            email: req.body.email,
            password: hashedPassword,
            files
        });

        await user.save();

        // Create and emit real-time notification for admin
        const notification = await Notification.create({
            type: "new_user",
            message: `Nouvelle inscription : ${user.name} (${user.companyName})`,
            userId: user._id,
        });

        const io = socket.getIO();
        io.emit("new_notification", notification);

        // Send verification email
        sendVerificationEmail(user.email, user.name).catch(() => {});

        res.status(201).json(user);

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


// GET ALL USERS (ADMIN)
exports.getUsers = async (req, res) => {
    try {

        const users = await User.find();

        res.json(users);

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// UPDATE USER (ADMIN)
exports.updateUser = async (req, res) => {
    try {

        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(user);

    } catch (error) {
        res.status(500).json(error.message);
    }
};


// DELETE USER (ADMIN)
exports.deleteUser = async (req, res) => {
    try {

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: "User deleted" });

    } catch (error) {
        res.status(500).json(error.message);
    }
};
