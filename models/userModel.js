const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  locality: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  alternateNumber: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['home', 'office'],
    required: true
  }
});

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
  },
  addedAt: {
     type: Date,
      default: Date.now 
    }

}, { _id: false });



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    default: null // required only for manual signup
  },
  googleId: {
    type: String,
    default: null // filled only for Google login
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  wallet: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    default: "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png"
  },
  wishlist:[cartItemSchema],
  cart:[cartItemSchema],
  address:[addressSchema]
});

module.exports = mongoose.model("User", userSchema);
