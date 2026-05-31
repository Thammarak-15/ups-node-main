module.exports = app => {
    const lazada = require("../controllers/lazada.controller");

    // Retrieve all Products
    app.post("/lazada/getProducts", lazada.getProducts);
    app.post("/lazada/createProduct", lazada.createProduct);
    app.post("/lazada/updateProduct", lazada.updateProduct);
    app.post("/lazada/updateStock", lazada.updateStock);
    app.post("/lazada/syncProduct", lazada.syncProduct);
    app.post("/lazada/getCategorySuggestion", lazada.getCategorySuggestion);
    app.post("/lazada/getAllCategory", lazada.getAllCategory);
    app.post("/lazada/GetCategoryAttributes", lazada.GetCategoryAttributes);
    app.post("/lazada/getAccessToken", lazada.getAccessToken);
    app.post("/lazada/mapProduct_UPS_with_lazada", lazada.mapProduct_UPS_with_lazada);
    app.post("/lazada/autoMapProductBySKU", lazada.autoMapProductBySKU);
    app.post("/lazada/selectProductToUpdateStock", lazada.selectProductToUpdateStock);
    app.post("/lazada/listProductMap", lazada.listProductMap);
    app.post("/lazada/listProductNotMap", lazada.listProductNotMap);
    app.post("/lazada/listProductBeforeSyncStock", lazada.listProductBeforeSyncStock);
    app.post("/lazada/listProductUPSNotMap", lazada.listProductUPSNotMap);
};