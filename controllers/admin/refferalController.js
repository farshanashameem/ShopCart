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
          count: item.referredCount,
          amount: item.rewardAmount,
        };
      })
    );

    // Safely calculate totals
    const totalRefferals = referrals.reduce((sum, acc) => sum + (acc.referredCount || 0), 0);
    const totalRewards = referrals.reduce((sum, acc) => sum + (acc.rewardAmount || 0), 0);
    const totalReferredUsers = referrals.length;

    return res.render("admin/referals", {
      items,
      totalRefferals,
      totalRewards,
      totalReferredUsers,
    });
  } catch (err) {
    console.error("Error in getRefferalPage:", err);
    res.status(500).send("Internal Server Error");
  }
};
