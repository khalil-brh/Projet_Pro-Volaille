const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../utils/sendEmail");

function createEmailVerificationLink(user) {
    const verificationToken = jwt.sign(
        { id: user._id, email: user.email, type: "email_verification" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
}

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


exports.getMe = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Non autorisé" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json({
            id: user._id,
            accountType: user.accountType,
            name: user.name,
            email: user.email,
            address: user.address,
            number: user.number,
            companyName: user.companyName,
            companyId: user.companyId,
            cin: user.cin,
            role: user.role,
            isValid: user.isValid,
            isEmailVerified: user.isEmailVerified,
        });
    } catch (error) {
        res.status(401).json({ message: "Token invalide" });
    }
};

exports.userLogin = async (req, res) => {

    try {

        const { identifier, password } = req.body;

        // Search by companyId or cin
        const user = await User.findOne({
            $or: [
                { companyId: identifier },
                { cin: identifier }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: "Identifiant ou mot de passe incorrect" });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Identifiant ou mot de passe incorrect" });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Veuillez verifier votre email avant de vous connecter" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, isValid: user.isValid, isEmailVerified: user.isEmailVerified },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user._id,
                accountType: user.accountType,
                name: user.name,
                email: user.email,
                address: user.address,
                number: user.number,
                companyName: user.companyName,
                companyId: user.companyId,
                cin: user.cin,
                role: user.role,
                isValid: user.isValid,
                isEmailVerified: user.isEmailVerified,
            }
        });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token de verification requis" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "email_verification") {
            return res.status(400).json({ message: "Token de verification invalide" });
        }

        const user = await User.findById(decoded.id);

        if (!user || user.email !== decoded.email) {
            return res.status(404).json({ message: "Utilisateur non trouve" });
        }

        if (user.isEmailVerified) {
            return res.json({ message: "Email deja verifie" });
        }

        user.isEmailVerified = true;
        await user.save();

        res.json({ message: "Email verifie avec succes" });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(400).json({ message: "Le lien de verification a expire" });
        }

        res.status(400).json({ message: "Lien de verification invalide" });
    }
};

exports.resendVerificationEmail = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ message: "Identifiant requis" });
        }

        const user = await User.findOne({
            $or: [
                { companyId: identifier },
                { cin: identifier }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouve" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email deja verifie" });
        }

        const verificationLink = createEmailVerificationLink(user);

        await sendVerificationEmail(user.email, user.name, verificationLink);

        res.json({ message: "Email de verification renvoye avec succes" });
    } catch (error) {
        res.status(500).json({ message: error.message || "Erreur lors du renvoi de l'email de verification" });
    }
};
