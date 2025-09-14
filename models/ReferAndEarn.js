const mongoose=require('mongoose');

const referAndEarnSchema=new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true
    },
    referredBy:{        //from which user this user is refered
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
       
    },
    referredCount:{     //how much time this user is referred
        type:Number,
        default:0
    },
    rewardAmount:{         // reward got only from refer and earn
        type:Number,
        default:0
    }
},{timestamps:true});

module.exports=mongoose.model("ReferAndEarn",referAndEarnSchema);