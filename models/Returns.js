const mongoose=require('mongoose');
const Orders = require('./Orders');
const Products = require('./Products');
const productVariant = require('./productVariant');

const returnSchema=new mongoose.Schema({

    orderId:{
        type:String,
        required:true
    },
    orderedItem:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Products",
        required:true
    },
    variantId:{
        type:mongoose.Schema.ObjectId,
        ref:"ProductVariant",
        required:true
    },  
    userId:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    },
    reason:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['pending','approved','rejected','refunded'],
        default:"pending"
    },
    refundId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Refunds"
    }
   
}, {timestamps:true});

module.exports=mongoose.model("Returns",returnSchema);