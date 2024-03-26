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
    type: Number,
    default: 0
  }
})

const Stock = mongoose.model('Stock', stockSchema)

// Example schema for tracking user likes
const userLikeSchema = new mongoose.Schema({
  stock: String,
  ip: String,
});

const UserLike = mongoose.model('UserLike', userLikeSchema);

const findStock = async function (stock, price, addLike, userIp) {
  let stockUpdate = {
    $setOnInsert: { stock: stock, price: price }
  };

  // Ensure stock exists with provided price or upsert it
  const stockResult = await Stock.findOneAndUpdate({ stock: stock }, stockUpdate, {
    new: true,
    upsert: true
  });

  if (addLike) {
    // Check if the IP already liked the stock
    const likeExists = await UserLike.findOne({ stock: stock, ip: userIp });

    if (!likeExists) {
      // Record the like to prevent future duplicates from the same IP
      await new UserLike({ stock: stock, ip: userIp }).save();

      await Stock.updateOne({ stock: stock }, { $inc: { likes: 1 } });
    }
  }

  // Return the updated stock document
  return await Stock.findOne({ stock: stock });
};

async function getStockData(stock, addLike, userIp) {
  let result = {};
  if (Array.isArray(stock) && stock.length == 2) {
    let stockData = [];
    for (let i = 0; i < stock.length; i++) {
      const target_stock = stock[i];
      try {
        const record = await getStockDataViaAPI(target_stock);
        const dbResult = await findStock(target_stock, record.latestPrice, addLike, userIp);
        stockData.push({ stock: dbResult.stock, price: dbResult.price, likes: dbResult.likes });
      } catch (error) {
        console.error(error);
      }
    }
    // Calculate rel_likes based on the actual number of likes
    let diff = stockData[0].likes - stockData[1].likes;
    stockData[0].rel_likes = diff;
    stockData[1].rel_likes = -diff;
    result.stockData = [stockData[0], stockData[1]];
  } else {
    try {
      const record = await getStockDataViaAPI(stock);
      const dbResult = await findStock(stock, record.latestPrice, addLike, userIp);
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
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.json({ errors: errors.array() });
    }

    const stock = typeof request.query.stock === 'string'
      ? request.query.stock.toUpperCase()
      : request.query.stock.map(s => s.toUpperCase());

    let addLike = false;
    if (request.query.like === 'true' || request.query.like === '1') {
      addLike = true;
    }
    const userIp = request.ip;
    try {
      const result = await getStockData(stock, addLike, userIp);
      if (Array.isArray(result.stockData)) {
        result.stockData.forEach(stockData => {
          stockData.rel_likes = stockData.rel_likes || 0;
        });
      } else {
        result.stockData.likes = result.stockData.likes || 0;
      }
      response.json(result);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
};
