const User = require("../../models/userModel");
const mongoose = require("mongoose");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Fit = require('../../models/Fit');
const Colour = require('../../models/Colour');
const Orders = require("../../models/Orders");
const Returns = require("../../models/Returns");
const Review = require("../../models/Review");
const Coupons = require("../../models/Coupens");
const Offers = require("../../models/Offers");
const razorpay = require("../../utils/razorpay");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const { getCountryCodeFromIP } = require("../../utils/ipapi");
const { count } = require("console");
const WalletTransactions = require("../../models/WalletTransactions");
const Faileds=require('../../models/Faileds');

async function buildCheckoutData(userId, errors = {}, old = {}) {
  const user = await User.findById(userId)
    .populate({ path: "cart.variantId", select: "basePrice discountPrice" })
    .populate({ path: "cart.productId", select: "name" });

  if (!user) return null;

  const cartItems = user.cart.map((item) => ({
    name: item.productId.name,
    price: item.variantId.basePrice,
    discountPrice: item.variantId.discountPrice,
    quantity: item.quantity,
  }));

  const total = cartItems.reduce(
    (sum, item) => sum + item.discountPrice * item.quantity,
    0
  );

  return {
    addresses: user.address,
    user,
    errors,
    old,
    cart: { items: cartItems, total },
    charge:total>300?0:50
  };
}
  

exports.selectAddress = async (req, res) => {
  try {
    const data = await buildCheckoutData(req.session.user._id);
    data.showAddressBar = false;
    const user = await User.findById(req.session.user._id);
     const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    const results = await Promise.all(
      user.cart.map(async (item) => {
        const variant = await productVariant
          .findById(item.variantId)
          .populate("productId"); // ✅ to access product.isActive

        // ✅ Check inactive or out-of-stock
        if (
          !variant ||
          variant.stock < item.quantity ||
          variant.stock <= 0 ||
          (variant.productId && !variant.productId.isActive)
        ) {
          return item; // invalid
        }
        return null; // valid
      })
    );

    const itemsNotInCart = results.filter(Boolean);

    // ✅ Show error and redirect to cart if invalid
    if (itemsNotInCart.length > 0) {
      req.flash(
        "error",
        "Some products in your cart are inactive or out of stock. Please review your cart."
      );
      return res.redirect("/cart");
    }

    if (!user.cart || user.cart.length === 0) {
      return res.redirect("/orders");
    }
    if (!data) return res.redirect("/orders");
    res.render("user/checkout1", {...data,wishlistCount,cartCount});
  } catch (err) {
    console.error("Error in checkout:", err);
    res.status(500).send("Internal Server Error");
  }
};



