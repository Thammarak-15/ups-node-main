const sql = require("./db.js");
const mongodb = require("../config/mongodb.js");
const util = require("util");
const {parse} = require("path");
const {json} = require("body-parser");
const {ShF_log_to_file} = require("../share_function/log_file");
const {Console} = require("console");
const crypto = require("crypto");
var sha256 = require("js-sha256");
const axios = require("axios");
const qs = require("qs");
const fs = require("fs");
const path = require("path");
const publicPathPdf = path.join(__dirname, "../../public/pdf/");
const mongoose_model_company_and_staff = require("../mongooseSchema/C_company_and_staff");
const pdf2img = require('pdf-img-convert');
//const mailer = require('../share_function/mailer')
const { sendEmail } = require("../share_function/mailer")
//var nodemailer = require('nodemailer');

// console.log(publicPathPdf)

const query = util.promisify(sql.query).bind(sql);

// constructor
const FlashOrder = function (FlashOrder) {
    this.pno = FlashOrder.pno;
    this.mchId = FlashOrder.mchId;
    this.outTradeNo = FlashOrder.outTradeNo;
    this.sortCode = FlashOrder.sortCode;
    this.lineCode = FlashOrder.lineCode;
    this.sortingLineCode = FlashOrder.sortingLineCode;
    this.dstStoreName = FlashOrder.dstStoreName;
    this.earlyFlightEnabled = FlashOrder.earlyFlightEnabled;
    this.packEnabled = FlashOrder.packEnabled;
    this.upcountry = FlashOrder.upcountry;
    this.upcountryAmount = FlashOrder.upcountryAmount;
    this.upcountryCharge = FlashOrder.upcountryCharge;
    this.sameProvince = FlashOrder.sameProvince;
};

const FlashWebHook = function (FlashWebHook) {
    this.id = FlashWebHook.id;
    this.flwh_mchId = FlashWebHook.flwh_mchId;
    this.flwh_nonceStr = FlashWebHook.flwh_nonceStr;
    this.flwh_sign = FlashWebHook.flwh_sign;
    this.flwh_status_data = FlashWebHook.flwh_status_data;
    this.flwh_weight_data = FlashWebHook.flwh_weight_data;
    this.flwh_price_data = FlashWebHook.flwh_price_data;
    this.flwh_courier_data = FlashWebHook.flwh_courier_data;
    this.flwh_status_state = FlashWebHook.flwh_status_state;
    this.flwh_courier_status = FlashWebHook.flwh_courier_status;
};

FlashOrder.createOrder = async (req, result) => {
    let timenow = Date.now();
    let Login = await isLogin(req.token);
    let finalBodytoCreateFlashOrder;
    let reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoCreateFlashOrder = reqObject;
    finalBodytoCreateFlashOrder = await objectSortByKey(
        finalBodytoCreateFlashOrder
    );
    let post_string = await buildRequestParam(finalBodytoCreateFlashOrder);

    const response = await axios.post(
        process.env.FLASH_URL + "/open/v3/orders",
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );
    if (response.data.message == "success") {
        const resultQuery = await query(
            "INSERT INTO `flash_order` (pno, mchId, outTradeNo, expressCategory, sortCode, srcName, srcPhone, srcProvinceName, srcCityName, srcPostalCode, srcDetailAddress, dstStoreName, dstName, dstPhone, dstProvinceName, dstCityName, dstPostalCode, dstDetailAddress, articleCategory, weight,insured,codEnabled,estimate_price, remark,transaction_status) VALUES(?)",
            [
                [
                    response.data.data.pno,
                    response.data.data.mchId,
                    response.data.data.outTradeNo,
                    reqObject.expressCategory,
                    response.data.data.sortCode,
                    reqObject.srcName,
                    reqObject.srcPhone,
                    reqObject.srcProvinceName,
                    reqObject.srcCityName,
                    reqObject.srcPostalCode,
                    reqObject.srcDetailAddress,
                    response.data.data.dstStoreName,
                    reqObject.dstName,
                    reqObject.dstPhone,
                    reqObject.dstProvinceName,
                    reqObject.dstCityName,
                    reqObject.dstPostalCode,
                    reqObject.dstDetailAddress,
                    reqObject.articleCategory,
                    reqObject.weight,
                    reqObject.insured,
                    reqObject.codEnabled,
                    reqObject.estimate_price,
                    reqObject.remark,
                    "Success",
                ],
            ]
        );
        console.log("inserted data : ", resultQuery)

        sql.query(
            "INSERT INTO `flash_order_webhook_status` (order_number, pno, state) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE state = ?",
            [response.data.data.outTradeNo, response.data.data.pno, 0, 0]
        );
    }

    result(null, response.data);
};

