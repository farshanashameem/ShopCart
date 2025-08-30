const mongoose=require("mongoose");

const transactionSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    type:{
        type:String,
        enum:["credit","debit"],
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    reason:{
        type:String,
        required:true
    }
},{timestamps:true});

module.exports=mongoose.model("WalletTransaction",transactionSchema);