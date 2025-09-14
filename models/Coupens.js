const mongoose=require('mongoose');

const coupenScema=new mongoose.Schema({

    code:{
        type:String,
        unique:true,
        trim:true,
        required:true
    },
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
    usageLimit:{
        type:Number,
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
    usedBy:[{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 1 }
    }]

},{timestamps:true});

module.exports=mongoose.model("Coupens",coupenScema);