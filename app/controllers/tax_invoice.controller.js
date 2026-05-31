const Invoice = require("../models/tax_invoice.model");

// Retrieve all from the database.
exports.getAll = (req, res) => {
  Invoice.getAll((err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.getTaxInvoice = (req, res) => {
  Invoice.getTaxInvoice(req.body.role, req.body.token, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.insertTax = (req, res) => {
    Invoice.insertTaxInvoice(req.body.name, req.body.address, req.body.postal_code, req.body.province, req.body.district, req.body.sub_district, req.body.tax_id, req.body.token, req.body.role, req.body.seller_shop_id, req.body.seller_shop_id_data, req.body.user_type, (err, data) => {
      if (err)
        res.status(500).send({
          message:
            { ok: "n", error: err.message }
        });
      else res.send({
          message:
            { ok: "y", data: data }
        });
    });
};
exports.deleteInvoiceRrelateCart = (req, res) => {
  Invoice.deleteInvoiceRrelateCart(req.body.cart_id, req.body.invoice_id, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send({
        message:
          { ok: "y", data: data }
      });
  });
};
/*
exports.insertTaxInvoice = (req, res) => {
    Invoice.insertTaxInvoice(req.body.name, req.body.address, req.body.postal_code, req.body.province, req.body.district, req.body.sub_district, req.body.tax_id, req.body.buyer_id, req.body.buyer_one_id, req.body.seller_shop_id, req.body.seller_shop_id_data, (err, data) => {
      if (err)
        res.status(500).send({
          message:
            { ok: "n", error: err.message }
        });
      else res.send(data);
    });
};*/