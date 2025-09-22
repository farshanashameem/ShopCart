const User = require("../../models/userModel");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Failed=require('../../models/Faileds');

exports.getFailedPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const items = await Failed.find({ userId: user._id }).sort({ createdAt: -1 });

    
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

    // Render the failed page with all items
    res.render("user/failedOrders", { orders:failedItems, user });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
};
