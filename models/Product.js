const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    imageUrl: {
        type: String
    }

}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);