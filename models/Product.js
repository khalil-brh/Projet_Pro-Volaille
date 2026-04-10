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

    price: {
        type: Number,
        required: true
    },

    imageUrl: {
        type: String
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