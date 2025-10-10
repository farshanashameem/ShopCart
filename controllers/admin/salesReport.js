const Orders = require("../../models/Orders");
const Users = require("../../models/userModel");
const Products = require("../../models/Products");
const productVariant = require("../../models/productVariant");
const ProductType = require("../../models/ProductType");

// ==== Reusable function for finding the sales related things ====
async function getReportData(query) {
  // 1.Total  Shipping Charges (orders < 300)
  /* here Total shipping charge that assigned orders less than 300 is getting*/
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

  // 2. Total Orders & Amount
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

  // 3. Revenue
  const TotalRevenue = totalAmount + totalShipping;

  // 4. Products Sold
  const TotalProductsSoldAgg = await Orders.aggregate([
    { $match: { ...query, status: { $nin: ["cancelled", "returned"] } } },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);
  const TotalProductsSold = TotalProductsSoldAgg[0]?.totalQuantity || 0;

  // 5. Pending Payments
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

  // 6. Cancelled Orders
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

  // 7. Customers (created within query range)
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

  return {
    orders: totalOrders,
    revenue: TotalRevenue,
    products: TotalProductsSold,
    customers: TotalCustomers,
    pending: pendingPayments,
    cancelled: cancelledOrders,
    shipping: totalShipping,
  };
}

// ==== Controller ====

// GET -> Initial load (default yearly) in the sale report
exports.getSalesReport = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const query = { createdAt: { $gte: startDate } };
    const report = await getReportData(query);

    const orders = await Orders.find(query); // <-- Apply date filter here
    const orderedItems = await Promise.all(
      orders.map(async (item) => {
        const product = await Products.findById(item.productId);
        const category = await ProductType.findById(product.productTypeId);
        return {
          name: product.name,
          category: category.name,
          quantity: item.quantity,
          total: item.total,
          date: item.createdAt,
        };
      })
    );

    res.render("admin/salesReport", {
      filter: "yearly",
      ...report,
      items: orderedItems,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating report");
  }
};

exports.postSalesReport = async (req, res) => {
  try {
    const { filter, from, to } = req.body;
    let startDate, endDate;
    const today = new Date();

    // ==== Case 1: Predefined filter ====
    if (filter) {
      if (filter === "daily") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
      } else if (filter === "weekly") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (filter === "monthly") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      } else if (filter === "yearly") {
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else {
        return res.redirect("/admin/salesReport");
      }

      const query = { createdAt: { $gte: startDate } };
      const report = await getReportData(query);

      const orders = await Orders.find(query); // <-- Apply date filter here
      const orderedItems = await Promise.all(
        orders.map(async (item) => {
          const product = await Products.findById(item.productId);
          const category = await ProductType.findById(product.productTypeId);
          return {
            name: product.name,
            category: category.name,
            quantity: item.quantity,
            total: item.total,
            date: item.createdAt,
          };
        })
      );

      return res.render("admin/salesReport", {
        filter,
        ...report,
        items: orderedItems,
      });
    }

    // ==== Case 2: Custom Date Range ====
    if (from || to) {
      if (!from || !to) {
        return res.render("admin/salesReport", {
          filter: "Custom Date",
          orders: 0,
          revenue: 0,
          products: 0,
          customers: 0,
          pending: 0,
          cancelled: 0,
          shipping: 0,
          items: [],
          errorMessage: "Please select both From and To dates",
        });
      }

      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      if (isNaN(startDate) || isNaN(endDate) || startDate > endDate || startDate > today) {
        return res.render("admin/salesReport", {
          filter: "Custom Date",
          orders: 0,
          revenue: 0,
          products: 0,
          customers: 0,
          pending: 0,
          cancelled: 0,
          shipping: 0,
          items: [],
          errorMessage: "Invalid date range",
        });
      }

      const query = { createdAt: { $gte: startDate, $lte: endDate } };
      const report = await getReportData(query);

      const orders = await Orders.find(query); // <-- Apply date filter here
      const orderedItems = await Promise.all(
        orders.map(async (item) => {
          const product = await Products.findById(item.productId);
          const category = await ProductType.findById(product.productTypeId);
          return {
            name: product.name,
            category: category.name,
            quantity: item.quantity,
            total: item.total,
            date: item.createdAt,
          };
        })
      );

      return res.render("admin/salesReport", {
        filter: `From ${from} To ${to}`,
        ...report,
        items: orderedItems,
      });
    }

    // If nothing matches -> redirect
    res.redirect("/admin/salesReport");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating report");
  }
};