FlashOrder.cancelOrder = async (req, result) => {
    let pno = req.pno;
    let finalBodytoCancelFlashOrder;
    let reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoCancelFlashOrder = reqObject;
    finalBodytoCancelFlashOrder = await objectSortByKey(
        finalBodytoCancelFlashOrder
    );
    let post_string = await buildRequestParam(finalBodytoCancelFlashOrder);

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/${pno}/cancel`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );

    if (response.data.message == "success") {
        const resultQuery = await query(
            `UPDATE flash_order SET transaction_status = 'Cancel' WHERE pno = ?`,
            req.pno
        );
        // console.log("cancle data : ", resultQuery)
    }

    result(null, response.data);
};

FlashOrder.trackingOrder = async (req, result) => {
    let Login = await isLogin(req.token);
    let pno = req.pno;
    let finalBodytoGetTrackingOrder;
    let reqObject = req;
    if (!req.pno || !req.mchId) {
        result({message: "Invalid Request"}, null);
        return;
    }
    delete reqObject.pno;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetTrackingOrder = reqObject;
    finalBodytoGetTrackingOrder = await objectSortByKey(
        finalBodytoGetTrackingOrder
    );
    let post_string = await buildRequestParam(finalBodytoGetTrackingOrder);
    // console.log("post_string", post_string)

    const flashOrder = await query(
        "SELECT * FROM `flash_order` WHERE pno = ?",
        pno
    );
    if (flashOrder.length != 0 && flashOrder[0].transaction_status == "Cancel") {
        result(null, {message: "order has been canceled", data: null});
        return;
    }

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/${pno}/routes`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );

    result(null, response.data);
};

FlashOrder.printSmalllabel = async (req, result) => {
    let time = Date.now();

    let Login = await isLogin(req.token);
    let pno = req.pno;
    let finalBodytoGetSmallLabelPDF;
    let reqObject = req;
    if (!req.pno || !req.mchId) {
        result({message: "Invalid Request"}, null);
        return;
    }
    delete reqObject.pno;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetSmallLabelPDF = reqObject;
    finalBodytoGetSmallLabelPDF = await objectSortByKey(
        finalBodytoGetSmallLabelPDF
    );
    let post_string = await buildRequestParam(finalBodytoGetSmallLabelPDF);

    const flashOrder = await query(
        "SELECT * FROM `flash_order` WHERE pno = ?",
        pno
    );
    if (flashOrder.length != 0 && flashOrder[0].transaction_status == "Cancel") {
        result(null, {message: "order has been canceled", data: null});
        return;
    }

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/${pno}/small/pre_print`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
            responseType: "arraybuffer",
        }
    );

    var filename = publicPathPdf + "smallLabel" + time + ".pdf";
    var actualfileName = "smallLabel" + time + ".pdf";
    var file = filename;

    logjson = {};
    let logfile = "printSmalllabel.log";
    //logjson.status = 400
    //logjson.return_data = ""
    logjson.post_string = post_string;
    logjson.response_data = response.data;
    logjson.execution_time = Date.now() - time;
    logjson = JSON.stringify(logjson);

    ShF_log_to_file(logfile, logjson);

    fs.writeFile(file, response.data, function (err) {
        if (err) {
            console.log(err);
            result(err, null);
            return;
        } else {
            var outputImages2 = pdf2img.convert(response.data);
            outputImages2.then(function (outputImages) {
                for (i = 0; i < outputImages.length; i++)
                    fs.writeFile(publicPathPdf + "smallLabel" + time + ".png", outputImages[i], function (error) {
                        if (error) {
                            console.error("Error: " + error);
                        }
                    });
            });
            console.log("The file was saved!");
            let returnData = {
                status: "success",
                path: process.env.PATH_PDF + actualfileName,
                path_image: process.env.PATH_PDF + "smallLabel" + time + ".png",
            };

            result(null, returnData);
        }
    });
};

FlashOrder.printBiglabel = async (req, result) => {
    let time = Date.now();
    let Login = await isLogin(req.token);
    let pno = req.pno;
    let finalBodytoGetBigLabelPDF;
    let reqObject = req;
    if (!req.pno || !req.mchId) {
        result({message: "Invalid Request"}, null);
        return;
    }
    delete reqObject.pno;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetBigLabelPDF = reqObject;
    finalBodytoGetBigLabelPDF = await objectSortByKey(finalBodytoGetBigLabelPDF);
    let post_string = await buildRequestParam(finalBodytoGetBigLabelPDF);

    const flashOrder = await query(
        "SELECT * FROM `flash_order` WHERE pno = ?",
        pno
    );
    if (flashOrder.length != 0 && flashOrder[0].transaction_status == "Cancel") {
        result(null, {message: "order has been canceled", data: null});
        return;
    }

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/${pno}/pre_print`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
            responseType: "arraybuffer",
        }
    );

    var filename = publicPathPdf + "bigLabel" + time + ".pdf";
    var actualfileName = "bigLabel" + time + ".pdf";
    var file = filename;

    fs.writeFile(file, response.data, function (err) {
        if (err) {
            result(err, null);
            return;
        } else {
            // console.log("The file was saved!");
            var outputImages2 = pdf2img.convert(response.data);
            outputImages2.then(function (outputImages) {
                for (i = 0; i < outputImages.length; i++)
                    fs.writeFile(publicPathPdf + "bigLabel" + time + ".png", outputImages[i], function (error) {
                        if (error) {
                            console.error("Error: " + error);
                        }
                    });
            });
            let returnData = {
                status: "success",
                path: process.env.PATH_PDF + actualfileName,
                path_image: process.env.PATH_PDF + "bigLabel" + time + ".png",
            };

            result(null, returnData);
        }
    });
};

