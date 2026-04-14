const mongoose = require("mongoose");

const ProductCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subCategories: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model("ProductCategory", ProductCategorySchema);
