const Reffers=require('../../models/ReferAndEarn');
const Users=require('../../models/userModel');

exports.getRefferalPage = async (req, res) => {
  try {
    const referrals = await Reffers.find();

    // Resolve user info for each referral
    const items = await Promise.all(
      referrals.map(async (item) => {
        const user = await Users.findById(item.userId, { name: 1, referCode: 1 });

        return {
          name: user?.name || "Unknown User",
          code: user?.referCode || "N/A",
          count: item.referredCount,      // how many times this user is refferred
          amount: item.rewardAmount,      // reward get from the reffer method
        };
      })
    );

      // pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const totalPages = Math.ceil(items.length / limit);

    // slice array for current page
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    // Safely calculate totals
    const totalRefferals = referrals.reduce((sum, acc) => sum + (acc.referredCount || 0), 0);
    const totalRewards = referrals.reduce((sum, acc) => sum + (acc.rewardAmount || 0), 0);
    const totalReferredUsers = referrals.length;

    return res.render("admin/referals", {
      items:paginatedItems,
      totalRefferals,
      totalRewards,
      totalReferredUsers,
      totalPages,
      currentPage: page
    });
  } catch (err) {
    console.error("Error in getRefferalPage:", err);
    res.status(500).send("Internal Server Error");
  }
};
