const lazada_order = require("../models/lazada_order.model");

exports.getOrders = (req, res) => {
    lazada_order.getOrders(req, (err, data) => {
      if (err)
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving product."
        });
      else res.send(data);
    });
};

exports.getOrder = (req, res) => {
  lazada_order.getOrder(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getOrderItems = (req, res) => {
  lazada_order.getOrderItems(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getMultipleOrderItems = (req, res) => {
  lazada_order.getMultipleOrderItems(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};