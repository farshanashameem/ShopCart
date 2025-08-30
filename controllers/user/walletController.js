const User=require('../../models/userModel')

exports.getWalletPage=async (req,res)=>{
    try{
        const user=await User.findById(req.session.user._id);
        if(!user) console.log("no user found");

        console.log(user.wallet)
        const walletAmount=user.wallet;
        res.render('user/wallet',{walletAmount:walletAmount});

    }catch(err){
        console.log(err);
    }
}