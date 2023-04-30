const mongoose=require('mongoose')
const slugify=require('slugify')

const eventSchema= new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    speakers:{
        type:String,
        required:true
    },
    venue:{
        type:String,
        required:true
    },
    venueType:{
        type:String,
        required:true
    },
    desc:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    eventlink:{
        type:String,
        required:true
    },
    eventImage:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        default:0
    },
    currency:{
        type:String,
        default:'Ksh'
    },
    locationLink:{
        type:String,
        default:''
    },
    slug:{
        type:String,
        required:true,
        unique:true
    }

})

eventSchema.pre('validate',function (next){
    if(this.title) this.slug=slugify(this.title+`${new Date().getDate()}-${new Date().getMonth()+1}-${new Date().getFullYear()}/${new Date().getHours()}:${new Date().getMinutes()}`,{lower:true,strict:true})
    next()
})

module.exports=mongoose.model('Event',eventSchema)