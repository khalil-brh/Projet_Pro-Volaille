const User = require("../models/User");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");


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

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        let files = [];
        if (req.files && req.files.length > 0) {
            const uploads = req.files.map(file =>
                uploadToCloudinary(file.buffer, file.originalname, file.mimetype)
            );
            files = await Promise.all(uploads);
        }

        const user = new User({
            companyName: req.body.companyName,
            name: req.body.name,
            number: req.body.number,
            email: req.body.email,
            password: hashedPassword,
            files
        });

        await user.save();

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