FlashOrder.estimateRate = async (req, result) => {
    // let Login = await isLogin(req.token)
    let pno = req.pno;
    let finalBodytoGetEstimateRate;
    let reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetEstimateRate = reqObject;
    finalBodytoGetEstimateRate = await objectSortByKey(
        finalBodytoGetEstimateRate
    );
    let post_string = await buildRequestParam(finalBodytoGetEstimateRate);

    // console.log("-----");
    // console.log(finalBodytoGetEstimateRate);
    // console.log(post_string);

    const response = await axios.post(process.env.FLASH_URL + `/open/v1/orders/estimate_rate`, post_string, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Accept-Language': 'en-th',
            'Charset': 'UTF-8'
        }
    });
    console.log("===")
    console.log(response)
    console.log("----------")
    result(null, response.data)
    return;
};

FlashOrder.estimateRateFlash = async (req) => {
    // let Login = await isLogin(req.token)
    let pno = req.pno;
    let finalBodytoGetEstimateRate;
    let reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetEstimateRate = reqObject;
    finalBodytoGetEstimateRate = await objectSortByKey(
        finalBodytoGetEstimateRate
    );
    let post_string = await buildRequestParam(finalBodytoGetEstimateRate);

//   console.log("estimateRateFlash");
//   console.log(pno);
//   console.log(post_string);

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/estimate_rate`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );
    return response.data;
};

FlashOrder.CallFlashWebHook = async (req, result) => {
    timeTaken = Date.now();
    let finalBodytoGetData;
    let reqObject = req;
    var logfile = "CallFlashWebHook.log";
    //reqObject.webhookApiCode = 0
    //reqObject.url = "/flash/getdata"
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetData = reqObject;
    finalBodytoGetData = await objectSortByKey(finalBodytoGetData);
    let post_string = await buildRequestParam(finalBodytoGetData);

    const response = await axios.post(
        process.env.FLASH_URL + "/open/v1/setting/web_hook_service",
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );

    /*var res;
      try {
          res = JSON.parse(response);
      } catch (error) {
          console.log(response);
          console.log(error);
          res = error.message + " : " + response;
      }*/

    // console.log(response);

    var log_data = {};
    log_data.data = response.data;
    log_data.execution_time = Date.now() - timeTaken;
    ShF_log_to_file(logfile, JSON.stringify(log_data));
    result(null, response.data);
};

FlashOrder.GetFlashData = async (req, result) => {
    timeTaken = Date.now();
    let reqObject = req;
    var logfile = "GetFlashData.log";
    status_data = "";

    try {
        status_data = JSON.stringify(reqObject.data);
    } catch (e) {
        status_data = e.message;
    }

    if (reqObject != null) {
        var insertQuery = sql.query(
            "INSERT INTO `tb_flash_order_webhook` (flwh_mchId, flwh_nonceStr, flwh_sign, flwh_status_data, flwh_status_state) VALUES(?, ?, ?, ?, ?)",
            [
                reqObject.mchId,
                reqObject.nonceStr,
                reqObject.sign,
                status_data,
                reqObject.data.state,
            ],
            (err, res) => {
                console.log(err)
            }
        );
    }
    sql.query(
        "INSERT INTO `flash_order_webhook_status` (order_number, pno, state) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE state = ?",
        [
            reqObject.data.outTradeNo,
            reqObject.data.pno,
            reqObject.data.state,
            reqObject.data.state,
        ]
    );

    if(reqObject.data.state === "5") {
        await sql.query(`UPDATE \`order\` SET seller_sent_status = "sent" WHERE order_number = "${reqObject.data.outTradeNo}"`)
        await sql.query("SELECT u.email AS email FROM `order` AS o INNER JOIN users u ON u.id = o.created_by WHERE o.order_number = ? UNION ALL SELECT email FROM user_address_new WHERE order_number = ?", [ reqObject.data.outTradeNo,reqObject.data.outTradeNo ], (err, res) => {
          if (err) {
            //console.log("error: ", err);
          }else{
            //console.log("res: ", res[0].email);
            sendEmail(res[0].email,reqObject.data.outTradeNo,reqObject.data.pno)
          }
        });
    }
    var log_data = {};
    log_data.data = reqObject;
    log_data.execution_time = Date.now() - timeTaken;
    ShF_log_to_file(logfile, JSON.stringify(log_data));
    result(null, {errorCode: "1", state: "success"});
};

