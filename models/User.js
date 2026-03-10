const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    companyName: String,
    name: String,
    number: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    isValid: {
        type: Boolean,
        default: false
    },

    files: [
        {
            filename: String,
            url: String
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);