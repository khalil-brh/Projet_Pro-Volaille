const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
        return res.status(401).json({ message: "Not admin" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        message: "Admin logged in",
        token
    });

};


exports.userLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, isValid: user.isValid },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                companyName: user.companyName,
                role: user.role,
                isValid: user.isValid,
            }
        });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};
