const mongoose=require('mongoose');

const colourSchema=new mongoose.Schema({
    name:{
        type:String,
        required: true,
        trim: true,
        unique:true
    },
    hexCode:{
        type:String,
        required:true,
        trim:true,
        unique:true
    }
});

module.exports=mongoose.model('Colour',colourSchema);