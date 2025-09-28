const mongoose=require('mongoose');

const offerSchema=new mongoose.Schema({

    category:{
        type:String,
        required:true
    },
    discountValue:{
        type:Number,
        required:true
    },
    discountType:{
        type:String,
        enum:["flat","percentage"],
        default:"flat",
        required:true
    },
    minValue:{
        type:Number,
        default:0,
        required:true
    },
    
    usageCount:{
        type:Number,
        default:0
    },
    startDate:{
        type:Date,
        required:true
    },
    endDate:{
        type:Date,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    

},{timestamps:true});

module.exports=mongoose.model("Offers",offerSchema);