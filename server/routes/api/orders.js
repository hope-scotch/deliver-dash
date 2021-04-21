const Product = require('../../models/Product')
const Order = require('../../models/Order')

const express = require('express')
const router = express.Router()

// View all orders to be delivered // Delivery Guy
router.get('/api/:id/orders', async (req, res) => {
  try {
    const deliveryGuyId = req.params.id
    console.log(deliveryGuyId)
    
    const orders = await Order.find({ deliveryGuyId })
    
    res.status(200).send(orders)
  } catch(e) {
    res.status(400).send()
  }
})

// View orders placed / sold
router.get('/api/:type/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    const type = req.params.type
    
    // let orders = []

    // if (type === 'Retailer' || type === 'Wholesaler')
    //   orders = Order.find({ fromId: userId })

    // if (type === 'Customer' || type === 'Retailer' )
    //   orders = Order.find({ toId: userId })

    const orders = Order.find({ _id: orderId })
    res.status(200).send(orders)
  } catch(e) {
    res.status(400).send()
  }
})

module.exports = router