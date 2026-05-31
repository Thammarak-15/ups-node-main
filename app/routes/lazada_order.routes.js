module.exports = app => {
    const lazada_order = require("../controllers/lazada_order.controller");

    // Retrieve all Products
    app.post("/lazada/orders/get", lazada_order.getOrders);
    app.post("/lazada/order/get", lazada_order.getOrder)
    app.post("/lazada/order/items/get", lazada_order.getOrderItems)
    app.post("/lazada/orders/items/get", lazada_order.getMultipleOrderItems)
};