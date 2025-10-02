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

const failedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cod", "card", "upi", "wallet","razorpay"], required: true },
  couponId: {
    type:String,
    default: null
  },
  couponDiscount:{
    type:Number,
    default:null

  },
  address: 
    addressSchema
  ,
   offerDiscount:{
    type:Number,
    default:0
  },
  reason: { type: String, default: "Unknown" },
  
  products:[ cartItemSchema ],
  isActive:{
    type:Boolean,
    default:true
  }
}, { timestamps: true });

const Faileds = mongoose.model("Failed", failedSchema, );
module.exports = Faileds;