//function to calculate the total report in the dashboard
async function getTotalReport() {
  //=== getting full report from the start of the app ===//

  //1. total customers count
  const totalCustomer = await Users.countDocuments();
  //2. Total Orders
  const totalOrder = (await Orders.distinct("orderId")).length;

  //3. Total sales
  let totalSale = await Orders.aggregate([
    {
      $group: {
        _id: null,
        totalSale: { $sum: "$total" },
      },
    },
  ]);
  totalSale = totalSale[0]?.totalSale || 0;
  //4. Total products sold
  let totalProducts = await Orders.aggregate([
    { $match: { status: { $nin: ["cancelled", "returned"] } } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: "$quantity" },
      },
    },
  ]);
  totalProducts = totalProducts[0]?.totalProducts || 0;
  return {
    totalCustomer,
    totalOrder,
    totalProducts,
    totalSale,
  };
}

exports.getPage = async (req, res) => {
  try {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const query = { createdAt: { $gte: startDate } };
    const report = await getReportData(query);

    let dateFormat = "%d %b";
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setDate(endDate.getDate() - 6); // include today + past 6 days
    start.setHours(0, 0, 0, 0);

    let groupBy = { $dayOfMonth: "$createdAt" }; // daily

    const data = await Orders.aggregate([
      { $match: { createdAt: { $gte: start, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const labels = data.map((d) => d._id);
    const values = data.map((d) => d.total);

    //top 10 orders
    const topOrders = await Orders.aggregate([
      {
        $match: { createdAt: { $gte: start, $lte: endDate } },
      },
      {
        $group: {
          _id: "$productId",
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ]);

    const items = await Promise.all(
      topOrders.map(async (item) => {
        const product = await Products.findById(item._id); // use item._id
        const variant = await productVariant.findOne({ productId: item._id }); // first variant
        return {
          name: product.name,
          image: variant ? variant.images[0] : null, // handle no variant
          itemsSold: item.totalOrders,
          quantity: item.totalQuantity,
        };
      })
    );

    const total = await getTotalReport();

    return res.render("admin/dashboard", {
      ...report,
      ...total,
      labels,
      values,
      items,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { from, to } = req.body || {};
    let startDate = new Date(from);
    let endDate = new Date(to);
    const today = new Date();
    //top 10 orders
    const topOrders = await Orders.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } },
      },
      {
        $group: {
          _id: "$productId",
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ]);
    console.log(topOrders);

    const items = await Promise.all(
      topOrders.map(async (item) => {
        const product = await Products.findById(item._id); // use item._id
        const variant = await productVariant.findOne({ productId: item._id }); // first variant
        return {
          name: product.name,
          image: variant ? variant.images[0] : null, // handle no variant
          itemsSold: item.totalOrders,
          quantity: item.totalQuantity,
        };
      })
    );

    const total = await getTotalReport();
    if (!from || !to) {
      return res.render("admin/dashboard", {
        filter: "Custom Date",
        ...total,
        orders: 0,
        revenue: 0,
        products: 0,
        customers: 0,
        pending: 0,
        cancelled: 0,
        shipping: 0,
        errorMessage: "Please select both From and To dates",
        labels: [],
        values: [],
        items,
      });
    } else {
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      if (isNaN(startDate) || isNaN(endDate) || startDate > endDate ||startDate>today) {
        return res.render("admin/dashboard", {
          filter: `From ${from} To ${to}`,
          ...total,
          orders: 0,
          revenue: 0,
          products: 0,
          customers: 0,
          pending: 0,
          cancelled: 0,
          shipping: 0,
          errorMessage: "Invalid date range",
          labels: [],
          values: [],
          items,
        });
      }
    }

    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);

    let dateFormat;

    if (days <= 10) dateFormat = "%d %b"; // daily, e.g., 20 Sep
    else if (days <= 60) dateFormat = "Week %U"; // weekly
    else dateFormat = "%b %Y";

    let groupBy;
    if (days <= 10) {
      groupBy = { $dayOfMonth: "$createdAt" }; // daily
    } else if (days <= 60) {
      groupBy = { $week: "$createdAt" }; // weekly
    } else {
      groupBy = { $month: "$createdAt" }; // monthly
    }

    const data = await Orders.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const labels = data.map((d) => d._id);
    const values = data.map((d) => d.total);

    // Get report summary
    const query = { createdAt: { $gte: startDate, $lte: endDate } };
    const report = await getReportData(query);

    res.render("admin/dashboard", {
      ...report,
      ...total,
      labels,
      values,
      items,
      filter: `From ${from} To ${to}`,
      errorMessage: null,
    });
  } catch (err) {
    console.error(err);
    res.render("admin/dashboard", {
      errorMessage: "Something went wrong",
      orders: 0,
      customers: 0,
      revenue: 0,
      products: 0,
      labels: [],
      values: [],
    });
  }
};
