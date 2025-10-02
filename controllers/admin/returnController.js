const Orders = require("../../models/Orders");
const Returns = require("../../models/Returns");
const User = require("../../models/userModel");
const WalletTransactions = require("../../models/WalletTransactions");
const Products = require("../../models/Products");

exports.updateReturnStatus = async (req, res) => {
  try {
    const { orderId, productId, variantId, userId, total, discount, action } =
      req.body;
    console.log(total);
    if (!["approved", "rejected", "refunded"].includes(action)) {
      return res.json({ success: false, message: "Invalid action" });
    }

    const item = await Returns.findOne({
      orderId: orderId,
      orderedItem: productId,
      variantId: variantId,
      userId: userId,
    });
    item.status = action;
    await item.save();

    if (action === "refunded") {
      const user = await User.findById(userId);
      let Discount = total - discount;
      console.log("wallet:" + user.wallet);
      console.log("discount:" + discount);
      user.wallet = user.wallet + Discount;
      await user.save();
      console.log(user.wallet);
      const transaction = new WalletTransactions({
        userId: user._id,
        type: "credit",
        amount: total,
        reason: "Order Refund",
      });
      await transaction.save();
    }

    return res.json({
      success: true,
      message: `Return ${action} successfully`,
    });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
};

exports.getReturnPage = async (req, res) => {
  try {
    // Pagination setup
    const page = parseInt(req.query.page) || 1; // current page
    const limit = 10; // items per page
    const skip = (page - 1) * limit;

    // Search setup
    const search = req.query.search ? req.query.search.trim() : "";

    // First, get matching returns
    let query = {};
    if (search) {
      // find all users matching search name
      const users = await User.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    // Get paginated returns
    const [returns, totalCount] = await Promise.all([
      Returns.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Returns.countDocuments(query),
    ]);

    // Map return items with related data
    const items = await Promise.all(
      returns.map(async (item) => {
        const user = await User.findById(item.userId);
        const product = await Products.findById(item.orderedItem);
        const order = await Orders.findOne({
          orderId: item.orderId,
          productId: item.orderedItem,
          variantId: item.variantId,
          userId: item.userId,
        });

        return {
          name: user ? user.name : "Unknown User",
          orderId: item.orderId,
          product: product ? product.name : "Unknown Product",
          reason: item.reason,
          status: item.status,
          productId: order?.productId || null,
          variantId: order?.variantId || null,
          userId: user?._id || null,
          price: order?.price || 0,
          quantity: order?.quantity || 0,
          couponDiscount: order?.couponDiscount || 0,
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/returns", {
      items,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (err) {
    console.error("Error fetching returns:", err);
    res.status(500).send("Internal Server Error");
  }
};
