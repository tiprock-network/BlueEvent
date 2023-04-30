const express=require('express')
const User=require('../models/User')
const bcrypt=require('bcryptjs')
const passport=require('passport')
const router=express.Router()



router.get('/login',(req,res)=>{
    res.render('login')
})

router.get('/signup',(req,res)=>{
    res.render('signup')
})

router.post('/signup',(req,res)=>{
    const {uname,uemail,ucountry,countrycode,uphone,upassword}=req.body

    var errs=[]
    if(!uname||!uemail||!ucountry||!countrycode||!uphone||!upassword) errs.push({msg:'Seems like some fields are missing.'})
    if(upassword<8) errs.push({msg:'We fear your password is too short, kindly make sure it is above 8 characters long.'})

    if(errs.length>0) res.render('signup',{errs})
    else{
        //find if a user does not exist
        User.findOne({email:uemail}).then(user=>{
            if(user){
                errs.push({msg:'Sorry but there\'s someone already with this email.'})
                res.render('signup',{errs})
            }else{
                //password encryption and user registration
                const newUser= new User({
                    name:uname,
                    email:uemail,
                    phone:countrycode+uphone,
                    countrycode:countrycode,
                    country:ucountry,
                    pass:upassword
                })
                //encrypt the password using bcrypt js
                bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(newUser.pass, salt, (err,hash)=>{
                    if(err) throw err
                    //input new hashed password
                    newUser.pass=hash
                    //save the user to mongoDB
                    newUser.save().then(user=>{
                        req.flash('success_msg','Your account has been successfully created.')
                        res.redirect('/users/login')
                    }).catch(err=>console.log(err))

                }))
            }
        })
    }
})

router.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        successRedirect:'/',
        failureRedirect:'/users/login',
        failureFlash:true

    })(req,res,next)
})

router.get('/logout', function(req, res) {
    req.logout(function(err) {
      if (err) {
        console.log(err);
      }
      req.flash('success_msg','Account logged out.')
      res.redirect('/');
    });
  });
  

module.exports=router