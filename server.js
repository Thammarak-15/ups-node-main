const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const mongoose = require('mongoose')
const app = express();
var cors = require('cors')
app.use(cors())
app.use(express.static(__dirname + '/public'));

const path = require('path');
const publicPathPdf = path.join(__dirname, '/public/pdf');
require('dotenv').config()

// mongoose.connect(`mongodb://${process.env.DB_MONGOHOST}:${process.env.DB_MONGOPORT}/${process.env.DB_MONGODBNAME}`, {
//     user: process.env.DB_MONGOUSERNAME,
//     pass: process.env.DB_MONGOPASSWORD,
//     useUnifiedTopology: true,
//     useNewUrlParser: true
// }).then(() => {
//     console.log('MongoDB connected.')
// }).catch(err => {
//     console.log(err);
// })

// Remove files in public/pdf every hour.
setInterval(function () {
  fs.readdir(publicPathPdf, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(publicPathPdf, file), err => {
        if (err) throw err;
      });
    }
  });
}, 1000 * 60 * 60);

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to application." });
});

connectionCount = 0

app.get("/promMetrics", (req, res) => {
  toRet = "backend2_up 1" + "\n" +
    "backend2_connection_count " + connectionCount + "\n"

  res.type('text/plain')
  res.status(200).send(toRet)
  return
});

app.all('/*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

require("./app/routes/product.routes")(app);
require("./app/routes/invoice.routes")(app);
require("./app/routes/web_stat.routes")(app);
require("./app/routes/product_tag.routes")(app);
require("./app/routes/flash.routes")(app);
require("./app/routes/search.routes")(app);
require("./app/routes/cart.routes")(app);

require("./app/routes/callbacklazada.routes")(app);
require("./app/routes/lazada.routes")(app);
require("./app/routes/shopee.routes")(app);
require("./app/routes/lazada_order.routes")(app);
require("./app/routes/generateExcel.routes")(app);
require("./app/routes/c_order_paperless.routes")(app);
require('./app/routes/order.routes')(app)
require('./app/routes/product_keyword.routes')(app);
require('./app/routes/news_activity_keyword.routes')(app);
require('./app/routes/test_function.routes')(app);

if (!fs.existsSync("./logs")) {
  fs.mkdirSync("./logs");
}

// set port, listen for requests
const PORT = process.env.PORT || 3000;
if (!fs.existsSync("./public/pdf")) {
  fs.mkdirSync("./public/pdf", { recursive: true });
}
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
}).on('connection', function (socket) {
  connectionCount++;

  socket.on('close', function () {
    connectionCount--;
  })

});
