const cron = require("node-cron");
const Orders = require("../models/Orders");

// Run every 10 minutes to check for orders
cron.schedule("*/10 * * * *", async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 1000);

    await Orders.updateMany(
      { status: "pending", createdAt: { $lte: twoHoursAgo } },
      {
        $set: { status: "placed" },
        $push: {
          statusHistory: {
            status: "placed",
            date: new Date()
          }
        }
      }
    );

    console.log("✅ Order statuses updated to 'placed' with history");
  } catch (err) {
    console.error("❌ Error updating order statuses:", err);
  }
});
