const User=require('../../models/userModel');

exports.delete=async(req,res)=>{
    try{

        const user=await User.findById(req.session.user._id);
        const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
        res.render('user/deleteAccount',{name:user.name,image:user.image,wishlistCount,cartCount});

    }catch(err){
        console.log(err)
    }
}

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.session.user._id;
        await User.findByIdAndDelete(userId);

             delete req.session.user;
            if (err) console.log(err);
            res.json({ success: true, message: 'Account deleted successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting account' });
    }
};
  