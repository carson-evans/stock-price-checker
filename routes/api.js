'use strict';

// https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote

// use body-parser to hanle request parameter
// const bodyParser = require('body-parser');

/*

Expected result:
/api/stock-prices?stock=GOOG
/api/stock-prices?stock=GOOG&like=true
/api/stock-prices?stock=GOOG&stock=MSFT
/api/stock-prices?stock=GOOG&stock=MSFT&like=true

*/

// read configuration from .env file
require('dotenv').config();

// for sanitize
const {
  query,
  validationResult
} = require('express-validator')

// for MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.DB)
const Schema = mongoose.Schema

// use axios to send request to get stock information
const axios = require('axios');

async function getStockDataViaAPI(stock) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(error);
    // return empty data
    return {};
  }
}

// stockSchema
const stockSchema = new Schema({
  stock: {
    type: String,
    unique: true
  },
  price: {
    type: Number
  },
  likes: {
    type: Number
  }
})

const Stock = mongoose.model('Stock', stockSchema)

const findStock = async function (stock, price, addLike) {
  let condition = {
    stock: stock
  }
  // Need to handle timeout
  let update = { price: price }
  const result = await Stock.findOneAndUpdate(condition, update, {
    new: true,
    upsert: true // Make this update into an upsert
  });

  if (result.likes == null) {
    result.likes = 0;
  }

  if (addLike) {
    result.likes = result.likes + 1;
  }
  await result.save()
  return result
}

async function getStockData(stock, addLike) {
  let result = {};
  if (Array.isArray(stock) && stock.length == 2) {
    let stockData = [];
    for (let i = 0; i < stock.length; i++) {
      const target_stock = stock[i]
      try {
        const record = await getStockDataViaAPI(target_stock)
        const dbResult = await findStock(target_stock, record.latestPrice, addLike);
        stockData.push({ stock: dbResult.stock, price: dbResult.price, likes: dbResult.likes });
      } catch (error) {
        console.error(error);
      }
    }
    let diff = stockData[0].likes - stockData[1].likes;
    if (diff > 0) {
      stockData[0].rel_likes = diff;
      stockData[1].rel_likes = 0 - diff;
    } else {
      stockData[0].rel_likes = 0 - diff;
      stockData[1].rel_likes = diff;
    }
    delete stockData[0].likes;
    delete stockData[1].likes;
    result.stockData = [stockData[0], stockData[1]];
  } else {
    try {
      const record = await getStockDataViaAPI(stock);
      const dbResult = await findStock(stock, record.latestPrice, addLike);
      result.stockData = { stock: dbResult.stock, price: dbResult.price, likes: dbResult.likes };
    } catch (error) {
      console.error(error);
    }
  }
  return result;
}

module.exports = function (app) {
  app.get('/api/stock-prices', [
    query('stock').not().isEmpty().escape(),
    query('like').optional({ nullable: true }).escape()
  ], async (request, response) => {

    // check Validation
    const errors = validationResult(request)
    if (!errors.isEmpty()) {
      return response.json({ errors: errors.array() })
    }

    const stock = request.query.stock
    let addLike = false;
    if (request.query.like == 'true' || request.query.like == 1) {
      addLike = true;
    }
    const result = await getStockData(stock, addLike);
    response.json(result)
  })
};
