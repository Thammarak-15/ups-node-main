const sql = require("./db.js");
const util = require("util");
const { exec } = require("child_process");
const { execSync } = require("child_process");
const { ShF_log_to_file } = require("../share_function/log_file");
const crypto = require("crypto");
const e = require("cors");
const atob = require("atob");
var he = require('he');
var Parser = require("fast-xml-parser").j2xParser;

var defaultOptions = {
    attributeNamePrefix : "@_",
    attrNodeName: "@", //default is false
    textNodeName : "#text",
    ignoreAttributes : true,
    cdataTagName: "__cdata", //default is false
    cdataPositionChar: "\\c",
    format: false,
    indentBy: "  ",
    supressEmptyNode: false,
    tagValueProcessor: a=> he.encode(a, { useNamedReferences: true}),// default is a=>a
    attrValueProcessor: a=> he.encode(a, {isAttributeValue: isAttribute, useNamedReferences: true})// default is a=>a
};

const query = util.promisify(sql.query).bind(sql);

const lazada = function (lazada) {

}

lazada.getAccessToken = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "getAccessToken.log"
    var code = req.body.code;
    var encodePanitToken = req.body.PanitToken;
    var PanitToken = decodeToken(encodePanitToken);
    PanitToken = PanitToken.replace(/"/g, '');
    // let buff = Buffer.from(encodePanitToken, 'base64');
    // let PanitToken = buff.toString('utf8');
    var reqObject = {};
    var reqUser = await getSellerShop(PanitToken);
    if (reqUser != false) {
        user_id = reqUser.user_id;
        seller_shop_id = reqUser.seller_shop_id;
        var APIname = "/auth/token/create";
        reqObject.app_key = process.env.lazada_appKey;
        reqObject.code = code;
        reqObject.timestamp = Date.now();
        reqObject.sign_method = "sha256";
        reqObject.sign = await getSign(APIname, reqObject);
        var post_string = await buildRequestParam(reqObject);
        var call_api = "curl -X POST \"" + process.env.LAZADA_URLs_All + "" + APIname + "?"+ post_string +"\"";
        var res;
        try {
            res = execSync(call_api).toString();
            res = JSON.parse(res);
            if (res.code == 0) {
                var access_token_expires_date = getDateWithTimeZone(Date.now() + res.expires_in)
                var created_at = getDateWithTimeZone(new Date())
                var updated_at = getDateWithTimeZone(new Date())
                var refresh_token_expires_date = getDateWithTimeZone(Date.now() + res.refresh_expires_in)
                await query("INSERT INTO `access_token_from_lazada`(seller_shop_id, access_token, refresh_token, Lazada_JSON, access_token_expires_date, created_at, updated_at, refresh_token_expires_date, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [seller_shop_id, res.access_token, res.refresh_token, JSON.stringify(res.country_user_info), access_token_expires_date, created_at, updated_at, refresh_token_expires_date, user_id])
                returnValue = { "success" : "Y" }
            } else {
                returnValue = { "success" : "N",
                                "reason" : "insert failed" }
            }
        } catch (error) {
            returnValue = { "success" : "N",
                            "reason" : "call api failed" }
        }
    } else {
        returnValue = { "success" : "N",
                        "reason" : "get token user failed" }
    }
    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue);
    return;
}

