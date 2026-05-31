module.exports = app => {
    const callback = require("../controllers/callbacklazada.controller");

    // Retrieve all Products
    app.get("/callbacklazada", callback.callbacklazada);
  };
  