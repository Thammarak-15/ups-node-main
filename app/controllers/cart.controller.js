const Cart = require("../models/cart.model");

// Retrieve all Product from the database.
exports.frontendLocalStorageDetailCart = (req, res) => {
  Cart.frontendLocalStorageDetailCart(req.body ,(err, data,code,result,message) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send({data:data,code:code,result:result,message:message});
  });
};

// Retrieve all Product from the database.
exports.frontendLocalStorageGetCart = (req, res) => {
  Cart.frontendLocalStorageGetCart(req.body ,(err, data,code,result,message) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send({data:data,code:code,result:result,message:message});
  });
};

// Retrieve all Product from the database.
exports.frontendLocalStorageCreateOrder = (req, res) => {
  Cart.frontendLocalStorageCreateOrder(req.body ,(err, data,code,result,message) => {
    if (err)
      return res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else return res.send({data:data,code:code,result:result,message:message});
  });
};