lazada.getProducts = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "getProducts_from_lazada.log"
    var reqObject = {};
    let APIname = "/products/get";
    // var encodePanitToken = req.body.PanitToken;
    // var PanitToken = decodeToken(encodePanitToken);
    var reqUser = await getSellerShop(req.body.PanitToken);
    if(reqUser != false){
        var lazadaToken = await getLazadaToken(reqUser.user_id)
        var seller_shop = reqUser.seller_shop_id;
        reqObject.app_key = process.env.lazada_appKey;
        reqObject.access_token = lazadaToken; //"50000701a32kkOtpeXcfSisRuHKdNK2krsFfbFqRcRQY1b9f73afTPta1LwkN1Sw", "50000700814dk9fr8kEOWOxh8a11193fbbGwFowESqidjFw8l0wcniJg2eeuTh2C";
        reqObject.filter = "all"
        reqObject.timestamp = Date.now();
        reqObject.sign_method = "sha256";
        reqObject.sign = await getSign(APIname, reqObject);
        let post_string = await buildRequestParam(reqObject);
        let call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\"";
        var res;
        try {
            res = execSync(call_api).toString();
            res = JSON.parse(res);
            if ( res.data.products != undefined) {
                allProducts = res.data.products
                let allProductsDict = []
                for (let i = 0; i < allProducts.length; i++) {
                    for (let y = 0; y < allProducts[i].skus.length; y++) {
                        let productObj = {}
                        productObj.lazada_product_id = allProducts[i].item_id;
                        productObj.lazada_product_sku_id = allProducts[i].skus[y].SkuId;
                        productObj.lazada_product_category_id = allProducts[i].primary_category;
                        productObj.lazada_product_brand_name = allProducts[i].attributes.brand;
                        productObj.lazada_product_status = allProducts[i].skus[y].Status;
                        productObj.lazada_product_seller_sku = allProducts[i].skus[y].SellerSku;
                        productObj.product_data = JSON.stringify(allProducts[i]);
                        allProductsDict.push(productObj);
                    }
                }
                data_product = await query("SELECT * FROM `tb_product_lazada_data`");
                if (data_product != undefined) {
                    for (let index = 0; index < allProductsDict.length; index++) {
                        let this_product_id = allProductsDict[index].lazada_product_id;
                        let this_product_sku_id = allProductsDict[index].lazada_product_sku_id;
                        let this_product_category_id = allProductsDict[index].lazada_product_category_id;
                        let this_product_brand_name = allProductsDict[index].lazada_product_brand_name;
                        let this_product_status = allProductsDict[index].lazada_product_status;
                        let this_product_seller_sku = allProductsDict[index].lazada_product_seller_sku;
                        let this_product_data = allProductsDict[index].product_data;
                        if (this_product_status == 'active') this_product_status = 'live'
                        var find_product = data_product.find(x => x.lazada_product_sellersku == this_product_seller_sku && x.seller_shop_id == seller_shop)
                        if(find_product === undefined){
                            await query("INSERT INTO `tb_product_lazada_data`(lazada_product_id, lazada_product_sku_id, lazada_product_category_id, lazada_product_brand_name, sync_this_product_to_lazada, lazada_product_status, lazada_product_sellersku, product_data, seller_shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [this_product_id, this_product_sku_id, this_product_category_id, this_product_brand_name, 'no', this_product_status, this_product_seller_sku, this_product_data, seller_shop])
                        } else {
                            await query("UPDATE `tb_product_lazada_data` SET `product_data` = ?, lazada_product_category_id = ?, lazada_product_brand_name = ?, lazada_product_status = ? WHERE lazada_product_sellersku = ? AND `seller_shop_id` = ?",[this_product_data, this_product_category_id, this_product_brand_name, this_product_status, this_product_seller_sku, seller_shop])
                        }
                    }
                }
            } else {
                res = { "code" : "0" , 
                        "message" : "no product in this shop"
                    }
            }
        } catch (error) {
            console.log(error);
            res = error;
        }
    } else {
        res = { "status" : "N" ,
                "message" : "get accesstoken failed"
        }
    }
    var log_data = Object.assign({}, res)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, res);
    return;
}

lazada.autoMapProductBySKU = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "autoMapProductBySKU.log"
    var returnValue;
    var reqUser = await getSellerShop(req.body.PanitToken);
    if(reqUser != false){
        var seller_shop = reqUser.seller_shop_id;
        try {
            var data_product_from_lazada_not_map = await query("SELECT * FROM `tb_product_lazada_data` WHERE `panit_product_id` IS NULL AND `panit_product_sku` IS NULL AND `lazada_product_status` LIKE 'live' AND `seller_shop_id` LIKE "+ seller_shop +""); 
        } catch (error) {
            returnValue = error;
        }
        if (data_product_from_lazada_not_map.length > 0){
            for (let index = 0; index < data_product_from_lazada_not_map.length; index++) {
                let this_id_lazada_product_table = data_product_from_lazada_not_map[index].id;
                let this_lazada_produuct_SKUseller = data_product_from_lazada_not_map[index].lazada_product_sellersku;
                console.log(this_lazada_produuct_SKUseller);
                try {
                    var data_product_panit_like_lazada_sku = await query("SELECT `id`, `sku` FROM `ms_product` WHERE `sku` LIKE '"+ this_lazada_produuct_SKUseller +"'");
                    console.log(data_product_panit_like_lazada_sku);
                } catch(error) {
                    returnValue = error;
                }
                if(data_product_panit_like_lazada_sku.length > 0 && data_product_panit_like_lazada_sku.length == 1){
                    try {
                        await query("UPDATE `tb_product_lazada_data` SET `panit_product_id` = "+data_product_panit_like_lazada_sku[0].id+", `panit_product_sku` = '"+data_product_panit_like_lazada_sku[0].sku+"' WHERE `id` = "+this_id_lazada_product_table+"");
                    } catch (error) {
                        returnValue = error;
                    }
                } else if (data_product_panit_like_lazada_sku.length == 0){
                    try {
                        var data_product_attribue_panit_like_lazada_sku = await query("SELECT `product_id`, `new_sku` FROM `ms_product_attribute` WHERE `new_sku` LIKE '"+this_lazada_produuct_SKUseller+"'");
                    } catch (error) {
                        returnValue = error;
                    }
                    if(data_product_attribue_panit_like_lazada_sku.length > 0 && data_product_attribue_panit_like_lazada_sku.length == 1){
                        try {
                            await query("UPDATE `tb_product_lazada_data` SET `panit_product_id` = "+data_product_attribue_panit_like_lazada_sku[0].product_id+", `panit_product_sku` = '"+data_product_attribue_panit_like_lazada_sku[0].new_sku+"' WHERE `id` = "+this_id_lazada_product_table+"");
                        } catch (error) {
                            returnValue = error;
                        }
                    }
                }
            }
            returnValue = { "code" : "0" }
        } else {
            returnValue = { "code" : "0",
                            "message" : "All product in Lazada already map" }
        }
    } else {
        returnValue = { "status" : "N" ,
                "message" : "get user_id , seller shop failed"
        }
    }
    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue)
    return;
}

