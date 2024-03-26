const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server.js");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  // test Viewing one stock: GET request to /api/stock-prices/
  test("Viewing one stock: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/")
      .query({ stock: "goog" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        done();
      });
  });

  // test Viewing one stock and liking it: GET request to /api/stock-prices/
  test("Viewing one stock and liking it: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/")
      .query({ stock: "goog", like: "true" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.equal(res.body.stockData.likes, 1);
        done();
      });
  });

  // test Viewing the same stock and liking it again: GET request to /api/stock-prices/
  test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/")
      .query({ stock: "goog", like: "true" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.equal(res.body.stockData.likes, 1);
        done();
      });
  });

  //test Viewing two stocks: GET request to /api/stock-prices/
  test("Viewing two stocks: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/")
      .query({ stock: ["goog", "msft"] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData[0].stock, "GOOG");
        assert.equal(res.body.stockData[1].stock, "MSFT");
        done();
      });
  });

  // test Viewing two stocks and liking them: GET request to /api/stock-prices/
  test("Viewing two stocks and liking them: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/")
      .query({ stock: ["goog", "msft"], like: "true" })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData[0].stock, "GOOG");
        assert.equal(res.body.stockData[0].rel_likes, 0);
        assert.equal(res.body.stockData[1].stock, "MSFT");
        assert.equal(res.body.stockData[1].rel_likes, 0);
        done();
      });
  });
});