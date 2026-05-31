const Product_Tag = require("../models/product_tag.model");

// Retrieve all Tags from the database.
exports.listAllTags = (req, res) => {
  Product_Tag.listAllTags( (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving product tag."
      });
    else res.send(data);
  });
};

exports.createNewTag = (req, res) => {
  Product_Tag.createNewTag(req.body.token, req.body.name, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.searchTagsByString = (req, res) => {
  Product_Tag.searchTagsByString(req.body.partialSearchStr, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.manageTagHidden = (req, res) => {
  Product_Tag.manageTagHidden(req.body.token, req.body.id, req.body.hidden, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.getTagByID = (req, res) => {
  Product_Tag.getTagByID(req.body.id, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.getTagByName = (req, res) => {
  Product_Tag.getTagByName(req.body.name, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.editTag = (req, res) => {
  Product_Tag.editTag(req.body.token, req.body.id, req.body.newName, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.upsertTagsOfProduct = (req, res) => {
  Product_Tag.upsertTagsOfProduct(req.body.token, req.body.product_id, req.body.tag_id_array, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.upsertTagsOfProductByString = (req, res) => {
  Product_Tag.upsertTagsOfProductByString(req.body.token, req.body.product_id, req.body.tag_string_array, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.getAllTagsOfProduct = (req, res) => {
  Product_Tag.getAllTagsOfProduct(req.body.product_id, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.getAllProductsOfTag = (req, res) => {
  Product_Tag.getAllProductsOfTag(req.body.tag_id, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

exports.upsertTagsOfProduct = (req, res) => {
  Product_Tag.upsertTagsOfProduct(req.body.token, req.body.product_id, req.body.tag_id_array, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          { ok: "n", error: err.message }
      });
    else res.send(data);
  });
};

function testToken(  ){
	
}