FlashOrder.getNotify = async (req, result) => {
    var reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    // console.log('get notify');
    // console.log(req);
    var finalBodyNotify = reqObject;
    finalBodyNotify = await objectSortByKey(finalBodyNotify);
    var post_string = await buildRequestParam(finalBodyNotify);
    const response = await axios.post(
        process.env.FLASH_URL + "/open/v1/notifications",
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );
    // console.log(response.data);
    if (response.data.code == 1 && response.data.data.length > 0) {
        var notifyData = response.data.data;
        var notifyArray = [];
        for (let index = 0; index < notifyData.length; index++) {
            let element = await notifyData[index];
            let rowData = [];
            rowData.push(
                element.ticketPickupId,
                element.srcName,
                element.phone,
                element.srcProvinceName,
                element.srcCityName,
                element.srcDistrictName,
                element.postalCode,
                element.srcDetailAddress,
                element.estimateParcelNumber,
                element.remark,
                element.staffInfoName,
                element.staffInfomobile,
                element.state,
                element.stateText
            );
            notifyArray.push(rowData);
        }
        try {
            var upsertQuery = await query(
                "INSERT INTO flash_courier (ticketPickupId, srcName, srcPhone, srcProvinceName, srcCityName, srcDistrict, srcPostalCode, srcDetailAddress, estimateParcelNumber, remark, staffInfoName, staffInfoPhone, state, stateText) VALUES ? ON DUPLICATE KEY UPDATE state = VALUES(state), stateText = VALUES(stateText)",
                [notifyArray]
            );
        } catch (error) {
            console.log(error);
            result(null, error);
        }
    }
    result(null, {code: "1", message: "success"});
};

FlashOrder.callCourier = async (req, result) => {
    console.log(req);
    var time = Date.now();
    logjson = {};
    var logfile = "callCourier.log";
    console.log('call courier')
    var reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    var finalBodyNotify = reqObject;
    finalBodyNotify = await objectSortByKey(finalBodyNotify);
    var post_string = await buildRequestParam(finalBodyNotify);
    const response = await axios.post(
        process.env.FLASH_URL + "/open/v1/notify",
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );
    if (response.data.code === 1) {
        try {
            var order_number = await query(
                "SELECT order_number FROM `flash_order_webhook_status` ORDER BY Id DESC LIMIT 1"
            );
            var insertQuery = await query(
                "INSERT INTO flash_waiting_courier (ticketPickupId, staffInfoId, staffInfoName, staffInfoPhone, upCountryNote, timeoutAtText, ticketMessage, notice) VALUES (?,?,?,?,?,?,?,?)",
                [
                    response.data.data.ticketPickupId,
                    response.data.data.staffInfoId,
                    response.data.data.staffInfoName,
                    response.data.data.staffInfoPhone,
                    response.data.data.upCountryNote,
                    response.data.data.timeoutAtText,
                    response.data.data.ticketMessage,
                    response.data.data.notice,
                ]
            );
            console.log(insertQuery)
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, "0");
            var mm = String(today.getMonth() + 1).padStart(2, "0");
            var yyyy = today.getFullYear();
            var time =
                '"' +
                today.getHours() +
                ":" +
                today.getMinutes() +
                ":" +
                today.getSeconds() +
                '"';
            today = '"' + yyyy + "-" + mm + "-" + dd + '"';
            await query(
                "UPDATE `order` SET seller_sent_status = ?, sent_date = ?, sent_time = ? WHERE order_number = ?",
                ["sent", today, time, order_number]
            );
            logjson.post_string = post_string;
            logjson.response_data = response.data;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, response.data);
        } catch (error) {
            console.log(error)
            logjson.code = 500;
            logjson.message = "insert failed";
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, error);
        }
    } else if (response.data.code === 1010) {
        try {
            var selectQuery = await query(
                "SELECT * FROM flash_waiting_courier ORDER BY create_at DESC LIMIT 1"
            );
            var date = selectQuery[0].create_at;
            selectQuery[0].create_at =
                date.getDate() +
                "/" +
                (date.getMonth() + 1) +
                "/" +
                date.getFullYear() +
                " " +
                (date.getHours() - 7) +
                ":" +
                ("00" + date.getMinutes()).slice(-2) +
                ":" +
                ("00" + date.getSeconds()).slice(-2);
            var resultData = {};
            resultData.code = 1010;
            resultData.data = selectQuery;
            logjson.post_string = post_string;
            logjson.response_data = selectQuery;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, resultData);
        } catch (error) {
            console.log(error)
            logjson.code = 500;
            logjson.message = "select failed";
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, error);
        }
    } else {
        logjson.post_string = post_string;
        logjson.response_data = response.data;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(null, response.data);
    }
};

