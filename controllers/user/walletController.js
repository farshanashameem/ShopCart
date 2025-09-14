const User=require('../../models/userModel');
const Transactions=require('../../models/WalletTransactions');

exports.getWalletPage=async (req,res)=>{
    try{
        const user=await User.findById(req.session.user._id);
        if(!user) console.log("no user found");

        console.log(user.wallet)
        const walletAmount=user.wallet;
        res.render('user/wallet',{walletAmount:walletAmount,name:user.name,image:user.image});

    }catch(err){
        console.log(err);
    }
}

exports.getTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    // Get all transactions for this user
    const transactions = await Transactions.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 }); // newest first

    res.render("user/transactions", {
      transactions: transactions || [], // fallback if no transactions
      name: user.name,
      image: user.image,
       balance:user.wallet
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.render("user/transactions", {
      transactions: [],
      name: req.session.user?.name || "",
      image: req.session.user?.image || "",
      balance:user.wallet
    });
  }
};
