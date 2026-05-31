const productKeywordController = require('../controllers/product_keyword.conntroller')
module.exports = app => {
    app.post('/product/product_keyword/add', productKeywordController.create)
    app.post('/product/product_keyword/edit', productKeywordController.edit)
}