FlashOrder.cancelNotify = async (req, result) => {
    var reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    var finalBodyNotify = reqObject;
    finalBodyNotify = await objectSortByKey(finalBodyNotify);
    var post_string = await buildRequestParam(finalBodyNotify);
    const response = await axios.post(
        process.env.FLASH_URL + "/open/v1/notify/7066239/cancel",
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );
    result(null, response.data);
};

FlashOrder.setDataCourier = async (req, result) => {
    var logfile = "setDataCourier.log";
    console.log('set data');
    var logjson = {};
    var time = Date.now();
    try {
        var insertQuery = await query(
            "INSERT INTO flash_courier (ticketPickupId, currentTicketPickupId, srcName, srcPhone, srcProvinceName, srcCityName, srcDistrict, srcPostalCode, srcDetailAddress, estimateParcelNumber, remark, storeName, staffInfoId, staffInfoName, staffInfoPhone, state, stateText, cancelOperatorId, cancelReasonCode, cancelReasonText) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE state = VALUES(state), stateText = VALUES(stateText), cancelOperatorId = VALUES(cancelOperatorId), cancelReasonCode = VALUES(cancelReasonCode), cancelReasonText = VALUES(cancelReasonText), currentTicketPickupId = VALUES(currentTicketPickupId), staffInfoId = VALUES(staffInfoId), staffInfoName = VALUES(staffInfoName), staffInfoPhone = VALUES(staffInfoPhone)",
            [
                req.data.ticketPickupId,
                req.data.currentTicketPickupId,
                req.data.srcName,
                req.data.srcPhone,
                req.data.srcProvinceName,
                req.data.srcCityName,
                req.data.srcDistrict,
                req.data.srcPostalCode,
                req.data.srcDetailAddress,
                req.data.estimateParcelNumber,
                req.data.remark,
                req.data.storeName,
                req.data.staffInfoId,
                req.data.staffInfoName,
                req.data.staffInfoPhone,
                req.data.state,
                req.data.stateText,
                req.data.cancelOperatorId,
                req.data.cancelReasonCode,
                req.data.cancelReasonText,
            ]
        );
        logjson.request_data = req;
        logjson.response_data = {
            errorCode: "1",
            errorCode: "1",
            state: "success",
        };
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(null, {
            state: "success",
        });
        return;
    } catch (error) {
        logjson.response_data = {
            errorCode: "0",
        };
        logjson.errormessage = error;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(null, {
            errorCode: "0",
        });
        return;
    }
};

FlashOrder.getDataCourier = async (req, result) => {
    var logfile = "getDataCourier.log";
    var logjson = {};
    var time = Date.now();
    // console.log("getDataCourier token----------");
    // console.log(req.token);
    var login = await isLogin(req.token);
    if (login == true) {
        try {
            var resultQuery = await query(
                "SELECT * FROM flash_courier ORDER BY updateAt DESC"
            );
            for (let index = 0; index < resultQuery.length; index++) {
                resultQuery[index].updateAt = resultQuery[index].updateAt
                    .toISOString()
                    .replace(/T/, " ")
                    .replace(/\..+/, "");
            }
            var resultData = {};
            resultData.message = "success";
            resultData.data = resultQuery;
            logjson.message = "success";
            logjson.response_data = resultData.data;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, resultData);
            return;
        } catch (error) {
            logjson.message = "error";
            logjson.errormessage = error;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, error);
            return;
        }
    } else {
        logjson.message = "fail";
        logjson.token = req.token;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(null, {message: "fail"});
        return;
    }
};

FlashOrder.modifyOrder = async (req, result) => {
    var logfile = "modifyOrder.log";
    var logjson = {};
    var time = Date.now();
    var reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    var finalBodyNotify = reqObject;
    finalBodyNotify = await objectSortByKey(finalBodyNotify);
    var post_string = await buildRequestParam(finalBodyNotify);
    const response = await axios.post(
        process.env.FLASH_URL + "/open/v1/orders/modify",
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
        }
    );
    logjson.post_string = post_string;
    logjson.response_data = response.data;
    logjson.execution_time = Date.now() - time;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(null, response.data);
};

