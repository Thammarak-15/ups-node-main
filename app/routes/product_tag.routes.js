module.exports = app => {
    const product_tag = require("../controllers/product_tag.controller");

    // Retrieve all Products
    app.post("/productTag/listAllTags", product_tag.listAllTags);
    app.post("/productTag/createNewTag", product_tag.createNewTag);
    app.post("/productTag/manageTagHidden", product_tag.manageTagHidden);
    app.post("/productTag/getTagByID", product_tag.getTagByID);
	app.post("/productTag/getTagByName", product_tag.getTagByName);
    app.post("/productTag/editTag", product_tag.editTag);
	app.post("/productTag/upsertTagsOfProduct", product_tag.upsertTagsOfProduct);
	app.post("/productTag/upsertTagsOfProductByString", product_tag.upsertTagsOfProductByString);
	app.post("/productTag/searchTagsByString", product_tag.searchTagsByString);
	app.post("/productTag/getAllTagsOfProduct", product_tag.getAllTagsOfProduct);
	app.post("/productTag/getAllProductsOfTag", product_tag.getAllProductsOfTag);
  };
  