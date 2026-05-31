module.exports = app => {
    const product = require("../controllers/product.controller");

    // Retrieve all Products
    app.post("/products", product.findAll);
    app.post("/products/getCustom", product.getCustom);
    app.post("/products/upsert", product.upsertCustom);
    app.post("/products/delete", product.deleteCustom);
    app.post("/products/search", product.search);
    app.post("/products/getAllProductName", product.getAllProductName);
    app.post("/products/getCustomAllProduct", product.getCustomRuleAllProductList);
    app.post("/products/search_pagination", product.search_pag);
    app.post("/products/get_keyword_data", product.getProductBySKU)
};
