// controllers/paymentController.js

const User = require("../../models/userModel");
const mongoose = require("mongoose");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Fit = require("../../models/Fit");
const Orders = require("../../models/Orders");
const Returns = require("../../models/Returns");
const Review = require("../../models/Review");
const Coupons = require("../../models/Coupens");
const razorpay = require("../../utils/razorpay");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const { getCountryCodeFromIP } = require("../../utils/ipapi");
const { count } = require("console");
const WalletTransactions = require("../../models/WalletTransactions");
const Offers=require('../../models/Offers');



  
exports.makePayment = async (req, res) => {
  try {
    const { 
      payment, 
      appliedCoupon, 
      couponDiscount, 
      total, 
      addressId,
      offer,categoryy,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      walletAmount //  to track wallet amount used
    } = req.body;
      
   
    //Creating order Id
     const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderId = `ORD-${timestamp}-${random}`;

     req.session.orderId=orderId;
     req.session.amount=total;
     req.session.payment=payment;

    const user = await User.findById(req.session.user._id);

    if (!user.cart || user.cart.length === 0) {
      return res.redirect("/orders");  
    }

    // Track wallet amount used
    let walletAmountUsed = 0;
    let remainingAmount = parseFloat(total);
    
    // If wallet payment is involved
    if (payment === "wallet" || walletAmount) {
        const walletBalance = user.wallet;
        walletAmountUsed = Math.min(walletBalance, remainingAmount);
        remainingAmount -= walletAmountUsed;
        
        // If wallet covers the entire amount
        if (remainingAmount <= 0) {
            user.wallet -= walletAmountUsed;
            await user.save();
            
            const transaction = new WalletTransactions({
                userId: user._id,
                type: "debit",
                amount: walletAmountUsed,
                reason: "Order Payment"
            });
            await transaction.save();
        } 
        // If wallet is insufficient and Razorpay is needed
        else if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
            // Verify Razorpay payment for the remaining amount
            const body = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');
            
           
            
            if (expectedSignature !== razorpaySignature) {
                             
                return res.redirect('/failed');
            }
            
            // Deduct wallet amount and record transaction
            user.wallet -= walletAmountUsed;
            await user.save();
            
            const transaction = new WalletTransactions({
                userId: user._id,
                type: "debit",
                amount: walletAmountUsed,
                reason: "Partial Order Payment"
            });
            await transaction.save();
        }
        // If wallet is insufficient but no Razorpay payment data
        else if (remainingAmount > 0) {
            // This case should be handled by redirecting to Razorpay
            // We'll handle this in the frontend
            console.log('Insufficient wallet balance, redirecting to Razorpay');
            return res.status(400).json({ 
                error: "Insufficient wallet balance", 
                remainingAmount: remainingAmount 
            });
        }
    }
    // If only Razorpay payment
    else if (payment === "razorpay") {
        // Verify payment signature
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
          
            return res.redirect('/failed');
        }
        
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');
        
       
        
        if (expectedSignature !== razorpaySignature) {
                    
            return res.redirect('/failed');
        }
    }
   else if (payment === "cod" && total > 1000) {
  
    req.flash("error", "Cash on delivery is not available for orders greater than 1000");
     return res.redirect('/payment?addressId='+addressId);
   }

   
      const coupon = appliedCoupon ? await Coupons.findOne(
      { code: appliedCoupon },
      { category: 1, usageCount: 1, usedBy: 1 }
    ) : null;

    const category = coupon?.category || "all";

    let eligibleItems = [];
    if (category.toLowerCase() === "all") {
      eligibleItems = user.cart; // all items eligible
    } else {
      for (let item of user.cart) {
        const product = await Products.findById(item.productId).populate(
          "productTypeId",
          "name"
        );
        if (
          product.productTypeId.name.toLowerCase() === category.toLowerCase()
        ) {
          eligibleItems.push(item);
        }
      }
    }

    // Calculate per-item discount
    let perItemDiscount = 0;
    const discountValue = parseFloat(couponDiscount) || 0;
    if (eligibleItems.length > 0 && discountValue > 0) {
      perItemDiscount = discountValue / eligibleItems.length;
    }

   // Calculate the Offer applied things
    const offers = offer ? await Offers.findOne(
      { category: categoryy }
    ) : null;

   let eligibleOfferItems = [];

