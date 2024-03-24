const mongoose = require('mongoose');
const { Schema } = mongoose;

const stockSchema = new Schema({
    symbol: { type: String, required: true, uppercase: true },
    likes: { type: [String], default: [] },
});

const Stock = mongoose.model("Stock", stockSchema);

exports.Stock = Stock;
