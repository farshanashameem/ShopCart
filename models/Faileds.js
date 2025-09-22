const mongoose = require("mongoose");

const failedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cod", "card", "upi", "wallet","razorpay"], required: true },
  reason: { type: String, default: "Unknown" },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      variantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
      quantity: { type: Number, min: 1 },
      
    }
  ]
}, { timestamps: true });

const Faileds = mongoose.model("Faileds", failedSchema, );
module.exports = Faileds;
