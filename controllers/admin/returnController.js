const Orders=require('../../models/Orders');
const Returns=require('../../models/Returns');
const User=require('../../models/userModel');
const WalletTransactions = require('../../models/WalletTransactions');


exports.updateReturnStatus = async (req, res) => {
  try {
    const { orderId,productId,variantId,userId,total,action } = req.body;
    console.log(total);
    if (!["approved", "rejected","refunded"].includes(action)) {
      return res.json({ success: false, message: "Invalid action" });
    }

    const item=await Returns.findOne({
          orderId: orderId,
          orderedItem:productId,
          variantId:variantId,
          userId: userId
        });
    item.status=action;
    await item.save();

    if(action==="refunded"){
        const user=await User.findById(userId);
        user.wallet=user.wallet+total;
        await user.save();
        console.log(user.wallet);
        const transaction=new WalletTransactions({
            userId:user._id,
            type:"credit",
            amount:total,
            reason: "Order Refund" 
         });
         await transaction.save();


    }
    
    return res.json({ success: true, message: `Return ${action} successfully` });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
};

