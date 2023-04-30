const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    countrycode:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    pass:{
        type:String,
        required:true
    },
    userType:{
        type:String,
        default:'user'
    },
    date:{
        type:Date,
        default:Date.now()
    }
})

module.exports=mongoose.model('User',userSchema)