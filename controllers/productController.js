const User = require('../models/userModel');
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");
const Orders=require("../models/Orders");

exports.getOrderPage = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // For now, ignore searching by "name" directly on Orders
    const query = {}; 

    const totalOrders = await Orders.countDocuments(query);
    const orders = await Orders.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const list = await Promise.all(
      orders.map(async (item) => {
        const product = await Product.findById(item.productId);
        const variant = await ProductVariant.findById(item.variantId);
        const user = await User.findById(item.userId);

        return {
          orderId: item._id,
          name: product?.name || "Unknown product",
          customer: user?.name || "Unknown customer",
          status: item.status,
          date: item.createdAt.toDateString()
        };
      })
    );

    const totalPages = Math.max(Math.ceil(totalOrders / limit), 1);

    res.render("admin/orders", {
      orders: list,
      search,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get the order document
    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Get product, variant, user
    const product = await Product.findById(order.productId);
    const variant = await ProductVariant.findById(order.variantId);
    const user = await User.findById(order.userId);

    // Find shipping address
    let address = null;
    if (user && user.address && order.addressId) {
      address = user.address.find(
        (addr) => addr._id.toString() === order.addressId.toString()
      );
    }

    const orderDetails = {
      orderId: order.orderId,
      _id:orderId,
      userId: user ? user._id : null,
      product: {
        name: product?.name || "Unknown product",
        description: product?.description || "",
        image: variant.images[0],
      },
      quantity: order.quantity,
      price: order.price,
      status: order.status,
      address: address || {}
    };
     const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.render("admin/orderDetails", { order: orderDetails,successMessage });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};


exports.changeStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Get the order document
    const item = await Orders.findById(orderId);
    
    if (!item) {
      req.session.errorMessage = "Order not found";
      return res.redirect("/admin/orders"); // fallback
    }

    // ✅ Update status
    item.status = req.params.status;

    // ✅ Push into history
    item.statusHistory.push({
      status: req.params.status,
      date: new Date()
    });

    await item.save();

    req.session.successMessage = "Status changed successfully";

    // ✅ Redirect back to order details page
    res.redirect(`/admin/orders/${orderId}`);

  } catch (err) {
    console.error("Error updating order status:", err);
    req.session.errorMessage = "Something went wrong";
    res.redirect("/admin/orders");
  }
};
