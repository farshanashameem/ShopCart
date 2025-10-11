const User = require("../../models/userModel");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Faileds=require('../../models/Faileds');

exports.getFailedPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const cartCount = user?.cart?.length || 0;
    const wishlistCount = user?.wishlist?.length || 0;

    if (!user) {
      return res.render("user/failedOrders", {
        orders: [],
        user: null,
        wishlistCount: 0,
        cartCount: 0,
        errorMessage: "User not found.",
      });
    }

    // Fetch all active failed orders for this user
    const failedOrders = await Faileds.find({ userId: user._id, isActive: true })
      .sort({ createdAt: -1 })
      .populate({
        path: "products.productId",
        select: "name",
      })
      .populate({
        path: "products.variantId",
        select: "images",
      })
      .lean();

    if (!failedOrders || failedOrders.length === 0) {
      return res.render("user/failedOrders", {
        orders: [],
        user,
        wishlistCount,
        cartCount,
      });
    }

    // ✅ Check each failed order — if cart items differ, mark as inactive
    const validOrders = [];
    for (const order of failedOrders) {
      const failedItems = order.products;

      const isSameCart =
        user.cart.length === failedItems.length &&
        user.cart.every((cartItem) =>
          failedItems.some(
            (fItem) =>
              fItem.productId?._id?.toString() ===
                cartItem.productId?.toString() &&
              fItem.quantity === cartItem.quantity
          )
        );

      if (isSameCart) {
        validOrders.push(order); // keep it
      } else {
        // mark it inactive if it doesn't match
        await Faileds.findByIdAndUpdate(order._id, { isActive: false });
      }
    }

    // ✅ Format the valid orders for rendering
    const formattedOrders = validOrders.map((item) => {
      const productsDetails = item.products.map((prod) => ({
        name: prod.productId ? prod.productId.name : "Product not found",
        image:
          prod.variantId && prod.variantId.images.length
            ? prod.variantId.images[0]
            : null,
        quantity: prod.quantity,
      }));

      return {
        id: item._id,
        orderId: item.orderId,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        reason: item.reason,
        products: productsDetails,
        createdAt: item.createdAt,
        address: item.address,
        isActive: item.isActive,
      };
    });

    // ✅ Render only valid (cart-matching) failed orders
    res.render("user/failedOrders", {
      orders: formattedOrders,
      user,
      wishlistCount,
      cartCount,
    });
  } catch (err) {
    console.error("Error in getFailedPage:", err);
    res.status(500).send("Something went wrong");
  }
};


exports.addToFailed=async (req,res)=>{
  try{
    //saving datas to failed collection by takinf all details and cart list
    const user = await User.findById(req.session.user._id);
    const{total, payment,appliedCoupon,couponDiscount,addressId,offer,category}=req.body;
     

     const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderId = `ORD-${timestamp}-${random}`;
    const address=user.address.find(addr => addr._id.toString() === addressId.toString());
    const failedProducts = user.cart;

   const saveddata= await Faileds.create({
      userId: user._id,
      orderId:orderId,
      amount:  Number(total),
      paymentMethod: payment,
      couponId:appliedCoupon,
      couponDiscount,address,
      offer,category,
      reason:  `${payment} payment failed`,
      products: failedProducts
    });

    return res.json({ success: true });

  }catch(err){
    console.log(err);
  }
}

exports.retryPayment = async (req, res) => {
  try {
    const orderId = req.body.id;

    // 1️⃣ Find the user
    const user = await User.findById(req.session.user._id).lean();
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // 2️⃣ Find the failed order
    const failedOrder = await Faileds.findById(orderId).lean();
    if (!failedOrder || !failedOrder.isActive) {
      return res.json({ success: false, message: "Failed order not found or already processed." });
    }

    // 3️⃣ Compare with current cart
    const failedItems = failedOrder.products;
    const isSameCart =
      user.cart.length === failedItems.length &&
      user.cart.every((cartItem) =>
        failedItems.some(
          (fItem) =>
            fItem.productId?.toString() === cartItem.productId?.toString() &&
            fItem.quantity === cartItem.quantity
        )
      );

    if (!isSameCart) {
      return res.json({
        success: false,
        message: "Your cart has changed since this failed payment. Please review your cart before retrying.",
      });
    }

    // ✅ Do NOT mark inactive yet — only redirect to checkout
    req.session.retryOrderId = failedOrder._id; // temporarily store orderId in session

    return res.json({
      success: true,
      message: "Redirecting to checkout...",
      redirectUrl: "/select-address",
    });

  } catch (err) {
    console.error("Error in retryPayment:", err);
    return res.json({ success: false, message: "Something went wrong. Please try again." });
  }
};




