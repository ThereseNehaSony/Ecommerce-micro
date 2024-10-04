const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib')
const jwt = require('jsonwebtoken')
const Order = require('./Order')
const isAuthenticated = require('../isAuthenticated')

const app = express();
const PORT = process.env.PORT_ONE || 9090;

app.use(express.json());

var channel, connection;

mongoose.connect('mongodb://127.0.0.1:27017/order-service',{
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(()=>{
    console.log('Order-service DB is connected')
  })
  .catch((error)=>{
    console.log('Order-service DB is not connected',error)
  }

  
  )
function createOrder(products,userEmail){
   let total = 0
   for(let i = 0; i < products.length; i++){
       total += products[i].price
   }
   const newOrder = new Order ({
    products,
    user :userEmail,
    total_Price : total
   })
   newOrder.save();
}

  async function connect(){
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("ORDER")
  }
  connect().then(()=>{
    channel.consume("ORDER",(data)=>{
         console.log("Consuming order queue")
         const {products, userEmail} = JSON.parse(data.content)
         console.log(products)
         const newOrder = createOrder(products,userEmail)
         channel.ack(data)
         
         channel.sendToQueue(
          "PRODUCT",
          Buffer.from(JSON.stringify({newOrder}))
         )
    })
  })
   
 


app.listen(PORT,()=>{
    console.log(`Order-Service at ${PORT}`);
})
