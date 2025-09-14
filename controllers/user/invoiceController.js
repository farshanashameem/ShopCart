const Orders = require("../../models/Orders");
const User = require("../../models/userModel");
const ProductVariant = require("../../models/productVariant");
const Products = require("../../models/Products");
const Colour = require("../../models/Colour");

exports.getInvoicePage = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const user=await User.findById(req.session.user._id);
    // get all orders with same orderId
    const orderItems = await Orders.find({ orderId });
    const discount = orderItems.reduce((sum, item) => sum + (item.couponDiscount || 0), 0);
    if (!orderItems || orderItems.length === 0) {
      return res.status(404).send("Order not found");
    }

    
    // map all products
    const list = await Promise.all(
      orderItems.map(async (item) => {
        const product = await Products.findById(item.productId);
        const variant = await ProductVariant.findById(item.variantId);
        const color = await Colour.findById(variant.colorId);

        // find correct address
        const address = user.address.find(
          (addr) => addr._id.toString() === item.addressId.toString()
        );

        return {
          name: user.name,
          email: user.email,
          color: color?.name || "N/A",
          size: variant?.size || "N/A",
          address: `${address?.locality}, ${address?.city}, ${address?.state}, ${address?.pincode}`,
          description: product?.description,
          quantity: item.quantity,
          basePrice: variant?.basePrice || 0,
          discountPrice: variant?.discountPrice || 0,
          total: (variant?.discountPrice || variant?.basePrice || 0) * item.quantity,
        };
      })
    );

    // calculate grand total
    const grandTotal = list.reduce((acc, cur) => acc + cur.total, 0);
    const deliveryCharge=grandTotal<300?50:0;

    res.render("user/invoice", {
      orders: list,
      orderId,
      grandTotal,
      createdAt: orderItems[0].createdAt,
      discount,
      deliveryCharge
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
