const callback = require("../models/callback.model");

exports.callbacklazada = (req, res) => {
    callback.callbacklazada(req, (err, data) => {
      if (err)
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving product."
        });
      else res.send(data);
    });
  };