for (let item of user.cart) {
    const product = await Products.findById(item.productId).populate(
        "productTypeId",
        "name"
    );
    if (product.productTypeId.name.toLowerCase() === categoryy.toLowerCase()) {
        eligibleOfferItems.push(item);
    }
}

let perItemOfferDiscount = 0;
if (eligibleOfferItems.length > 0) {
    // divide by items count
    perItemOfferDiscount = parseFloat(offer) / eligibleOfferItems.length;

}


    const userId = user._id;

    const details = await Promise.all(
      user.cart.map(async (item) => {
        const variant = await productVariant.findById(item.variantId, {
          discountPrice: 1,
        });
        const product = await Products.findById(item.productId).select("name");

        // Check if this item is eligible for discount
        const isEligible =
          category.toLowerCase() === "all" ||
          eligibleItems.some(
            (eligible) =>
              eligible.productId.toString() === item.productId.toString()
          );

          //check if the item is eligible for offer
          const isOfferEligible=eligibleOfferItems.some((eligible)=>eligible.productId.toString()===item.productId.toString());

        // Apply discount only if eligible
        const itemTotal = variant.discountPrice * item.quantity;
        let finalTotal = isEligible ? itemTotal - perItemDiscount : itemTotal;
        final=isOfferEligible?finalTotal-perItemOfferDiscount:finalTotal;
          
        // ✅ Grab full address snapshot
    const selectedAddress = user.address.id(addressId); 
    if (!selectedAddress) {
      throw new Error("Invalid address selected");
    }
        return {
          name: product.name,
          orderId,
          userId,
          address:selectedAddress.toObject(),
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: variant.discountPrice,
          total: finalTotal,
          couponId: isEligible ? appliedCoupon : null,
          couponDiscount: isEligible ? perItemDiscount : 0,
          walletAmountUsed: walletAmountUsed || 0,
          status: "pending",
          paymentStatus: payment === "cod" ? "pending" : "paid",
          paymentMethod: payment,
          offerDiscount:isOfferEligible?perItemOfferDiscount:0,
          razorpayPaymentId: (payment === "razorpay" || walletAmountUsed > 0) ? razorpayPaymentId : null,
          razorpayOrderId: (payment === "razorpay" || walletAmountUsed > 0) ? razorpayOrderId : null
        };
      })
    );


    await Orders.insertMany(details);

    // ✅ Update coupon usage (atomic way)
    if (coupon && appliedCoupon) {
      let updated = await Coupons.updateOne(
        { code: appliedCoupon, "usedBy.userId": userId },
        {
          $inc: { usageCount: 1, "usedBy.$.count": 1 },
        }
      );

      // If user not already in usedBy → push new entry
      if (updated.matchedCount === 0) {
        await Coupons.updateOne(
          { code: appliedCoupon },
          {
            $inc: { usageCount: 1 },
            $push: { usedBy: { userId, count: 1 } },
          }
        );
      }
    }

    const cartItems = user.cart;

for (const item of cartItems) {
  const { variantId, quantity } = item;

  // Make sure quantity is positive
  if (quantity > 0) {
    await productVariant.findByIdAndUpdate(
      variantId,
      { $inc: { stock: -quantity } },
      { new: true } // returns updated document if needed
    );
  }
}



    user.cart = [];
    await user.save();
    req.session.orderPlaced = true;

    return res.render("user/success", {orderId});
    
  } catch (err) {
    console.error('Payment processing error:', err);
    res.redirect('/failed');
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const options = {
      amount: amount, // amount in paise
      currency: currency || 'INR',
      receipt: 'order_' + Date.now()
    };
    
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' ,details: error.response ? error.response : error.message,});
  }
};