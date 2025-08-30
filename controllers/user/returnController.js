const User = require("../../models/userModel");
const mongoose = require('mongoose');
const productVariant = require("../../models/productVariant");
const Products = require('../../models/Products');
const Fit = require('../../models/Fit');
const Orders = require('../../models/Orders');  
const Returns=require('../../models/Returns');

exports.return=async(req,res)=>{
   try{

     const {reason,orderId,variantId,productId}=req.body;
     const userId=req.session.user._id;
     const item=new Returns({
        orderId:orderId,
        orderedItem:productId,
        variantId:variantId,
        userId:userId,
        reason:reason

     });

     await item.save();

      await Orders.findOneAndUpdate(
      { orderId, variantId, userId },
      { 
        $set: { status: "returned" },
        $push: { statusHistory: { status: "returned", date: new Date() } }
      }
    );

    req.session.successMessage = "Return request created.";
     res.redirect('/orders');

   }catch(err){
    console.log(err);
   }
}