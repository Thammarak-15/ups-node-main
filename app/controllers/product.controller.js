const Product = require("../models/product.model");

// Retrieve all Product from the database.
exports.findAll = (req, res) => {
  Product.getAll((err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getCustom = (req, res) => {
  Product.getCustomRuleProductList(req.body.custom_user_ID, req.body.what_component, req.body.component_ID, req.body.extra_query_rule, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.upsertCustom = (req, res) => {
  Product.upsertCustomRuleProductList(req.body.custom_user_ID, req.body.what_component, req.body.component_ID, req.body.product_array, req.body.token, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.deleteCustom = (req, res) => {
  Product.deleteCustomRuleProductList(req.body.custom_user_ID, req.body.what_component, req.body.component_ID, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.search = (req, res) => {
  Product.search(req.body.begin_search_type, req.body.begin_search_details, req.body.extra_filters, req.body.search_category_from_result, req.body.search_industry_from_result, req.body.search_brand_from_result, req.body.seller_shop_id, req.body.token, req.body.role_user, req.body.order_by_price, req.body.order_by_sku, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

// Retrieve all Product Name from the database.
exports.getAllProductName = (req, res) => {
  Product.getAllProductName((err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getCustomRuleAllProductList = (req, res) => {
  Product.getCustomRuleAllProductList(req.body.custom_user_ID, req.body.what_component, req.body.component_ID, req.body.extra_query_rule, req.body.token, req.body.role_user, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.search_pag = (req, res) => {
  Product.search_pag(req.body.begin_search_type, req.body.begin_search_details, req.body.extra_filters, req.body.search_category_from_result, req.body.search_industry_from_result, req.body.search_brand_from_result, req.body.seller_shop_id, req.body.token, req.body.role_user, req.body.order_by_price, req.body.order_by_sku, req.body.page, req.body.page_type, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getProductBySKU = (req, res) => {
  Product.getProductBySKU(req.body.sku, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};
