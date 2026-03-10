const User = require("../models/User");
const bcrypt = require("bcrypt");


// CREATE USER
exports.createUser = async (req, res) => {
    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            companyName: req.body.companyName,
            name: req.body.name,
            number: req.body.number,
            email: req.body.email,
            password: hashedPassword,
            files: req.body.files
        });

        await user.save();

        res.status(201).json(user);

    } catch (error) {
        res.status(500).json(error.message);
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