const mongoose=require('mongoose');

const fitSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    }
});

module.exports=mongoose.model('Fit',fitSchema);