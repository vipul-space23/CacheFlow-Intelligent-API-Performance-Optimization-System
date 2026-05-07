const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:   { type: String, required: true, trim: true },
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    role:   { type: String, default: 'customer', enum: ['admin', 'customer', 'seller'] },
    orders: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
}, {
    timestamps: true,
});

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
