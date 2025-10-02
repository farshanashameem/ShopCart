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

const orderSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  orderId: {
    type: String, 
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true    
  },
  address: 
    addressSchema
  ,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1 
  },
  price: {
    type: Number, 
    required: true,
    min: 0
  },
  total: {
    type: Number, 
    required: true,
    min: 0
  },

 couponId: {
    type:String,
    default: null
  },
  couponDiscount:{
    type:Number,
    default:null

  },
  walletAmountUsed: {
    type: Number,
    default: 0,
    min: 0
  },

  status: {
    type: String,
    enum: ["pending", "placed", "shipped" , "out-for-delivery", "delivered", "cancelled", "returned","failed"],
    default: "pending"
  },

  statusHistory: [
    {
      status: {
        type: String,
        enum: ["pending", "placed", "shipped", "out-for-delivery",  "delivered", "cancelled", "returned"],
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],

  cancelReason: {
  type: String,
  default: null
},

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "card", "upi", "wallet","razorpay"],
    required: true
  },
  offerDiscount:{
    type:Number,
    default:0
  }
}, {
  timestamps: true 
});



const Orders = mongoose.model("Orders", orderSchema);

module.exports = Orders;
