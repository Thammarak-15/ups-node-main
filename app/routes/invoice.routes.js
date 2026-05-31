module.exports = app => {
    const invoice = require("../controllers/tax_invoice.controller");

    app.get("/taxInvoices", invoice.getAll);
    app.post("/taxInvoices", invoice.getTaxInvoice);
    app.post("/taxInvoices/insert", invoice.insertTax);
    app.post("/taxInvoices/delete_invoice_relate_cart", invoice.deleteInvoiceRrelateCart);
  };
  