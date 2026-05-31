module.exports = app => {
    const generateExcel = require("../controllers/generateExcel.controller");

    app.post("/generate/excel/ups", generateExcel.generateExcel);
    app.get("/generate/excel/order_not_sent", generateExcel.generateExcelForOrder)
    app.post("/generate/excel/order_detail", generateExcel.exportExcelOrderDetail);
};