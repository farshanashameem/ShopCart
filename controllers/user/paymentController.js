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

exports.makePayment = async (req, res) => {
  try {
    const { 
      payment, 
      appliedCoupon, 
      couponDiscount, 
      total, 
      addressId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature 
    } = req.body;
    
    console.log('Payment request received:', { 
      payment, 
      appliedCoupon, 
      couponDiscount, 
      total, 
      addressId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    });

    const user = await User.findById(req.session.user._id);

    if (!user.cart || user.cart.length === 0) {
      return res.redirect("/orders");
    }
    
    // If Razorpay payment, verify the payment first
    if (payment === "razorpay") {
      // Verify payment signature
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        console.error('Missing Razorpay payment data');
        return res.redirect('/failed');
      }
      
      // Fix: Use the correct format for signature verification
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      
      console.log('Signature verification:', {
        received: razorpaySignature,
        expected: expectedSignature,
        matches: expectedSignature === razorpaySignature,
        body: body
      });
      
      if (expectedSignature !== razorpaySignature) {
        console.error('Payment signature verification failed');
        return res.redirect('/failed');
      }
    }
    else if(payment==="wallet"){
        const walletBalance=user.wallet;
        if(walletBalance<total){
            req.flash("error", "Wallet balance is insufficient.");
            return res.redirect('/payment?addressId='+addressId);
        }
        else{
          user.wallet-=total;
          await user.save();
          const transaction=new WalletTransactions({
            userId:user._id,
            type:"debit",
            amount:total,
            reason:"order Payment"

          });
          await transaction.save();
        }
            
      
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

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderId = `ORD-${timestamp}-${random}`;

    const walletAmountUsed = 0;
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

        // Apply discount only if eligible
        const itemTotal = variant.discountPrice * item.quantity;
        const finalTotal = isEligible ? itemTotal - perItemDiscount : itemTotal;

        return {
          name: product.name,
          orderId,
          userId,
          addressId,
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
          razorpayPaymentId: payment === "razorpay" ? razorpayPaymentId : null,
          razorpayOrderId: payment === "razorpay" ? razorpayOrderId : null
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

    user.cart = [];
    await user.save();
    req.session.orderPlaced = true;

    // Redirect based on payment method
   
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
    res.status(500).json({ error: 'Failed to create order' });
  }
};