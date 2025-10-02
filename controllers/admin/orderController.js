const User = require('../../models/userModel');
const Product = require("../../models/Products");
const ProductVariant = require("../../models/productVariant");
const Orders=require("../../models/Orders");
const Returns=require('../../models/Returns');
//=== Order list page ===//
exports.getOrderPage = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // For now, ignore searching by "name" directly on Orders
    const query = {}; 
    if (search) {
      query.name = { $regex: search, $options: "i" }; // case-insensitive search in orders.name
    }

     if (search) {
      const users = await Orders.find({
        name: { $regex: search, $options: "i" }   // case-insensitive search
      }).select("_id");
      userIds = users.map(u => u._id);
    }

    const totalOrders = await Orders.countDocuments(query);
    const orders = await Orders.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      //from orders list finding the product name,variant and then finding the price,size for displaying
    const list = await Promise.all(
      orders.map(async (item) => {
        const product = await Product.findById(item.productId);
        const variant = await ProductVariant.findById(item.variantId);
        const user = await User.findById(item.userId);

        return {
          orderId: item._id,
          name: item.name || "Unknown product",
          customer: user?.name || "Unknown customer",
          status: item.status,
          date: item.createdAt.toDateString()
        };
      })
    );

    // finding the total pages that present
    const totalPages = Math.max(Math.ceil(totalOrders / limit), 1);

    res.render("admin/orders", {
      orders: list,
      search,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    
    res.status(500).send("Server Error");
  }
};

//=== order details page ===//
exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get the order document
    const order = await Orders.findById(orderId).lean();
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Get product, variant, user
    const product = await Product.findById(order.productId);
    const variant = await ProductVariant.findById(order.variantId);
    const user = await User.findById(order.userId);

    // Find return request (if any)
    const orderID = order.orderId;
    const returnItem = await Returns.findOne({
      orderId: orderID,
      orderedItem: order.productId,
      variantId: order.variantId,
      userId: user?._id
    }).lean();

    // 🔹 Address handling
    let address = {};
    if (order.address) {
      // New format (full address saved in order)
      address = order.address;
    } else if (order.addressId ) {
      // Old format (addressId -> find from user's addresses array)
      const foundAddress = user.address.find(addr => addr._id.toString() === order.addressId.toString());
     
      if (foundAddress) {
        address = foundAddress;
      }
    }

    const orderDetails = {
      orderId: order.orderId,
      _id: orderId,
      userId: user ? user._id : null,
      product: {
        name: product?.name || "Unknown product",
        description: product?.description || "",
        image: variant?.images[0] || ""
      },
      quantity: order.quantity,
      price: order.price,
      status: order.status,
      reasons: order.cancelReason,
      reason: returnItem ? returnItem.reason : null,
      address, // 👈 Always resolved
      productId: order.productId,
      variantId: order.variantId,
      couponDiscount: order.couponDiscount,
      returnedStatus: returnItem ? returnItem.status : null
    };

    const successMessage = req.session.successMessage;
    req.session.successMessage = null;

    res.render("admin/orderDetails", { order: orderDetails, successMessage });
  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).send("Server Error");
  }
};


//=== change the status of each order ===//
exports.changeStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Get the order document
    const item = await Orders.findById(orderId);
    
    if (!item) {
      req.session.errorMessage = "Order not found";
      return res.redirect("/admin/orders"); // fallback
    }

    //  Update status
    item.status = req.params.status;
    if(item.status==='delivered'){
      item.paymentStatus="paid"
    }
    //  Push into history
    item.statusHistory.push({
      status: req.params.status,
      date: new Date()
    });

    await item.save();

    req.session.successMessage = "Status changed successfully";

    // Redirect back to order details page
    res.redirect(`/admin/orders/${orderId}`);

  } catch (err) {
   
    req.session.errorMessage = "Something went wrong";
    res.redirect("/admin/orders");
  }
};


