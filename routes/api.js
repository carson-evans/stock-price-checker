'use strict';
// https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/[symbol]/quote
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { query, validationResult } = require('express-validator')
const mongoose = require('mongoose');
mongoose.connect(process.env.DB)
const Schema = mongoose.Schema

async function getStockDataViaAPI(stock) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
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
    unique: true,
    uppercase: true
  },
  price: {
    type: Number
  },
  likes: {
    type: [String]
  }
})

const Stock = mongoose.model('Stock', stockSchema)

const findStock = async function (stock, price, addLike, userIp) {
  let condition = {
    stock: stock
  }
  // Need to handle timeout
  let update = {
    $setOnInsert: { stock: stock, price: price },
    ...(addLike && { $addToSet: { likes: userIp } }) // Add the user's IP to likes if addLike is true, avoiding duplicates
  };  
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

async function getStockData(stock, addLike, userIp) {
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

    const stock = typeof request.query.stock === 'string'
      ? request.query.stock.toUpperCase()
      : request.query.stock.map(s => s.toUpperCase());

    let addLike = false;
    if (request.query.like == 'true' || request.query.like == 1) {
      addLike = true;
    }
    const userIp = request.ip;
    const result = await getStockData(stock, addLike, userIp);
    response.json(result)
  })
};
