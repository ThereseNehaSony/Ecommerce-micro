const express = require('express');
const mongoose = require('mongoose');
const User = require('./User')
const jwt = require('jsonwebtoken')

const app = express();
const PORT = process.env.PORT_ONE || 7070;

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/auth-service',{
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(()=>{
    console.log('Auth-service DB is connected')
  })
  .catch((error)=>{
    console.log('Auth-service DB is not connected',error)
  }

  
  )
   //login
   app.post('/auth/login' ,async(req,res) =>{
       const {email,password} = req.body
       const user = await User.findOne({email})
       if(!user){
         return res.json({message:"User doesnot exists"})
       }else{
        if (password !== user.password) {
          return res.json({ message: "Password Incorrect" });
        }
          const payload = {
            email:user.email,
            name : user.name
          };
          jwt.sign(payload ,'secret',(err,token)=>{
            if(err){
              console.log(err)
            }else{
              return res.json({token:token})
            }
          })
       }
   })
   //signup
   app.post('/auth/register',async(req,res)=>{
       const {email,password,name} = req.body
       console.log(email,"email of user");

       const userExists = await User.findOne({email:email})
       if(userExists){
            return res.json({message : "User already exists"})
       }else{
            const newUser = new User({
              name,
              email,
              password
            })
            await newUser.save()
            return res.json(newUser)
       }
   })





app.listen(PORT,()=>{
    console.log(`Auth-Service at ${PORT}`);
})
