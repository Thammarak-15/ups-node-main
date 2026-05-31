const shopee = require("../models/shopee.model");

exports.getShopInfo = (res) => {
    shopee.getShopInfo((err, data) => {
      if (err)
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving product."
        });
      else res.send(data);
    });
};

exports.getAuth = (req, res) => {
  shopee.getAuth(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getAccessToken = (req, res) => {
  shopee.getAccessToken(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getItemList = (req, res) => {
  shopee.getItemList(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.autoMapProductBySKU = (req, res) => {
  shopee.autoMapProductBySKU(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.mapProduct_UPS_with_shopee = (req, res) => {
  shopee.mapProduct_UPS_with_shopee(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.selectProductToUpdateStock = (req, res) => {
  shopee.selectProductToUpdateStock(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.updateStock = (req, res) => {
  shopee.updateStock(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.listProductMap = (req, res) => {
  shopee.listProductMap(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.listProductNotMap = (req, res) => {
  shopee.listProductNotMap(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.listProductBeforeSyncStock = (req, res) => {
  shopee.listProductBeforeSyncStock(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.listProductUPSNotMap = (req, res) => {
  shopee.listProductUPSNotMap(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};