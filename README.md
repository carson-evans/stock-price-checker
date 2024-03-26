# Stock Price Checker

## Overview
This project is a stock price checker that allows users to get stock prices from external APIs and track likes for each stock. Users can query single stocks or compare two stocks, with the option to 'like' them, tracking the number of likes per stock.

## Features
- **Get Stock Prices**: Users can send a GET request to `/api/stock-prices` with a query parameter for a NASDAQ stock symbol to retrieve the current price.
- **Like Stocks**: Users can also pass a `like` parameter to have their like added to the stock(s). The API ensures only 1 like per IP address is counted.
- **Compare Stocks**: When querying two stocks, the API returns information about both stocks, including the relative likes (`rel_likes`) showing the difference between the number of likes on both stocks.

## Technologies Used
- Node.js
- Express.js
- MongoDB + Mongoose
- Axios for external API requests

## Setup and Installation
1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-github-username/stock-price-checker.git
   ```
2. **Navigate to the directory**
   ```bash
   cd stock-price-checker
   ```
3. **Install Dependencies**
   ```bash
   npm install
   ```
4. **Set up Environment Variables**
   Create a `.env` file in the root directory and add the following variables:
   ```
   DB=<your_mongodb_connection_string>
   ```
5. **Start the Server**
   ```bash
   npm start
   ```
   Or, for development:
   ```bash
   npm run dev
   ```