const objectSortByKey = async (reqObject) => {
    const ordered = Object.keys(reqObject)
        .sort()
        .reduce((obj, key) => {
            obj[key] = reqObject[key];
            return obj;
        }, {});
    return ordered;
};

const getSign = async (reqObject) => {
    let sortedObject = await objectSortByKey(reqObject);
    let stringA = "";
    let stringSignTemp = "";
    let sign = "";
    for (const [key, value] of Object.entries(sortedObject)) {
        if (key != "token") {
            stringA = stringA + key + "=" + value + "&";
        }
    }
    stringSignTemp = stringA + "key=" + process.env.FLASH_KEY;
    sign = sha256(stringSignTemp).toUpperCase();
    return sign;
};

const getNonce = async () => {
    var text = "";
    var possible = "0123456789";
    for (var i = 0; i < 13; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const isLogin = async (token) => {
    if (token) {
        let checkUserLogin = await query(
            "SELECT user_id FROM token WHERE access_token = ?",
            token
        );
        if (checkUserLogin.length != 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

const buildRequestParam = async (dataObject) => {
    requestStr = "";
    for (const [key, value] of Object.entries(dataObject)) {
        if (key != "token") {
            requestStr += key + "=" + encodeURI(value) + "&";
            // requestStr += key + "=" + value + '&';
        }
    }
    requestStr = requestStr.slice(0, -1);
    return requestStr;
};


const autoEstimateRateFlash = async (req) => {
    var logfile = "functionautoestimateflash.log";
    var logjson = {};
    var time = Date.now();
    let finalBodytoGetEstimateRate;
    let reqObject = req;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetEstimateRate = reqObject;
    finalBodytoGetEstimateRate = await objectSortByKey(
        finalBodytoGetEstimateRate
    );
    let post_string = await buildRequestParam(finalBodytoGetEstimateRate);
    try {
        const response = await axios.post(
            process.env.FLASH_URL + `/open/v1/orders/estimate_rate`,
            post_string,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                    "Accept-Language": "en-th",
                    Charset: "UTF-8",
                },
            }
        );
        logjson.message = "success";
        logjson.response_data = response.data;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        return response.data;
    } catch (err) {
        logjson.message = "error";
        logjson.errormessage = err;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        return err;
    }
};
const getVolumnProduct = async (sku) => {
    var logfile = "functionautoestimateflash.log";
    var logjson = {};
    var time = Date.now();
    return new Promise(async (resolve, reject) => {
        try {
            skuVolumn = await Promise.all(
                (dataVolumn = sku.Item_table.map(async (data) => {
                    return data["sku,"];
                }))
            );
            let dataqueryVolumn = await query(
                `(SELECT
            sku,volumn
            FROM ms_product WHERE sku in (?))
         UNION
         (SELECT
          new_sku as sku,volumn_json as volumn
          FROM ms_product_attribute WHERE new_sku in (?)) `,
                [skuVolumn, skuVolumn]
            );
            let skuArray = [];
            let select_data = await JSON.parse(JSON.stringify(dataqueryVolumn));
            select_data.forEach((s) => {
                skuArray.push(s.sku);
            });
            let checkSkuValid = await skuVolumn.filter((item) => !skuArray.includes(item));
            const sortArray = (arr1, arr2) => {
                arr2.sort((a, b) => {
                    const aKey = Object.values(a)[0];
                    const bKey = Object.values(b)[0];
                    return arr1.indexOf(aKey) - arr1.indexOf(bKey);
                });
            };
            sortArray(skuVolumn, select_data);
            if (checkSkuValid.length > 0) {
                err = {
                    message: {
                        message: "error",
                        status: 400,
                        messageForSystem: "SKU INVALID",
                        messageForHuman: `missing/invalid SKU: ${checkSkuValid}`,
                    },
                };
                logjson.message = "error";
                logjson.errormessage = err;
                logjson.execution_time = Date.now() - time;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                reject(err);
                return;
            }
            logjson.message = "success";
            logjson.response_data = select_data;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            resolve(select_data);
        } catch (err) {
            logjson.message = "error";
            logjson.errormessage = err;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            reject(err);
        }
    });
};
const totalShiping = async (reqObject) => {
    var logfile = "functionautoestimateflash.log";
    var logjson = {};
    var time = Date.now();
    return new Promise(async (resolve, reject) => {
        try {
            let volumn = await getVolumnProduct(reqObject);
            let shop_address = await query("select address from business_manage ");
            let data_shop_address = JSON.parse(shop_address[0].address);
            let fetchDataCompanyAndStaff = await mongoose_model_company_and_staff.find({"account_name": reqObject.companyName})
            if (!fetchDataCompanyAndStaff.length) {
                err = {
                    message: {
                        message: "error",
                        status: 400,
                        messageForSystem: "ไม่มีชื่อบริษัทอยู่ในฐานข้อมูล",
                        messageForHuman: "CompanyName dose not match",
                    },
                };
                logjson.message = "error";
                logjson.errormessage = err;
                logjson.execution_time = Date.now() - time;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                reject(err);
                return;
            }
            let total_shipping = 0;
            await Promise.all(
                (calculateShipping = await volumn.map(async (value, key) => {
                    let volumnProduct = JSON.parse(value.volumn);
                    var data_shipping = {
                        mchId: "CA2341",
                        srcProvinceName: data_shop_address.province,
                        srcCityName: data_shop_address.amphoe,
                        srcDistrictName: data_shop_address.tambon,
                        srcPostalCode: data_shop_address.zipcode,
                        dstProvinceName: fetchDataCompanyAndStaff[0]?.address[0]?.province, //จังงหวัด//
                        dstCityName: fetchDataCompanyAndStaff[0]?.address[0]?.district, // อำเภอ/แขวง //
                        dstDistrictName: fetchDataCompanyAndStaff[0]?.address[0]?.sub_district,  // ตำบล/เขต //
                        dstPostalCode: fetchDataCompanyAndStaff[0]?.address[0]?.zip_code, //รหัสไปรษณีย์
                        weight: parseInt(volumnProduct.weight),
                        width: parseInt(volumnProduct.width),
                        length: parseInt(volumnProduct.length),
                        height: parseInt(volumnProduct.height),
                        expressCategory: 1,
                        insureDeclareValue: 0,
                        insured: 0,
                        freightInsureEnabled: 0,
                        opdInsureEnabled: 0,
                        pricingTable: 0
                    };
                    let shipping_value = await autoEstimateRateFlash(data_shipping);
                    if (shipping_value.message != "success") {
                        err = {
                            message: {
                                message: "error",
                                status: 400,
                                messageForSystem: shipping_value.data,
                                messageForHuman: "มีความผิดพลาดจากการคำนวนค่าขนส่ง Flash",
                            },
                        };
                        logjson.message = "error";
                        logjson.errormessage = err;
                        logjson.execution_time = Date.now() - time;
                        logjson = JSON.stringify(logjson);
                        ShF_log_to_file(logfile, logjson);
                        reject(err);
                        return;
                    }
                    total_shipping +=
                        (parseFloat(shipping_value.data.estimatePrice) / 100) *
                        parseInt(reqObject.Item_table[key]["quantity,"]);
                    return;
                }))
            );
            logjson.message = "success";
            logjson.response_data = total_shipping;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            resolve(total_shipping);
        } catch (err) {
            logjson.message = "error";
            logjson.errormessage = err;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            reject(err);
        }
    });
};

FlashOrder.autoEstimateRate = async (req, result) => {
    var logfile = "functionautoestimateflash.log";
    var logjson = {};
    var time = Date.now();
    let reqObject = req;
    var arrBizdetail = ["first_name_th", "first_name_eng", "tax_id"];
    try {
        if (!("biz_detail" in reqObject)) {
            toReturn = {
                message: "error",
                status: false,
                messageForSystem: "MISSING_BIZ_DETAIL",
                messageForHuman: "Missing parameter: biz_detail.",
            };
            logjson.message = "error";
            logjson.errormessage = toReturn;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, toReturn);
            return;
        }
        let biz_detail_body = Object.keys(reqObject.biz_detail);
        let filterBiz_detail = arrBizdetail.filter(
            (item) => !biz_detail_body.includes(item)
        );
        if (filterBiz_detail.length > 0) {
            toReturn = {
                message: "error",
                status: false,
                messageForSystem: "MISSING PARAMETER",
                messageForHuman: `Missing parameter:${filterBiz_detail.toString()}`,
            };
            logjson.message = "error";
            logjson.errormessage = toReturn;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, toReturn);
            return;
        }

        if (!("Item_table" in reqObject)) {
            toReturn = {
                message: "error",
                status: false,
                messageForSystem: "MISSING_ITEM_TABLE",
                messageForHuman: "Missing parameter: item_table.",
            };
            logjson.message = "error";
            logjson.errormessage = toReturn;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, toReturn);
            return;
        }
        if (!("companyName" in reqObject)) {
            toReturn = {
                message: "error",
                status: false,
                messageForSystem: "MISSING_COMPANYNAME",
                messageForHuman: "Missing parameter: companyName.",
            };
            logjson.message = "error";
            logjson.errormessage = toReturn;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, toReturn);
            return;
        }
        let item_table_key = await reqObject.Item_table.filter((item) => {
            if (
                item?.["No,"] === undefined ||
                item?.["sku,"] === undefined ||
                item?.["product_image,"] === undefined ||
                item?.["product_short_description,"] === undefined ||
                item?.["quantity,"] === undefined ||
                item?.["QTY,"] === undefined ||
                item?.["price,"] === undefined ||
                item?.["TOTAL,"] === undefined
            ) {
                return !!(
                    item?.["No,"] === undefined ||
                    item?.["sku,"] === undefined ||
                    item?.["product_image,"] === undefined ||
                    item?.["product_short_description,"] === undefined ||
                    item?.["quantity,"] === undefined ||
                    item?.["QTY,"] === undefined ||
                    item?.["price,"] === undefined ||
                    item?.["TOTAL,"] === undefined
                );
            }
        });
        let checkSku = await reqObject.Item_table.filter((item) => {
            if (!item?.["sku,"] || item?.["sku,"].match(/^ *$/) !== null) {
                return true;
            }
            return false;
        });
        if (item_table_key.length > 0) {
            toReturn = {
                message: "error",
                status: false,
                messageForSystem: "Missing Parameter in item_table",
                messageForHuman: `Missing Parameter:${JSON.parse(item_table_key)}`,
            };
            logjson.message = "error";
            logjson.errormessage = toReturn;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, toReturn);
            return;
        }
        if (checkSku.length > 0) {
            toReturn = {
                message: "error",
                status: false,
                messageForSystem: "Missing Value: SKU VALUE",
                messageForHuman: `Missing Value:SKU Not Null`,
            };
            logjson.message = "error";
            logjson.errormessage = toReturn;
            logjson.execution_time = Date.now() - time;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, toReturn);
            return;
        }
        let Total_shipping = await totalShiping(reqObject);

        toReturn = {
            //   message: "sucsess",
            //   status: true,
            //   messageForSystem: "sucsess",
            //   messageForUser: "Get Data Sucsess",
            total_shipping: parseFloat(Total_shipping),
        };
        logjson.message = "success";
        logjson.response_data = Total_shipping;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(null, toReturn);
        return;
    } catch (err) {
        logjson.message = "error";
        logjson.errormessage = err;
        logjson.execution_time = Date.now() - time;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(err, null);
        return;
    }
};

