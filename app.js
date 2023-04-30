const express=require('express')
const mongoose=require('mongoose')
const flash=require('connect-flash')
const session=require('express-session')
const Event=require('./models/event')
const eventRouter=require('./routes/event')
const userRouter=require('./routes/users')
const methodOverride=require('method-override')
const passport = require('passport')
//const initializePassport=require('./config/passport')
const app=express()


require('./config/passport')(passport)
//initializePassport(passport)
//middleware
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(methodOverride('_method'))
require('dotenv').config()

//connect to mongodb
mongoose.connect(process.env.MONGO_URI).then(console.log('Mongo DB connected...'))
app.use(express.urlencoded({extended:false}))
//middleware for flash messages(connect flash) with express session
//express session
app.use(session({secret:'secret',resave:true,saveUninitialized:true}))
app.use(passport.initialize())
app.use(passport.session())
//connect flash middleware
app.use(flash())
//global message colors
app.use((req,res,next)=>{
    res.locals.success_msg=req.flash('success_msg')
    res.locals.error_msg=req.flash('error_msg')
    res.locals.error=req.flash('error')
    next()
})

//router for events
app.use('/events',eventRouter)

//router for user accounts
app.use('/users',userRouter)

app.get('/', async (req,res)=>{
    const events_object= await Event.find().sort({date:'desc'})
    res.render('events/index',{events:events_object,user:req.user})
})



const port=process.env.PORT||5001;

app.listen(port,()=>{
    console.log(`App listening on port ${port}`)
})