lazada.mapProduct_UPS_with_lazada = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "mapProduct_UPS_with_lazada.log"
    var id = req.body.id;
    var product_id = req.body.panit_product_id;
    var product_sku = req.body.panit_product_sku
    try {
        await query("UPDATE `tb_product_lazada_data` SET `panit_product_id` = ?,  `panit_product_sku` = ? WHERE `id` = ?", [product_id, product_sku, id]);
        returnValue = {"status" : "Y"};
    } catch (error) {
        returnValue = { "status" : "N",
                    "message" : error};
    }
    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue);
    return;
}

lazada.selectProductToUpdateStock = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "selectProductToUpdateStock.log"
    var id = req.body.id;
    var sync_product = req.body.sync_product;
    try {
        await query("UPDATE `tb_product_lazada_data` SET `sync_this_product_to_lazada` = ? WHERE `id` IN (?)", [sync_product, id]);
        returnValue = {"status" : "Y"};
    } catch (error) {
        returnValue = { "status" : "N",
                    "message" : error};
    }
    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue);
    return;
}

lazada.createProduct = async (req, result) => {
    // var not_create_product = await query("SELECT `OurProductID` FROM `sync_product_to_lazada` WHERE `OurProductID` != -1");
    // for (let index = 0; index < not_create_product.length; index++) {
    //     not_create_product[index] = not_create_product[index].OurProductID;
    // }
    // if(not_create_product.length == 0) {
    //     not_create_product = 0;
    // }
    // var create_products = await query("SELECT `id`, `seller_shop_id`, `sku`, `have_attribute`, `name`, `inventory_ratio`, `stock_count`, `inventory_stock`, `status`, `description`, `short_description`, `volumn` FROM `ms_product` WHERE `id` NOT IN (?)", not_create_product);
    // for (let index = 0; index < create_products.length; index++) {
    //     let create_product = {
    //         Request : {
    //             Product : {
    //                 PrimaryCategory : '',
    //                 SPUId : '',
    //                 AssociatedSku : '',
    //                 Attributes : {
    //                     name : create_products[index].name ,
    //                     short_description : create_products[index].short_description ,
    //                     brand : '',
    //                     model : '',
    //                     kid_years : '',                        
    //                 },
    //                 Skus : {
    //                     'Sku' : []
    //                 }
    //             }
    //         }
    //     }
    //     if(create_products[index].have_attribute == 'no') {
    //         let this_volumn = JSON.parse(create_products[index].volumn);
    //         add_sku = {
    //             SellerSku : create_products[index].name,
    //             color_family : '',
    //             size : '',
    //             quantity : '',
    //             package_length : this_volumn.length,
    //             package_height : this_volumn.height,
    //             package_weight : this_volumn.weight,
    //             package_width : this_volumn.width,
    //             package_content : '',
    //             Images : {
    //                 'Image' : []
    //             }
    //         }
    //     }
    //     var reqObject = {};
    //     var APIname = "/product/create";
    //     reqObject.app_key = process.env.lazada_appKey;
    //     reqObject.access_token = "50000301a16kkOtpeWEjp7rwyemD17e0f07aQkyhzXBkyDTOCMu2prtyabZrynnx";
    //     reqObject.payload = create_product;
    //     reqObject.timestamp = Date.now();
    //     reqObject.sign_method = "sha256";
    //     reqObject.sign = await getSign(APIname, reqObject);
    //     var post_string = await buildRequestParam(reqObject);
    //     var call_api = "curl -X POST \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\""
    //     var res;
    //     try {
    //         res = execSync(call_api).toString();
    //         res = JSON.parse(res);
    //     } catch (error) {
    //         console.log(error);
    //         result(null, { "status" : "N" ,
    //     "reason" : "can not create product " + create_products[index].name})
    //     }
    //     result(null, res);
    //     return res;
    // }
    var reqObject = req.body
    var APIname = "/product/create"
    reqObject.timestamp = Date.now()
    reqObject.sign_method = "sha256"
    reqObject.sign = await getSign(APIname, reqObject)
    var post_string = await buildRequestParam(reqObject)
    var call_api = "curl -X POST \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\""
    var res ;
    try {
        res = execSync(call_api).toString();
        res = JSON.parse(res);
    } catch (error) {
        console.log(error);
        res = error;
    }
    result(null, res)
    return res
}

