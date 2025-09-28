const User = require("../../models/userModel");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Faileds=require('../../models/Faileds');

exports.getFailedPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const items = await Faileds.find({ userId: user._id }).sort({ createdAt: -1 });

    
    const failedItems = await Promise.all(
      items.map(async (item) => {
        const productsDetails = await Promise.all(
          item.products.map(async (prod) => {
            const product = await Products.findById(prod.productId);
            const variant = await productVariant.findById(prod.variantId);
            return {
              name: product ? product.name : "Product not found",
              image: variant.images[0] ,
              quantity: prod.quantity,
            
            };
          })
        );

        return {
          orderId: item.orderId,
          amount: item.amount,
          paymentMethod: item.paymentMethod,
          reason: item.reason,
          products: productsDetails,
          createdAt: item.createdAt
        };
      })
    );
console.log(failedItems);
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
    const{total, payment}=req.body;
    console.log("Incoming failed order body:", req.body);
   

     const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderId = `ORD-${timestamp}-${random}`;

    const failedProducts = user.cart.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity
    }));

   const saveddata= await Faileds.create({
      userId: user._id,
      orderId:orderId,
      amount:  Number(total),
      paymentMethod: payment,
      reason:  "Razorpay payment failed",
      products: failedProducts
    });
console.log('data saved is'+ saveddata);
    return res.json({ success: true });

  }catch(err){
    console.log(err);
  }
}
