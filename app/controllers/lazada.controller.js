const lazada = require("../models/lazada.model");

exports.getProducts = (req, res) => {
    lazada.getProducts(req, (err, data) => {
      if (err)
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving product."
        });
      else res.send(data);
    });
};

exports.createProduct = (req, res) => {
  lazada.createProduct(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.updateProduct = (req, res) => {
  lazada.updateProduct(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.updateStock = (req, res) => {
  lazada.updateStock(req, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      });
    else res.send(data);
  });
};

exports.syncProduct = (req, res) => {
  lazada.syncProduct(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.getCategorySuggestion = (req, res) => {
  lazada.getCategorySuggestion(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.getAllCategory = (req, res) => {
  lazada.getAllCategory(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.GetCategoryAttributes = (req, res) => {
  lazada.GetCategoryAttributes(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.getAccessToken = (req, res) => {
  lazada.getAccessToken(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.mapProduct_UPS_with_lazada = (req, res) => {
  lazada.mapProduct_UPS_with_lazada(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.autoMapProductBySKU = (req, res) => {
  lazada.autoMapProductBySKU(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.selectProductToUpdateStock = (req, res) => {
  lazada.selectProductToUpdateStock(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.listProductMap = (req, res) => {
  lazada.listProductMap(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.listProductNotMap = (req, res) => {
  lazada.listProductNotMap(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.listProductBeforeSyncStock = (req, res) => {
  lazada.listProductBeforeSyncStock(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}

exports.listProductUPSNotMap = (req, res) => {
  lazada.listProductUPSNotMap(req, (err, data) => {
    if(err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product."
      })
    else res.send(data);
  })
}