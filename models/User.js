const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    accountType: {
        type: String,
        enum: ["company", "individual"],
        default: "individual"
    },
    companyName: String,
    companyId: String,
    cin: String,
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

    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    files: [
        {
            filename: String,
            url: String
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);