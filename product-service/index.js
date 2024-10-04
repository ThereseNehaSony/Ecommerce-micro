const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib')
const jwt = require('jsonwebtoken')
const Product = require('./Product')
const isAuthenticated = require('../isAuthenticated')

const app = express();
const PORT = process.env.PORT_ONE || 8080;

app.use(express.json());

var order;
var channel, connection;

mongoose.connect('mongodb://127.0.0.1:27017/product-service',{
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(()=>{
    console.log('Product-service DB is connected')
  })
  .catch((error)=>{
    console.log('Product-service DB is not connected',error)
  }

  
  )

  async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("PRODUCT")
  }
  connect();
  //add product
  app.post('/product/add',isAuthenticated,(req,res)=>{
       const {name,description,price} = req.body
       const newProduct = new Product({
           name,
           description,
           price
       })
       newProduct.save()
       return res.json(newProduct)
  })
 
  //buy product
  app.post('/product/buy',isAuthenticated,async (req,res)=>{
    const {ids} = req.body
    const products = await Product.find({_id: {$in:ids}})
    channel.sendToQueue(
      "ORDER",
      Buffer.from(
        JSON.stringify({
          products,
          userEmail:req.user.email
        })
      )
    )
    channel.consume("PRODUCT",(data)=>{
      console.log("Consuming Product queue");
      order = JSON.parse(data.content)
      channel.ack(data)
      console.log(order,"order")
    })
    
    return res.json(order)
  })


app.listen(PORT,()=>{
    console.log(`Product-Service at ${PORT}`);
})