FlashOrder.DownloadSmallLabel = async (req, result) => {
    let time = Date.now();

    let Login = await isLogin(req.token);
    let pno = req.pno;
    let finalBodytoGetSmallLabelPDF;
    let reqObject = req;
    if (!req.pno || !req.mchId) {
        result({message: "Invalid Request"}, null);
        return;
    }
    delete reqObject.pno;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetSmallLabelPDF = reqObject;
    finalBodytoGetSmallLabelPDF = await objectSortByKey(
        finalBodytoGetSmallLabelPDF
    );
    let post_string = await buildRequestParam(finalBodytoGetSmallLabelPDF);

    const flashOrder = await query(
        "SELECT * FROM `flash_order` WHERE pno = ?",
        pno
    );
    if (flashOrder.length != 0 && flashOrder[0].transaction_status == "Cancel") {
        result(null, {message: "order has been canceled", data: null});
        return;
    }

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/${pno}/small/pre_print`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
            responseType: "arraybuffer",
        }
    );
    result(null, response.data)
}

FlashOrder.DownloadBigLabel = async (req, result) => {
    let time = Date.now();

    let Login = await isLogin(req.token);
    let pno = req.pno;
    let finalBodytoGetSmallLabelPDF;
    let reqObject = req;
    if (!req.pno || !req.mchId) {
        result({message: "Invalid Request"}, null);
        return;
    }
    delete reqObject.pno;
    reqObject.nonceStr = await getNonce();
    reqObject.sign = await getSign(reqObject);
    finalBodytoGetSmallLabelPDF = reqObject;
    finalBodytoGetSmallLabelPDF = await objectSortByKey(
        finalBodytoGetSmallLabelPDF
    );
    let post_string = await buildRequestParam(finalBodytoGetSmallLabelPDF);

    const flashOrder = await query(
        "SELECT * FROM `flash_order` WHERE pno = ?",
        pno
    );
    if (flashOrder.length != 0 && flashOrder[0].transaction_status == "Cancel") {
        result(null, {message: "order has been canceled", data: null});
        return;
    }

    const response = await axios.post(
        process.env.FLASH_URL + `/open/v1/orders/${pno}/pre_print`,
        post_string,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "Accept-Language": "en-th",
                Charset: "UTF-8",
            },
            responseType: "arraybuffer",
        }
    );
    result(null, response.data)
}

module.exports = FlashOrder;