lazada.updateProduct = async (req, result) => {
    let reqObject = req.body
    let APIname = "/product/update"
    reqObject.timestamp = Date.now()
    reqObject.sign_method = "sha256"
    reqObject.sign = await getSign(APIname, reqObject)
    let post_string = await buildRequestParam(reqObject)
    let call_api = "curl -X POST \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\""
    const res = exec(call_api, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        // if (stderr) {
        //     console.log(`stderr: ${stderr}`);
        //     return;
        // }
        stdout = JSON.parse(stdout)
        result(null, stdout)
    });
    return res
}

lazada.updateStock = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "updateStock.log"
    var reqUser = await getSellerShop(req.body.PanitToken);
    if(reqUser != false){
        var seller_shop = reqUser.seller_shop_id;
        var lazadaToken = await getLazadaToken(reqUser.user_id)
        try {
            var setPayload = await query("SELECT * FROM `tb_product_lazada_data` WHERE `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL AND `sync_this_product_to_lazada` = 'yes' AND `seller_shop_id` LIKE "+ seller_shop +"")
        } catch (error) {
            throw error;   
        }
        var payloadDict = [];
        if(setPayload.length > 0){
            for (let index = 0; index < setPayload.length; index++) {
                let payloadObject = {};
                let this_id = setPayload[index].id;
                let this_panit_product_id = setPayload[index].panit_product_id;
                let this_panit_product_sku = setPayload[index].panit_product_sku;
                let this_lazada_product_id = setPayload[index].lazada_product_id;
                let this_lazada_product_sku_id = setPayload[index].lazada_product_sku_id;
                let this_lazada_product_sellersku = setPayload[index].lazada_product_sellersku;
                let this_panit_quantity ;
                try {
                    var this_panit_product = await query("SELECT `id`, `inventory_stock` FROM `ms_product` WHERE `id` = "+ this_panit_product_id +" AND `sku` LIKE '"+ this_panit_product_sku +"'")    
                } catch (error) {
                    throw error;
                }
                if (this_panit_product.length > 0){
                    this_panit_quantity = this_panit_product[0].inventory_stock;
                } else if (this_panit_product.length == 0){
                    try {
                        var this_panit_product_attribute = await query("SELECT `product_id`, `new_sku`, `effective_stock` FROM `ms_product_attribute` WHERE `product_id` = "+ this_panit_product_id +" AND `new_sku` LIKE '"+ this_panit_product_sku +"'")    
                    } catch (error) {
                        throw error;
                    }
                    this_panit_quantity = this_panit_product_attribute[0].effective_stock;
                }
                payloadObject.id = this_id;
                payloadObject.panit_product_id = this_panit_product_id;
                payloadObject.panit_product_sku = this_panit_product_sku;
                payloadObject.lazada_product_id = this_lazada_product_id;
                payloadObject.lazada_product_sku_id = this_lazada_product_sku_id;
                payloadObject.lazada_product_sellersku = this_lazada_product_sellersku;
                payloadObject.panit_quantity = this_panit_quantity;
                payloadDict.push(payloadObject)
            }
            let waitpayload = {
                Request : {
                    Product : {
                        Skus : {
                            'sku' : []
                        }
                    }
                }
            }
            var idpayload = [];
            for (let index = 0; index < payloadDict.length; index++) {
                idpayload.push(payloadDict[index].id);
                let this_product_obj = {
                    ItemId : String(payloadDict[index].lazada_product_id),
                    SkuId : String(payloadDict[index].lazada_product_sku_id),
                    SellerSku : String(payloadDict[index].lazada_product_sellersku),
                    Quantity : String(payloadDict[index].panit_quantity)
                }
                waitpayload.Request.Product.Skus.sku.push(this_product_obj);
                if(index % 20 == 0 || index == payloadDict.length-1){
                    var parser = new Parser(defaultOptions);
                    var xml = parser.parse(waitpayload);
                    var reqObject = {};
                    var APIname = "/product/price_quantity/update";
                    reqObject.timestamp = Date.now();
                    reqObject.app_key = process.env.lazada_appKey;
                    reqObject.access_token = lazadaToken;
                    reqObject.sign_method = "sha256";
                    reqObject.payload = xml;
                    reqObject.sign = await getSign(APIname, reqObject);
                    var post_string = await buildRequestParam(reqObject);
                    post_string = post_string.replace(/#/g, "%23")
                    var call_api = "curl -X POST \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\""
                    var res;
                    try {
                        res = execSync(call_api).toString();
                        res = JSON.parse(res);         
                    } catch (error) {
                        res = error;         
                    }
                    if(index == payloadDict.length-1){
                        await query("UPDATE `tb_product_lazada_data` SET `sync_this_product_to_lazada` = 'no' WHERE `id` IN (?)", [idpayload])
                    }
                    if(index > 0){
                        waitpayload.Request.Product.Skus.sku = [];
                    }
                }
            }
        } else {
            res = { "status" : "Y",
                    "message" : "no product updated"}
        }
    } else {
        res = { "status" : "N" ,
        "message" : "get access token failed"
        }
    }
    var log_data = Object.assign({}, res)
    log_data.post_string = post_string
    log_data.idpayload = idpayload
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, res)
    return ;
}