exports.addAddress = async (req, res) => {
  try {
    const old = req.body;
    const errorsObj = {};
    const user = await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    if (!user.cart || user.cart.length === 0) {
      return res.redirect("/orders");
    }

    // ✅ Get validation errors
    const result = validationResult(req);
    if (!result.isEmpty()) {
      result.array().forEach((error) => {
        errorsObj[error.path] = error.msg;
      });

      const data = await buildCheckoutData(req.session.user._id);
      data.showAddressBar = true;
      data.errors = errorsObj;
      data.old = old;
      return res.render("user/checkout1",{...data,wishlistCount,cartCount});
    }
    // Get client IP
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    // Get country code
    const countryCode = await getCountryCodeFromIP(ip);

    const newAddress = {
      name: req.body.name,
      phoneNumber: countryCode + req.body.phone,
      pincode: req.body.pin,
      locality: req.body.locality,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      landmark: req.body.landmark,
      altnumber: req.body.altnumber,
      type: req.body.addressType,
    };

    user.address.push(newAddress);
    await user.save();
    const data = await buildCheckoutData(req.session.user._id);
    data.showAddressBar = false;
    return res.render("user/checkout1", {...data,wishlistCount,cartCount});
  } catch (err) {
    console.log(err);
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const errorsObj = {};

    const user = await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    if (!user.cart || user.cart.length === 0) {
      return res.redirect("/orders");
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const old = user.address.find((item) => item._id.toString() === addressId);
    console.log(old);
    old.phoneNumber = old.phoneNumber.slice(3);
    if (!old) return res.status(404).json({ message: "Address not found" });

    // ✅ Validation errors
    const result = validationResult(req);
    if (!result.isEmpty()) {
      result.array().forEach((error) => {
        errorsObj[error.path] = error.msg;
      });
      const data = await buildCheckoutData(req.session.user._id);
      data.showAddressBar = true;
      data.errors = errorsObj;
      data.old = old;
      return res.render("user/checkout1", {...data,wishlistCount,cartCount});
    }

    // Get client IP
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    // Get country code
    const countryCode = await getCountryCodeFromIP(ip);

    // Update the address
    const addressIndex = user.address.findIndex(
      (address) => address._id.toString() === addressId
    );
    user.address[addressIndex] = {
      ...user.address[addressIndex]._doc, // preserve _id
      name: req.body.name,
      phoneNumber: countryCode + req.body.phone,
      pincode: req.body.pin,
      locality: req.body.locality,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      landmark: req.body.landmark,
      altnumber: req.body.altnumber,
      type: req.body.addressType,
    };

    await user.save();

    const data = await buildCheckoutData(req.session.user._id);
    data.showAddressBar = false;
    return res.render("user/checkout1", {...data,wishlistCount,cartCount});
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.selectPayment = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.query.addressId;
    if (!addressId) return res.redirect("/orders");

    // Selecting cart items from the user cart for further going to payment
    const user = await User.findById(userId)
      .populate({ path: "cart.variantId", select: "discountPrice basePrice" })
      .populate({
        path: "cart.productId",
        select: "name productTypeId",
        populate: { path: "productTypeId", select: "name" },
      });

    if (!user) return res.redirect("/"); // or handle error
    if (!user.cart || user.cart.length === 0) {
      return res.redirect("/orders");
    }

    // Finding all cart items wit their name,base price,discount price,category and quantity
    const cartItems = user.cart.map((item) => ({
      name: item.productId.name,
      price: item.variantId.basePrice,
      discountPrice: item.variantId.discountPrice,
      category: item.productId.productTypeId.name,
      quantity: item.quantity,
    }));

    const categoriesInCart = [...new Set(cartItems.map((i) => i.category))];

    const today = new Date();

    // Selecting all active coupons from the data base
    const coupons = await Coupons.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today },
      $expr: { $lt: ["$usageCount", "$usageLimit"] },
      $or: [
        { "usedBy.userId": { $ne: userId } }, // user never used it
        { usedBy: { $elemMatch: { userId: userId, count: { $lt: 2 } } } }, // used less than 2 times
      ],
    });

    let availableCoupons = [];
    // If any coupon is present which applies for all product and customer ordering for more than the minimum value for applying the coupon it is selected.
    for (let coupon of coupons) {
      if (coupon.category && coupon.category.toLowerCase() === "all") {
        const total = cartItems.reduce(
          (sum, i) => sum + i.discountPrice * i.quantity,
          0
        );

        // if the type is percentage finding the value that should be deducted.
        let discount =
          coupon.discountType === "percentage"
            ? Math.floor((coupon.discountValue / 100) * total)
            : coupon.discountValue;


        if (total >= coupon.minValue) {
          availableCoupons.push({
            code: coupon.code,
            category: "All products",
            discount,
          });
        }
      } 
      //finding  categories of cart items and if a couponis present for that category it is selected as the same method of coupon for all.
      else if (categoriesInCart.includes(coupon.category)) {
        const categoryTotal = cartItems
          .filter((i) => i.category === coupon.category)
          .reduce((sum, i) => sum + i.discountPrice * i.quantity, 0);

        if (categoryTotal >= coupon.minValue) {
          let discount =
            coupon.discountType === "percentage"
              ? Math.floor((coupon.discountValue / 100) * categoryTotal)
              : coupon.discountValue;

          availableCoupons.push({
            code: coupon.code,
            category: coupon.category,
            discount,
          });
        }
      }
    }

    //Finding the Offers available
    let offer=0,categoryy;
    const offers=await Offers.find({isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }});
     //Checking any these category is present in the cart
     for (let offerr of offers){
      if(categoriesInCart.includes(offerr.category)){
        const categoryTotal = cartItems
          .filter((i) => i.category === offerr.category)
          .reduce((sum, i) => sum + i.discountPrice * i.quantity, 0);

        if (categoryTotal >= offerr.minValue) {
          let discount =
            offerr.discountType === "percentage"
              ? Math.floor((offerr.discountValue / 100) * categoryTotal)
              : offerr.discountValue;
          if(offer<discount){
            offer=discount;
            categoryy=offerr.category;
          }
         
      }
      

     }

    }
   
    const total = cartItems.reduce(
      (sum, item) => sum + item.discountPrice * item.quantity,
      0
    );
    //if total is less than 300 delivery charge of 300 is added
    const deliveryCharge= total<300?50:0;
   

    const cart = { items: cartItems, total };
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    // Render checkout page with user and cart
    res.render("user/checkout2", {
      user,
      cart,
      offer,categoryy,
      chosenAddressId: addressId,
      coupons: availableCoupons,
      deliveryCharge,cartCount,wishlistCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};


exports.getOrderPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;

    // pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    // get paginated orders
    const orders = await Orders.find({ userId: user._id })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    // total count for pagination
    const totalOrders = await Orders.countDocuments({ userId: user._id });
    const totalPages = Math.ceil(totalOrders / limit);
    // Transform each order into formatted object
    const list = await Promise.all(
      orders.map(async (item) => {
        const product = await Products.findById(item.productId).lean();
        const variant = await productVariant.findById(item.variantId).lean();
         const fit = await Fit.findById(variant.fitId);
        const color=await Colour.findById(variant.colorId);

        // check if return request exists for this order item
        const returnRequest = await Returns.findOne({
          orderId: item.orderId,
          orderedItem: item.productId,
          variantId: item.variantId,
          userId: user._id,
        }).lean();

        const statusDates = {};
        item.statusHistory.forEach((h) => {
          statusDates[h.status] = h.date;
        });
        
        return {
          id: item._id,
          address:item.address,
          name: product?.name,
          description: product?.description,
          color: color?.name,
          fit:fit?.name,
          image: variant?.images?.[0],
          quantity: item.quantity,
          size:variant?.size,
          price: item.price,
          total: item.total,
          status: item.status,
          method: item.paymentMethod,
          date: item.createdAt,
          statusDates,
          variantId: item.variantId,
          orderId: item.orderId,
          productId: item.productId,
          returnStatus: returnRequest ? returnRequest.status : null,
          expectedDate: new Date(
            item.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000
          ), // +10 days
        };
      })
    );
    list.forEach((o) => console.log(o.orderId, o.returnStatus));

    const successMessage = req.session.successMessage;
    delete req.session.successMessage;
    res.render("user/orders", {
      orders: list,
      currentPage: page,
      totalPages,
      successMessage,wishlistCount,cartCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId, variantId, productId ,reason} = req.body;
    const order = await Orders.findOne({ orderId, variantId, productId });
    const variant = await productVariant.findById(variantId);
    const user=await User.findById(req.session.user._id);
    if(order.paymentMethod==='razorpay' ||order.paymentMethod==='wallet'){
      user.wallet+=order.total;
      const transaction=new WalletTransactions({

      userId:user._id,
      type:"credit",
      amount:order.total,
      reason:"order cancellation"
    })
    await transaction.save();
    }
    variant.stock += order.quantity;
    await variant.save();
    
    await user.save();
    await Orders.findOneAndUpdate(
      { orderId, variantId, productId },
      {
        $set: { status: "cancelled" ,cancelReason:reason},
        $push: { statusHistory: { status: "cancelled", date: new Date() } },
      }
    );

    return res.json({ success: true, message: "Order cancelled." });
  } catch (err) {
    console.log(err);
  }
};

