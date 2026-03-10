require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {

    const hashedPassword = await bcrypt.hash(process.env.PASSWORD, 10);

    const admin = new User({
        name: process.env.NAME,
        email: process.env.EMAIL,
        password: hashedPassword,
        role: process.env.ROLE,
        isValid: true
    });

    await admin.save();

    console.log("Admin created");
    process.exit();
}

createAdmin();