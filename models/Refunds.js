const mongoose=require("mongoose");

const refundSchema=new mongoose.Schema({
    returnId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Returns",
        required:trusted
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        enum:["processing","completed","failed"],
        default:"processing"
    },
    processedAt:{
        type:Date
    }
},{timestamps:true});

module.exports=mongoose.model("Refunds",refundSchema);