exports.OrderDetails = async (req, res) => {
  try {
    const id = req.params.Id;

    const order = await Orders.findById(id).lean();
    const product = await Products.findById(order.productId);
    const variant = await productVariant.findById(order.variantId);
    const fit = await Fit.findById(variant.fitId);
    const color=await Colour.findById(variant.colorId);
    const user = await User.findById(order.userId);
    const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
    

    // 🔹 Address handling
    let address = {};
    if (order.address) {
      //  (full address saved in order)
      address = order.address;
    } else if (order.addressId ) {
      // Old format (addressId -> find from user's addresses array)
      const foundAddress = user.address.find(addr => addr._id.toString() === order.addressId.toString());
     
      if (foundAddress) {
        address = foundAddress;
      }
    }
    const statusDates = {};
    if (!order) return res.status(404).send("Order not found");
    order.statusHistory.forEach((h) => {
      statusDates[h.status] = h.date;
    });

    const returnRequest = await Returns.findOne({
      orderId: order.orderId,
      orderedItem: order.productId,
      variantId: order.variantId,
      userId: user._id,
    }).lean();
let expectedDate = null;

if (order.createdAt) {
  const createdAt = new Date(order.createdAt); // ensure it’s a Date object
  expectedDate = new Date(createdAt.getTime() + 10 * 24 * 60 * 60 * 1000);
}
      
    const review = await Review.find(user._id, product._id);
    res.render("user/orderedItem", {
      order,
      address,
      product,
      variant,
      color:color.name,fit:fit.name,
      statusDates,
      returnStatus: returnRequest ? returnRequest.status : null,
      returnDate: returnRequest ? returnRequest.returnDate : null,
      expectedDate: expectedDate,
      userReview: review ? review : null,wishlistCount,cartCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

exports.getSuccessPage = async (req, res) => {
  const user=await User.findById(req.session.user._id);
  const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
  res.render("user/success", { orderId: null,wishlistCount,cartCount });
};

exports.getFailedPage = async (req, res) => {
  const user=await User.findById(req.session.user._id);
  const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;

  if(req.session.orderId){
    const failedProducts = user.cart.map(item => ({
  productId: item.productId,
  variantId: item.variantId,
  quantity: item.quantity
}));

const orderId=req.session.orderId;
    const total= req.session.amount;
    const payment= req.session.payment;


  await Faileds.create({
    userId: user._id,
    orderId,
    amount: total,
    paymentMethod: payment,
    reason: "Razorpay payment failed",
    products: failedProducts
  });
  req.session.orderId=null;
  req.session.total=null;
  req.session.payment=null;
  }
  res.render("user/failed",{cartCount,wishlistCount});
};
