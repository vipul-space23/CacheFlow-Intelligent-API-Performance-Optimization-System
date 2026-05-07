const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, required: true, enum: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'] },
    brand:       { type: String, default: 'Generic' },
    stock:       { type: Number, default: 0, min: 0 },
    rating:      { type: Number, default: 3.5, min: 0, max: 5 },
    reviews:     { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
}, {
    timestamps: true, // adds createdAt, updatedAt
});

// Index for fast category-based queries
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
