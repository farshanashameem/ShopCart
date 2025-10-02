const User = require("../../models/userModel");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Faileds=require('../../models/Faileds');

exports.getFailedPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const items = await Faileds.find({ userId: user._id ,isActive:true})
  .sort({ createdAt: -1 })
  .populate({
    path: 'products.productId',
    select: 'name', // only fetch name
  })
  .populate({
    path: 'products.variantId',
    select: 'images', // only fetch images
  });


   const failedItems = items.map(item => {
  const productsDetails = item.products.map(prod => ({
    name: prod.productId ? prod.productId.name : "Product not found",
    image: prod.variantId && prod.variantId.images.length ? prod.variantId.images[0] : null,
    quantity: prod.quantity,
  }));

  return {
    id:item._id,
    orderId: item.orderId,
    amount: item.amount,
    paymentMethod: item.paymentMethod,
    reason: item.reason,
    products: productsDetails,
    createdAt: item.createdAt,
    address:item.address
  };
});


    // Render the failed page with all items
    res.render("user/failedOrders", { orders:failedItems, user });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
};

exports.addToFailed=async (req,res)=>{
  try{

    const user = await User.findById(req.session.user._id);
    const{total, payment,appliedCoupon,couponDiscount,addressId,offer,category}=req.body;
    console.log("Incoming failed order body:", req.body);
   

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

    // Find the user
    const user = await User.findById(req.session.user._id).lean();
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // Find the failed order
    const failedOrder = await Faileds.findById(orderId).lean();
    if (!failedOrder || !failedOrder.isActive) {
      return res.json({ success: false, message: "Failed order not found or already processed." });
    }

    const failedItems = failedOrder.products;

    // Compare the user cart with failed order items
    const isSameCart =
      user.cart.length === failedItems.length &&
      user.cart.every((cartItem) =>
        failedItems.some(
          (fItem) =>
            fItem.productId.toString() === cartItem.productId.toString() &&
            fItem.quantity === cartItem.quantity
        )
      );

    if (!isSameCart) {
      return res.json({ success: false, message: "The payment has already been done or cart changed." });
    }

    // Mark failed order as inactive
    await Faileds.updateMany(
  { userId: req.session.user._id, isActive: true }, // filter: all active failed orders of this user
  { $set: { isActive: false } }                     // update: mark them as inactive
);

    return res.redirect('/select-address');
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Something went wrong." });
  }
};


