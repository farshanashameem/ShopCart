const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products',
    required: true
  },
  colorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colour',
    required: true
  },
  fitId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fit',
    required: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  images: [
    {
      type: String
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);
