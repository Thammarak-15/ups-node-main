const Search = require("../models/search.model");

exports.searchBarProduct = (req, res) => {
  Search.searchBarProduct(req.body.begin_search_type, req.body.begin_search_details, req.body.extra_filters, req.body.search_category_from_result, req.body.search_industry_from_result, req.body.search_brand_from_result, req.body.seller_shop_id, req.body.token, req.body.role_user, req.body.order_by_price, req.body.order_by_sku,req.body.page,req.body.limit, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.searchBarProductnew = (req, res) => {
  Search.searchBarProductnew(req.body.begin_search_type, req.body.begin_search_details, req.body.extra_filters, req.body.search_category_from_result, req.body.search_industry_from_result, req.body.search_brand_from_result, req.body.seller_shop_id, req.body.token, req.body.role_user, req.body.order_by_price, req.body.order_by_sku,req.body.page,req.body.limit, (err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.searchProduct = (req, res) => {
  Search.searchProduct(req.body, (err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.recommendProduct = (req, res) => {
  Search.recommendProduct(req.body.begin_search_type, req.body.begin_search_details, req.body.extra_filters, req.body.search_category_from_result, req.body.search_industry_from_result, req.body.search_brand_from_result, req.body.seller_shop_id, req.body.token, req.body.role_user, req.body.order_by_price, req.body.order_by_sku, (err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};