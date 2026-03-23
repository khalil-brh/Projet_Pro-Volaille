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
    address: {
        type: String,
        required: true
    },
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

    discounts: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            percentage: {
                type: Number,
                min: 0,
                max: 100,
                default: 0
            }
        }
    ],

    files: [
        {
            filename: String,
            url: String
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);