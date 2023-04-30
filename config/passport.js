const LocalStrategy=require('passport-local').Strategy
const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')
const User=require('../models/User')


module.exports=function (passport){
    passport.use(
        new LocalStrategy({usernameField:'uemail',passwordField:'upassword'},async (email,password,done)=>{
            try{
                 //Matching the User
                const user=await User.findOne({email:email})
                
                    if(!user) {
                        return done(null,false,{message:'It seems that the email you are using does not belong to an account.'})
                    }
                //Match passwords
                const isMatch=await bcrypt.compare(password,user.pass)
                if(isMatch){
                    return done(null,user)
                }else{
                    return done(null,false,{message:'Your password may be incorrect.'})
                }
                
            }
           catch(err){
            console.log(err)
            return done(err)
           }
                
        })
    )

    passport.serializeUser(function(user,done){
        done(null,user.id)
    })

    passport.deserializeUser((id, done) => {
        User.findById(id)
          .then(user => done(null, user))
          .catch(err => done(err, null))
      });
      
}