lazada.getCategorySuggestion = async (req, result) => {
    var APIname = "/product/category/suggestion/get";
    var timeTaken = Date.now();
    var logfile = "getCategorySuggestion.log";
    var reqObject = req.body;
    reqObject.app_key = process.env.lazada_appKey;
    reqObject.timestamp = Date.now();
    reqObject.access_token = "50000901431cTnhueISByxcXbgx9kxufFINK0iszlFy1f8b6a539SoCRsypOk8";
    reqObject.sign_method = "sha256";
    reqObject.sign = await getSign(APIname, reqObject);
    var post_string = await buildRequestParam(reqObject);
    var call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\"";
    var res;
    try {
        res = execSync(call_api).toString();
        res = JSON.parse(res);
    } catch (error) {
        console.log(error);
        res = error;
    }
    var log_data = res;
    log_data.execution_time = Date.now() - timeTaken;
    log_data = JSON.stringify(log_data);
    ShF_log_to_file(logfile, log_data);
    result(null, res);
};

lazada.getAllCategory = async (req, result) => {
    var APIname = "/category/tree/get";
    var timeTaken = Date.now();
    var logfile = "getAllCategory.log";
    var reqObject = req.body;
    reqObject.app_key = process.env.lazada_appKey;
    reqObject.timestamp = Date.now();
    reqObject.access_token = "50000701a32kkOtpeXcfSisRuHKdNK2krsFfbFqRcRQY1b9f73afTPta1LwkN1Sw";
    reqObject.sign_method = "sha256";
    reqObject.sign = await getSign(APIname, reqObject);
    var post_string = await buildRequestParam(reqObject);
    var call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\"";
    var res;
    try {
        res = execSync(call_api).toString();
        res = JSON.parse(res);
    } catch (error) {
        console.log(error);
        res = error;
    }
    if (res.code == '0') {
        var old_category_data = await query("SELECT `category_id` FROM `lazada_category`")
        var category_data = Object.assign({}, res.data);
        for (const key in category_data) {
            if (Object.hasOwnProperty.call(category_data, key)) {
                let element = category_data[key];
                let this_var = (element.var === false) ? 'false' : 'true';
                let this_name = element.name;
                let this_leaf = (element.leaf === false) ? 'false' : 'true';
                let this_category_id = element.category_id;
                let this_children = JSON.stringify(element.children);
                var find_category = old_category_data.find(x => x.category_id == this_category_id);
                if(find_category == undefined){
                    try {
                        await query("INSERT INTO `lazada_category` (`category_id`, `var`, `name`, `leaf`, `children`) VALUES (?,?,?,?,?)", [this_category_id, this_var, this_name, this_leaf, this_children]);
                    } catch (error) {
                        console.log(error);
                        res = error;
                    }
                }
            }
        }
    }
    var log_data = Object.assign({}, res);
    log_data.execution_time = Date.now() - timeTaken;
    log_data = JSON.stringify(log_data);
    ShF_log_to_file(logfile, log_data);
    result(null, res);
}

