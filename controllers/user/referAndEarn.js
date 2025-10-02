const User = require("../../models/userModel");
const mongoose = require('mongoose');
const referCode=require('../../utils/referCode');

exports.getReferCode=async (req,res)=>{
    try{
        const user=await User.findById(req.session.user._id);
        if(!user.referCode){
            const code=referCode(user._id);
            user.referCode=code;
            await user.save();
        }
        return res.render('user/referCode',{name:user.name,code:user.referCode,image:user.image});

    }catch(err){

    }
}