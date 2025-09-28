const User=require('../../models/userModel');

exports.delete=async(req,res)=>{
    try{

        res.render('user/deleteAccount');

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
  