lazada.GetCategoryAttributes = async (req, result) => {
    var timeTaken = Date.now();
    var res;
    try {
        var list_category = await query("SELECT `category_id` FROM `lazada_category`");
        for (let index = 0; index < list_category.length; index++) {
            let this_primary_category_id = list_category[index].category_id;
            var APIname = "/category/attributes/get";
            var logfile = "GetCategoryAttributes.log";
            let reqObject = {};
            reqObject.language_code = "th_TH";
            reqObject.app_key = process.env.lazada_appKey;
            reqObject.access_token = "50000701a32kkOtpeXcfSisRuHKdNK2krsFfbFqRcRQY1b9f73afTPta1LwkN1Sw";
            reqObject.timestamp = Date.now();
            reqObject.primary_category_id = String(this_primary_category_id);
            reqObject.sign_method = "sha256";
            reqObject.sign = await getSign(APIname, reqObject);
            var post_string = await buildRequestParam(reqObject);
            var call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\"";
            res = execSync(call_api).toString();
            res = JSON.parse(res);
            if (res.code === '0'){
                let this_data = Object.assign({}, res.data)
                for (const key in this_data) {
                    if (Object.hasOwnProperty.call(this_data, key)) {
                        const element = this_data[key];
                        let this_is_key_prop = element.advanced.is_key_prop;
                        let this_is_sale_prop = element.is_sale_prop;
                        let this_name = element.name;
                        let this_input_type = element.input_type;
                        let this_options = (element.options.length == 0) ? "" : JSON.stringify(element.options);
                        let this_is_mandatory = element.is_mandatory;
                        let this_attribute_type = element.attribute_type;
                        let this_label = element.label;
                        await query("INSERT INTO `lazada_category_attribute` (`primary_category_id`, `is_key_prop`, `is_sale_prop`, `name`, `input_type`, `options`, `is_mandatory`, `attribute_type`, `label`) VALUES (?,?,?,?,?,?,?,?,?)",[this_primary_category_id, this_is_key_prop, this_is_sale_prop, this_name, this_input_type, this_options, this_is_mandatory, this_attribute_type, this_label])
                    }
                }
            } else {
                throw res;
            }
        }
        returnValue = { "status"  : "Y" }
    } catch (error) {
        console.log(error);
        returnValue = error;
    }
    var log_data = Object.assign({}, returnValue);
    log_data.execution_time = Date.now() - timeTaken;
    log_data = JSON.stringify(log_data);
    ShF_log_to_file(logfile, log_data);
    result(null, returnValue);

    // var APIname = "/category/attributes/get";
    // var timeTaken = Date.now();
    // var logfile = "GetCategoryAttributes.log";
    // var reqObject = req.body;
    // reqObject.app_key = process.env.lazada_appKey;
    // reqObject.timestamp = Date.now();
    // reqObject.access_token = "50000901431cTnhueISByxcXbgx9kxufFINK0iszlFy1f8b6a539SoCRsypOk8";
    // reqObject.sign_method = "sha256";
    // reqObject.sign = await getSign(APIname, reqObject);
    // var post_string = await buildRequestParam(reqObject);
    // var call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + APIname + "?"+ post_string +"\"";
    // var res;
    // try {
    //     res = execSync(call_api).toString();
    //     res = JSON.parse(res);
    // } catch (error) {
    //     console.log(error);
    //     res = error;
    // }
    // var log_data = res;
    // log_data.execution_time = Date.now() - timeTaken;
    // log_data = JSON.stringify(log_data);
    // ShF_log_to_file(logfile, log_data);
    // result(null, res);
}

lazada.listProductMap = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "listProductMap.log"
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {}
    if(reqUser != false){
        try {
            var list_product_map = await query("SELECT `id`, `panit_product_id`, `lazada_product_id`, `panit_product_sku`, `lazada_product_sellersku`,`lazada_product_sku_id` FROM `tb_product_lazada_data` WHERE `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL AND `lazada_product_status` = 'live' AND `seller_shop_id` = "+ reqUser.seller_shop_id +"");
            returnValue.data = list_product_map;
            returnValue.code = "0";
        } catch (error) {
            returnValue = error;
        }
    } else {
        returnValue = { "status" : "N" ,
        "message" : "get access token failed"
        }
    }
    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue);
    return;
}

