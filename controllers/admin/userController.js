const User = require("../../models/userModel");
const Orders = require("../../models/Orders");
exports.getUsersPage = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Substring name match using case-insensitive regex
    const query = {
      name: { $regex: search, $options: "i" },
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);
    const orderCounts = await Orders.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    // Convert aggregation result into lookup map
    const orderCountMap = {};
    orderCounts.forEach((oc) => {
      orderCountMap[oc._id.toString()] = oc.count;
    });

    const userData = users.map((user) => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      mobile: user.mobile || "N/A",
      orders: orderCountMap[user._id.toString()] || 0,
      wallet: user.wallet || 0,
      status: user.isBlocked ? "Blocked" : "Active",
      isBlocked: user.isBlocked,
    }));

    const totalPages = Math.max(Math.ceil(totalUsers / limit), 1);
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.render("admin/users", {
      users: userData,
      search,
      currentPage: page,
      totalPages,
      successMessage,
    });
  } catch (err) {
    console.error(err);
    res.render("admin/users", {
      users: [],
      search: "",
      currentPage: 1,
      totalPages: 1,
      error: ["Something went wrong."],
    });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isBlocked = !user.isBlocked;
      await user.save();
      req.session.successMessage = user.isBlocked
        ? "User Blocked."
        : "User Unblocked.";
    }
    res.redirect(
      `/admin/users?page=${req.query.page || 1}&search=${
        req.query.search || ""
      }`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/admin/users");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.session.successMessage = "User Deleted Successfully.";
    res.redirect(
      `/admin/users?page=${req.query.page || 1}&search=${
        req.query.search || ""
      }`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/admin/users");
  }
};
