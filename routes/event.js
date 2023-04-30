const express=require('express')
const Event=require('./../models/event')
const Registration=require('./../models/register')
const paypal=require('paypal-rest-sdk')

const {ensureAuthenticated}=require('../config/auth')
const router=express.Router()

//configure environmental variables
require('dotenv').config()

//PAYMENTS INSTANCES
//paypal payment
paypal.configure({
   'mode':'sandbox',//change to live later
   'client_id':process.env.PAYPAL_CLIENT_ID,
   'client_secret':process.env.PAYPAL_CLIENT_SECRET
})


//end of payment instances

router.get('/new',ensureAuthenticated,(req,res)=>{
   res.render('./events/new', {event:new Event(),user:req.user})
})

router.get('/edit/:id',ensureAuthenticated,async (req,res)=>{
   const event = await Event.findById(req.params.id)
   res.render('./events/edit', {event:event,user:req.user})
})

router.get('/:slug',async (req,res)=>{
   const event=await Event.findOne({slug:req.params.slug})
   //redirect if article is not found
   if(event==null) res.redirect('/')
   res.render('events/info', {event:event,user:req.user})

})

router.get('/register/:slug',ensureAuthenticated,async (req,res)=>{
   const event=await Event.findOne({slug:req.params.slug})
   //redirect if article is not found
   if(event==null) res.redirect('/')
   res.render('./events/register', {event:event,user:req.user})

})

router.get('/register/confirmation/:id',ensureAuthenticated,async (req,res)=>{
   const registration=await Registration.findById(req.params.id)

   if(registration.price>0 && registration.currency=="$"){
   //check paypal payment
   const payerId=req.query.PayerID
   const paymentId=req.query.paymentId
   let totalPayment=(parseFloat(registration.price)*parseFloat(registration.quantity)).toFixed(2).toString()
   const execute_payment_json={
      "payer_id":payerId,
      "transactions":[
         {
            "amount":{
               "currency":"USD",//change currency to KSH from DB after checking if KES is allowed
               "total":totalPayment
            }
         }
      ]
   }

   

   paypal.payment.execute(paymentId,execute_payment_json,function(error,payment){
      if(error){
         console.log(error.response);
         throw error;
      }else{
         //payment confirmation and success object
         //console.log(payment_obj)
      }
   })
   //end of check paypal payment
   }
   //redirect if article is not found
   if(registration==null) res.redirect('/')
   res.render('./events/confirmation', {reg:registration,user:req.user})

})



router.post('/',async (req,res,next)=>{
   req.event=new Event()
   next()
},saveAndRedirect('new'))



router.put('/:id', async (req,res,next)=>{
   req.event=await Event.findById(req.params.id)
   next()
},saveAndRedirect('edit'))

router.delete('/:id', async (req,res)=>{
   await Event.findByIdAndDelete(req.params.id)
   res.redirect('/')
})

function saveAndRedirect(path){
   return async (req,res)=>{
      let myevent=req.event
      
         myevent.title=req.body.eventname
         myevent.speakers=req.body.eventSpeaker
         myevent.venue=req.body.venue
         myevent.venueType=req.body.venueType
         myevent.desc=req.body.evedesc
         myevent.date=req.body.evedate
         myevent.eventlink=req.body.eventlink
         myevent.eventImage=req.body.eventImage
         myevent.time=req.body.time
         myevent.currency=req.body.currency
         myevent.price=req.body.price
         myevent.locationLink=req.body.location
      
      try{
         
         myevent= await myevent.save()
         res.redirect(`/events/${myevent.slug}`)
      }catch(e){
         res.render(`events/${path}`, {myevent:myevent})
         console.log(e)
      }

   }
}

router.post('/register/:slug',async (req,res,next)=>{
   req.event=new Event()
   req.registration= new Registration()
   next()
},registerRedirect('register/:slug'))

function registerRedirect(path){
   return async (req,res)=>{
      let event=await Event.findOne({slug:req.params.slug})
      let registration=req.registration
      
         registration.title=event.title
         registration.price=event.price
         registration.currency=event.currency
         registration.date=event.date
         registration.quantity=req.body.qty
         registration.userName=req.user.name
         registration.userId=req.user.id
         registration.email=req.user.email
         registration.eventlink=event.eventlink
         registration.userPhone=req.user.phone
      
      if(event.price>0 && event.currency==="$"){

      //before payment
      //check if payable

      //the totalPay is required by Paypal to be this way and the req and event are to be used not registration in this variable
      let totalPay=(parseFloat(event.price)*parseFloat(req.body.qty)).toFixed(2).toString()
      //console.log('The total pay: '+totalPay)

      const create_payment_json = {
         "intent": "sale",
         "payer": {
             "payment_method": "paypal"
         },
         "redirect_urls": {
             "return_url": `http://localhost:${process.env.PORT}/events/register/confirmation/${registration.id}`,
             "cancel_url": `http://localhost:${process.env.PORT}`
         },
         "transactions": [{
             "item_list": {
                 "items": [{
                     "name": `${registration.title}`,
                     "sku": `${registration.userId}`,
                     "price": `${registration.price}`,
                     "currency": "USD",//use varying currency
                     "quantity": parseInt(req.body.qty)
                 }]
             },
             "amount": {
                 "currency": "USD",//use varying currency (registration.price * registration.qty)
                 "total": totalPay
             },
             "description": `${registration.title} Event`
         }]
     }

     
     paypal.payment.create(create_payment_json,function (error,payment){
      if(error){
        console.log(error);
        res.redirect(`/events/register/${req.params.slug}`);
      }
      else{
         //redirect user to where they will pay
         for(let i=0;i<payment.links.length;i++) {
            if(payment.links[i].rel==='approval_url') {
               
                  res.redirect(payment.links[i].href);
                  return;
                }
            }
            console.log('no approval_url');
            res.redirect(`/events/register/${req.params.slug}`);
         }
      

      })

      //after payment
   }else if(event.price>0 && event.currency==="Ksh"){
      //mpesa payment starts here
      res.redirect(`/events/register/confirmation/${registration.id}`);
      //mpesa payment ends here

   }else if(event.price===0){
      //if the event is free
      res.redirect(`/events/register/confirmation/${registration.id}`);
   }else{
      res.redirect(`/events/register/${req.params.slug}`);
   }
         
      try{
         
         

      
      //save the object to mongo db
      registration= await registration.save()
         
      }catch(e){
         res.render(`events/${path}`, {event:event})
         console.log(e)
      }

   }
}


module.exports=router