lazada.listProductNotMap = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "listProductNotMap.log"
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {};
    if(reqUser != false){
        try {
            var list_product_map = await query("SELECT `id`, `panit_product_id`, `lazada_product_id`, `panit_product_sku`, `lazada_product_sellersku`,`lazada_product_sku_id` FROM `tb_product_lazada_data` WHERE `panit_product_id` IS NULL AND `panit_product_sku` IS NULL AND `lazada_product_status` = 'live' AND `seller_shop_id` = "+ reqUser.seller_shop_id +"");
            returnValue.data = list_product_map;
            returnValue.code = "0";
        } catch (error) {
            returnValue = error;
        }
    } else {
        returnValue = { "status" : "N" ,
        "message" : "get access token failed"
        }
    }
    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue);
    return;
}

lazada.listProductBeforeSyncStock = async (req, result) => {
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {};
    if(reqUser != false){
        try {
            var list_product = await query("SELECT * FROM `tb_product_lazada_data` WHERE `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL AND `lazada_product_status` = 'live' AND `seller_shop_id` = "+ reqUser.seller_shop_id +"");
            if (list_product.length > 0){
                var list_product_arr = [];
                for (let index = 0; index < list_product.length; index++) {
                    let list_product_tmp = {};
                    let panit_id = list_product[index].panit_product_id;
                    let panit_sku = list_product[index].panit_product_sku;
                    let lazada_sku = list_product[index].lazada_product_sellersku;
                    let panit_stock, panit_name;
                    have_att = await query("SELECT `have_attribute`, `name` FROM `ms_product` WHERE id = ?", panit_id);
                    //let product_url = "https://panit.sdi.inet.co.th/UPS/DetailProductUPS/" + encodeURIComponent(have_att[0].name + '-' + panit_id);
					let product_url = process.env.PATH_DETAIL_PRODUCT_UPS + encodeURIComponent(have_att[0].name + '-' + panit_id);
                        if (have_att[0].have_attribute == 'no'){
                            let stock_have_no_att = await query("SELECT `inventory_stock`, `name` FROM `ms_product` WHERE `id` = ? AND `sku` = ?", [panit_id, panit_sku]);
                            panit_stock = stock_have_no_att[0].inventory_stock;
                            panit_name = stock_have_no_att[0].name;
                        } else {
                            let stock_have_yes_att = await query("SELECT `attribute_priority_1` , `attribute_priority_2`, `effective_stock` FROM `ms_product_attribute` WHERE `product_id` = ? AND `new_sku` = ?",[panit_id, panit_sku]);
                            panit_stock = stock_have_yes_att[0].effective_stock
                            let name1 = (stock_have_yes_att[0].attribute_priority_1 == null) ? " " : stock_have_yes_att[0].attribute_priority_1;
                            let name2 = (stock_have_yes_att[0].attribute_priority_2 == null) ? " " : stock_have_yes_att[0].attribute_priority_2;
                            panit_name = have_att[0].name + name1 + name2
                        }
                        let this_product_data = list_product[index].product_data;
                        this_product_data = JSON.parse(this_product_data);
                        let this_sku = search(lazada_sku, this_product_data.skus)
                        if (this_sku){
                            let lazada_occupy_stock = this_sku.multiWarehouseInventories[0].occupyQuantity;
                            if(lazada_occupy_stock > panit_stock){
                                this_product_can_sync = true;
                            } else {
                                this_product_can_sync = false;
                            }
                        }
                        list_product_tmp.id = list_product[index].id;
                        list_product_tmp.ups_product_id = panit_id;
                        list_product_tmp.sku = panit_sku;
                        list_product_tmp.effective_stock = panit_stock;
                        list_product_tmp.name = panit_name;
                        list_product_tmp.link = product_url;
                        list_product_tmp.occupy_status = this_product_can_sync;
                        list_product_arr.push(list_product_tmp);
                }
                returnValue.data = list_product_arr;
                returnValue.code = "0";
            } else {
                returnValue.data = list_product;
                returnValue.code = "0";
            }
        } catch (error) {
            returnValue = error;
        }
    } else {
        returnValue = { "status" : "N" ,
        "message" : "get access token failed"
        }
    }
    result(null, returnValue);
    return;
}

