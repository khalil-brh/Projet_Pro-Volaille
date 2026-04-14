const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true
    },

    imageUrl: {
        type: String
    },

    topSeller: {
        type: Boolean,
        default: false
    },

    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    discountStartDate: {
        type: Date,
        default: null
    },

    discountEndDate: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
