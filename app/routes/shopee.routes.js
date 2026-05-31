module.exports = app => {
    const shopee = require("../controllers/shopee.controller");

    app.post("/shopee/getShopInfo", shopee.getShopInfo);
    app.post("/shopee/getAuth", shopee.getAuth);
    app.post("/shopee/getAccessToken", shopee.getAccessToken);
    app.get("/shopee/getItemList", shopee.getItemList);
    app.post("/shopee/autoMapProductBySKU", shopee.autoMapProductBySKU);
    app.post("/shopee/mapProduct_UPS_with_shopee", shopee.mapProduct_UPS_with_shopee);
    app.post("/shopee/selectProductToUpdateStock", shopee.selectProductToUpdateStock);
    app.post("/shopee/updateStock", shopee.updateStock);
    app.post("/shopee/listProductMap", shopee.listProductMap);
    app.post("/shopee/listProductNotMap", shopee.listProductNotMap);
    app.post("/shopee/listProductBeforeSyncStock", shopee.listProductBeforeSyncStock);
    app.post("/shopee/listProductUPSNotMap", shopee.listProductUPSNotMap);
};