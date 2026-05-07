const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity:  { type: Number, required: true, min: 1, default: 1 },
    total:     { type: Number, required: true, min: 0 },
    status:    {
        type:    String,
        default: 'pending',
        enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    },
}, {
    timestamps: true,
});

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 }); // most recent first

module.exports = mongoose.model('Order', orderSchema);
