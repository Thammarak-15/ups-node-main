module.exports = app => {
  const search = require('../controllers/search.controller')

  app.post('/search/product/search_bar', search.searchBarProduct)
  app.post('/search/product/search_bar2', search.searchBarProductnew)
  app.post('/search/product/search_product', search.searchProduct)
  app.post('/search/product/recommend', search.recommendProduct)

}
