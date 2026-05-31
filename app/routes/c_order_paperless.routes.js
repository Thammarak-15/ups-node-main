module.exports = app => {
    const c_order_paperless = require("../controllers/c_order_paperless.controller");

    // Retrieve all Products
    app.get("/get/c_order_paperless", c_order_paperless.getAll);
    app.post("/get/c_order_paperless", c_order_paperless.getDataAndGenExcel);
};