lazada.listProductUPSNotMap = async (req, result) => {
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {};
    var product_arr = [];
    if(reqUser != false){
        var seller_shop = reqUser.seller_shop_id;
        try {
            var product_ups_mapped = await query("SELECT `panit_product_sku` FROM `tb_product_lazada_data` WHERE `seller_shop_id` = ? AND `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL AND `lazada_product_status` = 'live'",seller_shop);
            for (let index = 0; index < product_ups_mapped.length; index++) {
                product_ups_mapped[index] = product_ups_mapped[index].panit_product_sku;
            }
            var product_ups = await query("SELECT * FROM `ms_product` WHERE `sku` NOT IN (?) AND `seller_shop_id` = ?", [product_ups_mapped, seller_shop]);
            if(product_ups.length > 0){
                for (let index = 0; index < product_ups.length; index++) {
                    let product_ups_tmp = {};
                    let product_url = "https://panit.sdi.inet.co.th/UPS/DetailProductUPS/" + encodeURIComponent(product_ups[index].name + '-' + product_ups[index].id);
                    if(product_ups[index].have_attribute == 'no'){
                        product_ups_tmp.ups_product_id = product_ups[index].id;
                        product_ups_tmp.sku = product_ups[index].sku;
                        product_ups_tmp.name = product_ups[index].name;
                        product_ups_tmp.link = product_url;
                        product_arr.push(product_ups_tmp)
                    } else if (product_ups[index].have_attribute == 'yes') {
                        let product_att = await query("SELECT * FROM `ms_product_attribute` WHERE `seller_shop_id` = ? AND `product_id` = ? AND `new_sku` NOT IN (?)", [seller_shop, product_ups[index].id, product_ups_mapped]);
                        if (product_att.length > 0) {
                            for (let x = 0; x < product_att.length; x++) {
                                let product_ups_tmp = {};
                                let name1 = (product_att[x].attribute_priority_1 == null) ? "" : product_att[x].attribute_priority_1;
                                let name2 = (product_att[x].attribute_priority_2 == null) ? "" : product_att[x].attribute_priority_2;
                                product_ups_tmp.ups_product_id = product_att[x].product_id;
                                product_ups_tmp.sku = product_att[x].new_sku;
                                product_ups_tmp.name = product_ups[index].name + " " + name1 + name2;
                                product_ups_tmp.link = product_url;
                                product_arr.push(product_ups_tmp)
                            }
                        }
                    }
                }
                returnValue.data = product_arr;
                returnValue.code = "0";
            } else {
                returnValue.data = product_ups;
                returnValue.code = "0";
            }
        } catch (error) {
            returnValue = error;
        }
    } else {
        returnValue = { "status" : "N" ,
        "message" : "get access token failed"
        }
    }
    result(null, returnValue)
    return;
}

async function getSign(URL, params) {
    let sortedObject = await objectSortByKey(params);
    let stringSignTemp = "";
    for (const [key, value] of Object.entries(sortedObject)) {
        if (key != "token") {
            stringSignTemp = stringSignTemp + key + value 
        }
    }
    var sign = crypto.createHmac('sha256', process.env.LAZADA_secret_key)
                    .update(URL + stringSignTemp)
                    .digest('hex')
                    .toUpperCase()
    return sign
}

async function objectSortByKey (reqObject) {
    const ordered = Object.keys(reqObject).sort().reduce(
        (obj, key) => {
            obj[key] = reqObject[key];
            return obj;
        },
        {}
    );
    return ordered
}

async function buildRequestParam (dataObject) {
    requestStr = '';
    for (const [key, value] of Object.entries(dataObject)) {
        if (key != "token") {
            requestStr += key + "=" + encodeURI(value) + '&';
            // requestStr += key + "=" + value + '&';
        }
    }
    requestStr = requestStr.slice(0, -1);
    return requestStr
}

async function getSellerShop (token) {
    if (token) {
        let checkUserLogin = await query("SELECT user_id FROM token WHERE access_token = ?", token)
        if (checkUserLogin.length != 0) {
            let SellerShop = await query("SELECT `seller_shop_id`, `assistant_shop_id` FROM `tb_user_shop` WHERE user_id = ?", checkUserLogin[0].user_id);
            var tmp_seller_shop_id = (SellerShop[0].seller_shop_id == -1) ? SellerShop[0].assistant_shop_id : SellerShop[0].seller_shop_id;
            let returnValues = {
                user_id : checkUserLogin[0].user_id,
                seller_shop_id : tmp_seller_shop_id
            }
            return returnValues
        } else { 
            return false 
        }
    } else {
        return false
    }
}

function getDateWithTimeZone(date_time) {
    var d = new Date(date_time); d.toISOString().split('T')[0]+' '+d.toTimeString().split(' ')[0];
    return d
}

const decodeToken = (data) => {
    return decodeURIComponent(escape(atob(reverse(data.slice(0, -5)))))
}

function reverse (s) {
    return s.split('').reverse().join('')
}

async function getLazadaToken (user_id) {
    if(user_id){
        let checkLazadaToken = await query("SELECT `access_token` FROM `access_token_from_lazada` WHERE `user_id` = "+ user_id +" ORDER BY `id` DESC")
        return checkLazadaToken[0].access_token
    } else {
        return false;
    }
}

function search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].SellerSku == nameKey) {
            return myArray[i];
        }
    }
}
module.exports = lazada;