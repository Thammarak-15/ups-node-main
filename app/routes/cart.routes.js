module.exports = app => {
    const cart = require("../controllers/cart.controller");

    // Retrieve all Products
    app.post("/localstoragecart/frontendLocalStorageDetailCart", cart.frontendLocalStorageDetailCart);
    app.post("/localstoragecart/frontendLocalStorageGetCart", cart.frontendLocalStorageGetCart);
    app.post("/localstoragecart/frontendLocalStorageCreateOrder", cart.frontendLocalStorageCreateOrder);

  };