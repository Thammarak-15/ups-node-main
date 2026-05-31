module.exports = app => {
    const orderController = require('../controllers/order.controller')
    app.post('/order/list_order_not_sent', orderController.listOrderNotSent)
}