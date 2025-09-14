const Orders = require("../../models/Orders");
const Users = require("../../models/userModel");

exports.getSalesReport = async (req, res) => {
  try {
    const filter = req.query.filter || "daily"; // default filter = daily
    const filters=["daily", "weekly",  "monthly", "yearly",""];
    if(!filters.includes(filter)){
        return res.redirect("/error");
    }
    // ==== 1. Define Date Range ====
    let startDate;
    const today = new Date();

    if (filter === "daily") {
      startDate = new Date(today.setHours(0, 0, 0, 0));
    } else if (filter === "weekly") {
      const firstDayOfWeek = today.getDate() - today.getDay();
      startDate = new Date(today.setDate(firstDayOfWeek));
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === "monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (filter === "yearly") {
      startDate = new Date(today.getFullYear(), 0, 1);
    }

    // ==== 2. Apply Date Filter ====
    const query = { createdAt: { $gte: startDate } };

    // ==== 3. Shipping Charges (orders < 300) ====
    const totalShippingAgg = await Orders.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$orderId",
          totalOrderAmount: { $sum: "$total" },
        },
      },
      { $match: { totalOrderAmount: { $lt: 300 } } },
      {
        $group: {
          _id: null,
          totalShippingCharge: { $sum: 50 },
        },
      },
    ]);
    const totalShipping = totalShippingAgg[0]?.totalShippingCharge || 0;

    // ==== 4. Total Orders & Amount ====
    const totalOrderAgg = await Orders.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    const totalAmount = totalOrderAgg[0]?.totalAmount || 0;
    const totalOrders = totalOrderAgg[0]?.totalOrders || 0;

    // ==== 5. Revenue ====
    const TotalRevenue = totalAmount + totalShipping;

    // ==== 6. Products Sold (delivered only) ====
    const TotalProductsSoldAgg = await Orders.aggregate([
      { $match: { ...query, status: { $nin: ["cancelled", "returned"]} } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);
    const TotalProductsSold = TotalProductsSoldAgg[0]?.totalQuantity || 0;

    // ==== 7. Pending Payments ====
    const pendingPaymentsAgg = await Orders.aggregate([
      { $match: { ...query, paymentStatus: "pending" } },
      {
        $group: {
          _id: null,
          totalPendings: { $sum: "$total" },
        },
      },
    ]);
    const pendingPayments = pendingPaymentsAgg[0]?.totalPendings || 0;

    // ==== 8. Cancelled Orders ====
    const cancelledOrdersAgg = await Orders.aggregate([
      { $match: { ...query, status: "cancelled" } },
      {
        $group: {
          _id: null,
          totalCancelled: { $sum: "$quantity" },
        },
      },
    ]);
    const cancelledOrders = cancelledOrdersAgg[0]?.totalCancelled || 0;

    // ==== 9. Customers ====
    const TotalCustomersAgg = await Users.aggregate([
         { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const TotalCustomers = TotalCustomersAgg[0]?.total || 0;

    // ==== 10. Render ====
    return res.render("admin/salesReport", {
      filter,
      orders: totalOrders,
      revenue: TotalRevenue,
      products: TotalProductsSold,
      customers: TotalCustomers,
      pending: pendingPayments,
      cancelled: cancelledOrders,
      shipping: totalShipping,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating report");
  }
};
