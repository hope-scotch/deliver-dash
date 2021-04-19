import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { geocode } from '../geocode.js'
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
import 'mapbox-gl/dist/mapbox-gl.css'
import CartItem from './CartItem'
import Map from '../Map.js';

const Cart = ({ type, id, cartTotal, setCartTotal }) => {
  const [products, setProducts] = useState([])
  const [forceRenderCart, setForceRenderCart] = useState(true);
  const [loaded, setLoaded] = useState(false)
  const [markerLocs, setMarkerLocs] = useState([])

  const genDist = async (lat1,long1,lat2,long2) => {
    let data = await axios({ url: `/routing/1/calculateRoute/${lat1}%2C${long1}%3A${lat2}%2C${long2}/json?avoid=unpavedRoads&key=VymSTXq7CYyeq7mL4y8ejjdJNA4RXle0`, baseURL: 'https://api.tomtom.com' })
    
    const dist = data.data.routes[0].legs[0].summary.lengthInMeters
    return dist
  }

  const getCartItems = async () => {
    try {
      const cartItems = await axios({ url: `/api/${type}/cart/${id}`, baseURL: 'http://localhost:5000' })

      let mlocs = []
      let cartProducts = []
      cartTotal = 0
      for(var i = 0; i < cartItems.data.length; i++){
        let item = cartItems.data[i]
        const { data } = await axios({ url: `/api/products/${item.productId}`, baseURL: 'http://localhost:5000' })
        cartProducts.push({...data, quantity: item.quantity})
        cartTotal += item.quantity
        setCartTotal(cartTotal)


        const { data : seller } = await axios({ url: `/api/getuser/${data.owner}`, baseURL: 'http://localhost:5000' })

        const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+ encodeURIComponent(seller.location) + '.json?access_token=pk.eyJ1IjoiaG9wZS1zY290Y2giLCJhIjoiY2tiaHduYnRlMDlsOTJxbWJsMTg5aHlsOSJ9.S92DKT4JNJ8jkzD4KQdsGw&limit=1'

        const {data : coordinates} = await axios({url: url})
        let lat = coordinates.features[0].center[1]
        let long = coordinates.features[0].center[0]
        let loc = coordinates.features[0].place_name
        
        // console.log(markerLocs)
        mlocs.push([long,lat,loc])
      }
      setMarkerLocs(mlocs)
      setProducts(cartProducts)
      setLoaded(true)

    } catch (error) {
      console.log("Error",error)
    }
  }

  const orderAll = async () => {
    try {
      let body = {}
      let deliveryGuy  = {}
      let deliveryPersons = await axios({ url: `/api/Delivery/all`, baseURL: 'http://localhost:5000' })
      
      for(var j = 0; j < products.length; j++){

        let product = products[j]
        
        let retailer = await axios({ url: `/api/getuser/${product.owner}`, baseURL: 'http://localhost:5000' })
        
        let minDist = 100000000, minDeliveryId = ''

        for(let i = 0; i < deliveryPersons.data.length; i++) {
          let deliveryPerson = deliveryPersons.data[i]
          let lat1,long1,lat2,long2

          const url1 = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+ encodeURIComponent(deliveryPerson.location) + '.json?access_token=pk.eyJ1IjoiaG9wZS1zY290Y2giLCJhIjoiY2tiaHduYnRlMDlsOTJxbWJsMTg5aHlsOSJ9.S92DKT4JNJ8jkzD4KQdsGw&limit=1'
          const url2 = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+ encodeURIComponent(retailer.data.location) + '.json?access_token=pk.eyJ1IjoiaG9wZS1zY290Y2giLCJhIjoiY2tiaHduYnRlMDlsOTJxbWJsMTg5aHlsOSJ9.S92DKT4JNJ8jkzD4KQdsGw&limit=1'

          const {data: data1} = await axios({url: url1})
          lat1 = data1.features[0].center[1]
          long1 = data1.features[0].center[0]
          
          const {data: data2} = await axios({url: url2})
          lat2 = data2.features[0].center[1]
          long2 = data2.features[0].center[0]
        
            
          let dist = await genDist(lat1,long1,lat2,long2)

          if(dist < minDist){
            minDist = dist
            minDeliveryId = deliveryPerson._id
          }
        }

        console.log(minDeliveryId,minDist)
        deliveryGuy[product._id] = minDeliveryId
      }

      body["deliveryGuy"] = deliveryGuy
      let buyCart = await axios({ method: "patch", url: `/api/${type}/buy/${id}`, baseURL: 'http://localhost:5000', data: body })
      console.log(buyCart)
      setForceRenderCart(!forceRenderCart)
    } catch (error) {
      console.log("Error",error)
    }
  }

  useEffect(() => {

    getCartItems()
  }, [forceRenderCart])

  
  return (
    <div 
        style={{
            display: 'flex', 
            flexDirection: 'column',
        }}>
          <Map markerLocs = {markerLocs} />
      {loaded && products.map((product, index) =>{
              return <CartItem
              product={product}
              key={index}
              type={type}
              id={id}
              cartTotal = {cartTotal}
              setCartTotal = {setCartTotal}
              forceRenderCart = {forceRenderCart}
              setForceRenderCart = {setForceRenderCart}
              />
            }
            )
        }



        <button style={{backgroundColor:'yellow',marginTop:'50px'}} onClick = {orderAll}>Order All</button>
    </div>
  )
}

export default Cart
