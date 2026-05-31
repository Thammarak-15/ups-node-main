const sql = require("./db.js");
const util = require("util");
const { ShF_log_to_file } = require("../share_function/log_file");
const e = require("cors");
const { execSync } = require("child_process");
var sha256 = require("js-sha256");
const atob = require("atob");
const axios = require("axios")
const crypto = require("crypto");
var Parser = require("fast-xml-parser").j2xParser;
const { response } = require("express");

const query = util.promisify(sql.query).bind(sql);


const shopee = function (shopee) {

}

shopee.getAuth = async (req, result) => {
    var partner_id =  process.env.SHOPEE_LIVE_PARTNER_ID
    var url = process.env.SHOPEE_URL
    var api_name = "/api/v2/shop/auth_partner";
    var api_url = url + api_name
    var timestamp = Math.round(Date.now()/1000)

    const sign_base_string = { 
        "partner_id": partner_id , 
        "api path": api_name,
        "timestamp": timestamp 
    }
    
    sign = await getSign(sign_base_string) 
    const post_string = 'partner_id=' + partner_id +  '&timestamp=' + timestamp + '&sign=' + sign + '&redirect=' + process.env.SHOPEE_CALLBACK_URL
    const result_value = api_url + "?" + post_string
    console.log(api_url + "?" + post_string)

    result(null, result_value);
    return

}

shopee.getAccessToken = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "getAccessTokenShopee.log"
    var url = process.env.SHOPEE_URL
    var api_name = "/api/v2/auth/token/get";
    var api_url = url + api_name
    var code = req.body.code;
    var partner_id =  process.env.SHOPEE_LIVE_PARTNER_ID 
    var shop_id = parseInt(req.body.shop_id)
    var main_account_id = req.body.main_account_id
    // var encodePanitToken = req.body.PanitToken;
    // var PanitToken = decodeToken(encodePanitToken);
    // PanitToken = PanitToken.replace(/"/g, '');

    var timestamp = Math.round(Date.now()/1000)

    // var reqUser = await getSellerShop(PanitToken);
    // if (reqUser != false) {
    //     var user_id_from_db = reqUser.user_id;
    //     var seller_shop_id_from_db = reqUser.seller_shop_id;
    // }

    const sign_base_string = { 
        "partner_id": partner_id , 
        "api path": api_name,
        "timestamp": timestamp
    }
    
    sign = await getSign(sign_base_string) 
    const post_string = 'partner_id=' + partner_id +  '&timestamp=' + timestamp + '&sign=' + sign 
    const post_body = {
        "code": code,
        "shop_id": shop_id,
        "partner_id": parseInt(partner_id)
    }
    console.log("post_string:", post_string)

    try{
        const response = await axios.post(api_url + "?" + post_string, post_body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.data.error == ""){
            console.log("response.data:",response.data)
            //const seller_shop_id = seller_shop_id_from_db
            const seller_shop_id = 16
            const access_token = response.data.access_token
            const refresh_token = response.data.refresh_token
            const shopee_JSON = JSON.stringify(response.data)
            //expire_in = "2021-12-27 9:00:00"
            expire_in = response.data.expire_in + Math.round(Date.now()/1000)
            expire_in = timeConverter(expire_in)
            //const user_id = user_id_from_db
            const user_id = 1
            await query("INSERT INTO `access_token_from_shopee`(seller_shop_id, access_token, refresh_token, shopee_JSON, expire_in, user_id, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [seller_shop_id, access_token, refresh_token, shopee_JSON, expire_in, user_id, shop_id])
            returnValue = { "success" : "Y" }
        } else {
            returnValue = { "success" : "N",
                            "reason" : "insert failed" }
            console.log("response:", response)
        }
    }catch(error){
        console.log(error)
        returnValue = { "success" : "N",
                        "reason" : "call api failed" }
    }

    var log_data = Object.assign({}, returnValue)
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue)
    return
}

shopee.getItemList = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "getItemList.log"
    var partner_id =  process.env.SHOPEE_LIVE_PARTNER_ID
    var url = process.env.SHOPEE_URL
    var api_name_get_item_list = "/api/v2/product/get_item_list"
    var api_url_for_get_item_list = url + api_name_get_item_list
    var api_name_get_base_info = "/api/v2/product/get_item_base_info"
    var api_url_for_get_base_info = url + api_name_get_base_info
    var api_name_for_get_model_list = "/api/v2/product/get_model_list"
    var api_url_for_get_model_list = url + api_name_for_get_model_list
    var timestamp = Math.round(Date.now()/1000)
    const query_result = await query("SELECT access_token, shop_id FROM access_token_from_shopee ORDER BY ID DESC LIMIT 1");
    const access_token = query_result[0].access_token
    const shopee_shop_id  = query_result[0].shop_id
    const sign_base_string_for_get_item_list = { 
        "partner_id": partner_id , 
        "api path": api_name_get_item_list,
        "timestamp": timestamp,
        "access_token": access_token,
        "shop_id": shopee_shop_id
    }
    
    sign_for_get_item_list = await getSign(sign_base_string_for_get_item_list)
    var has_nextPage = true
    var item_id_array = [];
    counter = 0
    offsetValue = 1
    while (has_nextPage == true && counter++ < 10) {
        post_string_for_get_item_list = 'offset=' + offsetValue + '&page_size=' + 100 + '&item_status=NORMAL' + '&shop_id=' + shopee_shop_id + '&partner_id=' + partner_id + '&access_token=' + access_token + '&sign=' + sign_for_get_item_list + '&timestamp=' + timestamp;
        console.log(api_url_for_get_item_list + "?"+post_string_for_get_item_list);
        try {
            let calling_get_item_list_api = "curl -X GET \"" + api_url_for_get_item_list + "?" + post_string_for_get_item_list +"\"";
            res = execSync(calling_get_item_list_api).toString();
            res = JSON.parse(res);
            for (i in res["response"]["item"]){
                item_id_array.push(res["response"]["item"][i]["item_id"])
            }
            if(res.error != ""){
                var log_data_l = {}
                log_data_l.error = error
                log_data_l.execution_time = Date.now() - timeTaken
                log_data = JSON.stringify(log_data)
                ShF_log_to_file("get_item_list", log_data)
            }
            console.log(item_id_array);
        }catch(error){
            console.log(error)
            var log_data = {}
            log_data.error_1 = error
            log_data.execution_time = Date.now() - timeTaken
            log_data = JSON.stringify(log_data)
            ShF_log_to_file(logfile, log_data)
            result(null, error)
            return
        }
        offsetValue+= 100
        has_nextPage = res.response.has_next_page
        //console.log("counter = "+counter);
        //console.log(res);
    }
    //call 2nd api (get_base_info)

    const sign_base_string_for_get_item_base_info = { 
        "partner_id": partner_id , 
        "api path": api_name_get_base_info,
        "timestamp": timestamp,
        "access_token": access_token,
        "shop_id": shopee_shop_id
    }
    
    sign_for_get_item_base_info = await getSign(sign_base_string_for_get_item_base_info)
    var array_list = []
    var allItemInfo = []
    for (let index = 0; index < item_id_array.length; index++) {
        array_list.push(item_id_array[index])
        if((index%49==0 && index != 0) || index == item_id_array.length - 1){
            item_id_list = array_list.toString()
            post_string_for_get_item_base_info = 'item_id_list=' + item_id_list + '&shop_id=' + shopee_shop_id + '&partner_id=' + partner_id + '&access_token=' + access_token + '&sign=' + sign_for_get_item_base_info + '&timestamp=' + timestamp
            try {
                calling_get_base_info_api = "curl -X GET \"" + api_url_for_get_base_info + "?" + post_string_for_get_item_base_info +"\"";
                res = execSync(calling_get_base_info_api).toString();
                res = JSON.parse(res);
                console.log("counter = " + index);
                console.log(res);
                for (let x = 0; x < res["response"]["item_list"].length; x++) {
                    allItemInfo.push(res["response"]["item_list"][x])
                }
            }catch(error){
                console.log(error)
                var log_data = {}
                log_data.error_2 = error
                log_data.execution_time = Date.now() - timeTaken
                log_data = JSON.stringify(log_data)
                ShF_log_to_file(logfile, log_data)
                result(null, error)
                return
            }
            array_list = []
        }
    }
    // var item_id_list = item_id_array.toString()
    // const post_string_for_get_item_base_info = 'item_id_list=' + item_id_list + '&shop_id=' + shopee_shop_id + '&partner_id=' + partner_id + '&access_token=' + access_token + '&sign=' + sign_for_get_item_base_info + '&timestamp=' + timestamp
    // var product_from_base_info = [];
    // try {
    //     let calling_get_base_info_api = "curl -X GET \"" + api_url_for_get_base_info + "?" + post_string_for_get_item_base_info +"\"";
    //     var res;
    //     res = execSync(calling_get_base_info_api).toString();
    //     res = JSON.parse(res);
    //     var allItemInfo = res["response"]["item_list"]
        // for (i in res["response"]["item_list"]){
        //     product_from_base_info.push(res["response"]["item_list"][i])
            
        //     var item_id_from_base_info = product_from_base_info[i]["item_id"]
        //     var category_id_from_base_info = product_from_base_info[i]["category_id"]
        //     var item_name_from_base_info = product_from_base_info[i]["item_name"]
        //     var description_from_base_info = product_from_base_info[i]["item_name"]
        //     var item_sku_from_base_info = product_from_base_info[i]["item_sku"]
        //     var create_time_from_base_info = timeConverter(product_from_base_info[i]["create_time"])
        //     var update_time_from_base_info = timeConverter(product_from_base_info[i]["update_time"])
        //     if (product_from_base_info[i]["attribute_list"]){
        //         var attribute_list_from_base_info = JSON.stringify(product_from_base_info[i]["attribute_list"])
        //     }else{
        //         var attribute_list_from_base_info = ""
        //     }
        //     var image_from_base_info = JSON.stringify(product_from_base_info[i]["image"]["image_url_list"])
        //     var weight_from_base_info = product_from_base_info[i]["weight"]
        //     var dimension_from_base_info = JSON.stringify(product_from_base_info[i]["dimension"])
        //     var logistic_info_from_base_info = JSON.stringify(product_from_base_info[i]["logistic_info"])
        //     var pre_order_from_base_info = JSON.stringify(product_from_base_info[i]["pre_order"])
        //     var condition_from_base_info = product_from_base_info[i]["condition"]
        //     var size_chart_from_base_info = product_from_base_info[i]["size_chart"]
        //     var item_status_from_base_info = product_from_base_info[i]["item_status"]
        //     var has_model_from_base_info = product_from_base_info[i]["has_model"]    
        //     var brand_from_base_info = JSON.stringify(product_from_base_info[i]["brand"])
        //     var item_dangerous_from_base_info = product_from_base_info[i]["item_dangerous"]
        //     var base_info_json = JSON.stringify(product_from_base_info[i])

        //     await query('INSERT INTO `tb_product_shopee_base_info` (item_id, category_id, item_name, description, item_sku, create_time, update_time, attribute_list, image, weight, dimension, logistic_info, pre_order, item_condition, size_chart, item_status, has_model, brand, item_dangerous, base_info_JSON) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[item_id_from_base_info, category_id_from_base_info
        //         , item_name_from_base_info, description_from_base_info
        //         , item_sku_from_base_info, create_time_from_base_info, update_time_from_base_info, attribute_list_from_base_info
        //         , image_from_base_info, weight_from_base_info, dimension_from_base_info, logistic_info_from_base_info, pre_order_from_base_info, condition_from_base_info, size_chart_from_base_info, item_status_from_base_info
        //         , has_model_from_base_info, brand_from_base_info, item_dangerous_from_base_info, base_info_json
        //         ])

        // }
        
    // }catch(error){
    //     console.log(error)
    //     var log_data = {}
    //     log_data.error_2 = error
    //     log_data.execution_time = Date.now() - timeTaken
    //     log_data = JSON.stringify(log_data)
    //     ShF_log_to_file(logfile, log_data)
    //     result(null, error)
    //     return
    // }

    // call 3rd api (get_model_list)
    // const sign_base_string_for_get_model_list = { 
    //     "partner_id": partner_id , 
    //     "api path": api_name_for_get_model_list,
    //     "timestamp": timestamp,
    //     "access_token": access_token,
    //     "shop_id": shopee_shop_id
    // }
    
    // sign_for_get_model_list = await getSign(sign_base_string_for_get_model_list) 

    // for (i in item_id_array){
    //     console.log(item_id_array[i])
    //     var post_string_for_get_model_list = 'item_id=' + item_id_array[i] + '&shop_id=' + shopee_shop_id + '&partner_id=' + partner_id + '&access_token=' + access_token + '&sign=' + sign_for_get_model_list + '&timestamp=' + timestamp

    //     try{
    //         let calling_get_base_info_api = "curl -X GET \"" + api_url_for_get_model_list + "?" + post_string_for_get_model_list +"\"";
    //         var res;
    //         res = execSync(calling_get_base_info_api).toString();
    //         res = JSON.parse(res);
    //         var response_from_get_model_list = [];
    //         console.log("response:", res["response"])

    //         for (j in res["response"]){
    //             response_from_get_model_list.push(res["response"][j])
    //         }

    //         var undefined_checker = response_from_get_model_list[0][0]
            
    //         if(typeof undefined_checker !== 'undefined'){
    //             var tier_variation_from_get_model_list = JSON.stringify(response_from_get_model_list[0][0])
    //             var model_from_get_model_list = JSON.stringify(response_from_get_model_list[1][0])
    //             console.log("TEST:", response_from_get_model_list[1][0])
    //             await query('INSERT INTO `tb_product_shopee_model_list` (tier_variation, model) VALUES(?, ?)',[tier_variation_from_get_model_list, model_from_get_model_list])

    //         }else{
    //             continue
    //         }
            
    //     }catch(error){
    //         console.log(error)
    //     }
    // }
    //getItemModelFromShopee(allItemInfo)
    getItemFromShopee(allItemInfo)
    var log_data = {"status" : "Y"}
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, {"status" : "Y"})
    return
}

async function getItemFromShopee(data) {
    var timeTaken = Date.now()
    var logfile = "getItemFromShopee.log"
    var url = process.env.SHOPEE_URL
    var partner_id =  process.env.SHOPEE_LIVE_PARTNER_ID
    var api_name_for_get_model_list = "/api/v2/product/get_model_list"
    var api_url_for_get_model_list = url + api_name_for_get_model_list
    var timestamp = Math.round(Date.now()/1000)
    const query_result = await query("SELECT access_token, shop_id FROM access_token_from_shopee ORDER BY ID DESC LIMIT 1");
    const access_token = query_result[0].access_token
    const shopee_shop_id  = query_result[0].shop_id
    const sign_base_string_for_get_model_list = { 
        "partner_id": partner_id , 
        "api path": api_name_for_get_model_list,
        "timestamp": timestamp,
        "access_token": access_token,
        "shop_id": shopee_shop_id
    }
    var sign_for_get_model_list = await getSign(sign_base_string_for_get_model_list) 
    for (let index = 0; index < data.length; index++) {
        var element = data[index];
        let id = element.item_id
        if (element.has_model == false){
            await query("INSERT INTO tb_product_shopee_base_info (item_id, model_key_id, category_id, item_name, description, item_sku, attribute_list, image, weight, dimension, logistic_info, pre_order, item_condition, size_chart, item_status, has_model, brand, item_dangerous, base_info_JSON) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE brand = VALUES(brand)",
            [element.item_id, element.item_id,element.category_id, element.item_name, element.description, element.item_sku, JSON.stringify(element.attribute_list), 
                JSON.stringify(element.image), element.weight, JSON.stringify(element.dimension), JSON.stringify(element.logistic_info), JSON.stringify(element.pre_order), 
                element.item_condition, element.size_chart, element.item_status, element.has_model, JSON.stringify(element.brand), element.item_dangerous, JSON.stringify(element)])
                var log_data = element
                log_data.execution_time = Date.now() - timeTaken
                log_data = JSON.stringify(log_data)
                ShF_log_to_file(logfile, log_data)
        } else {
            let post_string_for_get_model_list = 'item_id=' + id + '&shop_id=' + shopee_shop_id + '&partner_id=' + partner_id + '&access_token=' + access_token + '&sign=' + sign_for_get_model_list + '&timestamp=' + timestamp
            try {
                let calling_get_base_info_api = "curl -X GET \"" + api_url_for_get_model_list + "?" + post_string_for_get_model_list +"\"";
                var res;
                res = execSync(calling_get_base_info_api).toString();
                res = JSON.parse(res);
                if(res.error == ""){
                    let attribute = res.response.tier_variation
                    let model = res.response.model
                    for (let y = 0; y < model.length; y++) {
                        let thisKey = String(element.item_id) + "_" + String(model[y].model_id)
                        await query("INSERT INTO tb_product_shopee_base_info (item_id, model_id, model_key_id, category_id, item_name, description, item_sku, attribute_list, image, weight, dimension, logistic_info, pre_order, item_condition, size_chart, item_status, has_model, brand, item_dangerous, base_info_JSON) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE brand = VALUES(brand)",
                        [element.item_id, model[y].model_id, thisKey,element.category_id, element.item_name, element.description, model[y].model_sku, JSON.stringify(element.attribute_list), 
                            JSON.stringify(element.image), element.weight, JSON.stringify(element.dimension), JSON.stringify(element.logistic_info), JSON.stringify(element.pre_order), 
                            element.item_condition, element.size_chart, element.item_status, element.has_model, JSON.stringify(element.brand), element.item_dangerous, JSON.stringify(element)])
                    }
                }
                var log_data = element
                log_data.response = res
                log_data.execution_time = Date.now() - timeTaken
                log_data = JSON.stringify(log_data)
                ShF_log_to_file(logfile, log_data)
            } catch (error) {
                console.log(error);
                var log_data = error
                log_data.execution_time = Date.now() - timeTaken
                log_data = JSON.stringify(log_data)
                ShF_log_to_file(logfile, log_data)
            }
        }
    }
}

shopee.mapProduct_UPS_with_shopee = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "mapProduct_UPS_with_shopee.log"
    var id = req.body.id;
    var product_id = req.body.panit_product_id;
    var product_sku = req.body.panit_product_sku
    var product_sku_id = req.body.panit_product_sku_id
    try {
        await query("UPDATE `tb_product_shopee_base_info` SET `panit_product_id` = ?,  `panit_product_sku` = ?, `panit_product_sku_id` = ? WHERE `id` = ?", [product_id, product_sku, product_sku_id, id]);
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

shopee.autoMapProductBySKU = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "autoMapProductBySKUShopee.log"
    var returnValue;
    var reqUser = await getSellerShop(req.body.PanitToken);
    if(reqUser != false){
        //var seller_shop = reqUser.seller_shop_id;
        try {
            var data_product_from_shopee_not_map = await query("SELECT * FROM `tb_product_shopee_base_info` WHERE `panit_product_id` IS NULL AND `panit_product_sku` IS NULL"); 
        } catch (error) {
            returnValue = error;
        }
        if (data_product_from_shopee_not_map.length > 0){
            for (let index = 0; index < data_product_from_shopee_not_map.length; index++) {
                let this_id_shopee_product_table = data_product_from_shopee_not_map[index].id;
                let this_shopee_produuct_SKUseller = data_product_from_shopee_not_map[index].item_sku;
                if(data_product_from_shopee_not_map[index].has_model == 0) {
                    try {
                        var data_product_panit_like_shopee_sku = await query("SELECT `id`, `sku` FROM `ms_product` WHERE `sku` LIKE '"+ this_shopee_produuct_SKUseller +"'");
                        console.log(this_id_shopee_product_table);
                        console.log(data_product_panit_like_shopee_sku);
                        if(data_product_panit_like_shopee_sku.length > 0 && data_product_panit_like_shopee_sku.length == 1){
                            await query("UPDATE `tb_product_shopee_base_info` SET `panit_product_id` = "+data_product_panit_like_shopee_sku[0].id+", `panit_product_sku` = '"+data_product_panit_like_shopee_sku[0].sku+"' WHERE `id` = "+this_id_shopee_product_table+"");
                        } 
                    } catch (error) {
                        returnValue = error;
                    }
                } else if (data_product_from_shopee_not_map[index].has_model == 1){
                    try {
                        var data_product_attribue_panit_like_shopee_sku = await query("SELECT `id`, `product_id`, `new_sku` FROM `ms_product_attribute` WHERE `new_sku` LIKE '"+this_shopee_produuct_SKUseller+"'");
                    } catch (error) {
                        returnValue = error;
                    }
                    if(data_product_attribue_panit_like_shopee_sku.length > 0 && data_product_attribue_panit_like_shopee_sku.length == 1){
                        try {
                            await query("UPDATE `tb_product_shopee_base_info` SET `panit_product_id` = "+data_product_attribue_panit_like_shopee_sku[0].product_id+", `panit_product_sku` = '"+data_product_attribue_panit_like_shopee_sku[0].new_sku+"', panit_product_sku_id = "+data_product_attribue_panit_like_shopee_sku[0].id+" WHERE `id` = "+this_id_shopee_product_table+"");
                        } catch (error) {
                            returnValue = error;
                        }
                    }
                }
            }
            returnValue = { "code" : "0" }
        } else {
            returnValue = { "code" : "0",
                            "message" : "All product in shopee already map" }
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

shopee.selectProductToUpdateStock = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "selectProductToUpdateStockShopee.log"
    var id = req.body.id;
    var sync_product = req.body.sync_product;
    try {
        await query("UPDATE `tb_product_shopee_base_info` SET `sync_stock` = ? WHERE `id` IN (?)", [sync_product, id]);
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

shopee.updateStock = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "updateStockShopee.log"
    var count_err_update = 0
    var partner_id =  process.env.SHOPEE_LIVE_PARTNER_ID
    var url = process.env.SHOPEE_URL
    var api_name = "/api/v2/product/update_stock"
    var full_url = url + api_name
    var timestamp = Math.round(Date.now()/1000)
    const query_result = await query("SELECT access_token, shop_id FROM access_token_from_shopee ORDER BY ID DESC LIMIT 1");
    const access_token = query_result[0].access_token
    const shopee_shop_id  = query_result[0].shop_id
    const base_string = {
        "partner_id": partner_id , 
        "api path": api_name,
        "timestamp": timestamp,
        "access_token": access_token,
        "shop_id": shopee_shop_id
    }
    var sign = await getSign(base_string) 
    const post_string = 'shop_id=' + shopee_shop_id + '&partner_id=' + partner_id + '&access_token=' + access_token + '&sign=' + sign + '&timestamp=' + timestamp
    var product_array = []
    var product = await query("SELECT `id`, `item_id`, `model_id`, `panit_product_id`, `panit_product_sku`, `panit_product_sku_id`, `has_model`, `sync_stock` FROM `tb_product_shopee_base_info` WHERE `sync_stock` = 'yes' AND `panit_product_id` IS NOT NULL")
    for (let index = 0; index < product.length; index++) {
        let item_id = product[index].item_id
        let model_id = (product[index].model_id == null) ? 0 : parseInt(product[index].model_id)
        let normal_stock = 0
        if(product[index].has_model == 0){
            let stock = await query("SELECT `inventory_stock` FROM `ms_product` WHERE id = ?", product[index].panit_product_id)
            normal_stock = stock[0].inventory_stock
        } else if (product[index].has_model == 1){
            let stock_att = await query("SELECT `effective_stock` FROM `ms_product_attribute` WHERE `id` = ?", product[index].panit_product_sku_id)
            normal_stock = stock_att[0].effective_stock
        }
        var res = await axios.post(full_url + "?" +post_string, {
            "item_id": item_id,
            "stock_list": [
                {
                    "model_id": model_id,
                    "normal_stock": normal_stock
                }
            ]
        });
        product_array.push(product[index].id)
        if(res.data.error != ""){
            count_err_update += 1
        }
        var log_data = Object.assign({}, res.data)
        log_data.execution_time = Date.now() - timeTaken
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(logfile, log_data)
    }
    await query("UPDATE `tb_product_shopee_base_info` SET `sync_stock` = 'no' WHERE id in (?)",[product_array])
    if(count_err_update == 0){
        resultValue = {"status" : "Y"}
    } else {
        resultValue = {"status" : "N",
                        "message" : "some product can not update stock"}
    }
    result(null, resultValue)
    return
}

shopee.listProductMap = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "listProductShopeeMap.log"
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {}
    if(reqUser != false){
        try {
            var list_product_map = await query("SELECT `id`, `panit_product_id`, `item_id`, `panit_product_sku`, `item_sku`, `model_id` FROM `tb_product_shopee_base_info` WHERE `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL");
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

shopee.listProductNotMap = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "listProductShopeeMap.log"
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {}
    if(reqUser != false){
        try {
            var list_product_map = await query("SELECT `id`, `panit_product_id`, `item_id`, `panit_product_sku`, `item_sku`, `model_id` FROM `tb_product_shopee_base_info` WHERE `panit_product_id` IS NULL AND `panit_product_sku` IS NULL");
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

shopee.listProductBeforeSyncStock = async (req, result) => {
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {};
    if(reqUser != false){
        try {
            var list_product_map = await query("SELECT `id`, `panit_product_id`, `item_id`, `panit_product_sku`, `item_sku` FROM `tb_product_shopee_base_info` WHERE `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL");
            if(list_product_map.length > 0){
                var list_product_arr = [];
                for (let index = 0; index < list_product_map.length; index++) {
                    console.log(index);
                    let list_product_tmp = {};
                    let panit_id = list_product_map[index].panit_product_id;
                    let panit_sku = list_product_map[index].panit_product_sku;
                    have_att = await query("SELECT `have_attribute`, `name` FROM `ms_product` WHERE id = ?", panit_id)
                    let product_url = process.env.PATH_DETAIL_PRODUCT_UPS + encodeURIComponent(have_att[0].name + '-' + panit_id)
                    if (have_att[0].have_attribute == 'no'){
                        let stock_have_no_att = await query("SELECT `inventory_stock`, `name` FROM `ms_product` WHERE `id` = ? AND `sku` = ?", [panit_id, panit_sku]);
                        panit_stock = stock_have_no_att[0].inventory_stock;
                        panit_name = stock_have_no_att[0].name;
                    } else {
                        console.log(panit_id);
                        console.log(panit_sku);
                        let stock_have_yes_att = await query("SELECT `attribute_priority_1` , `attribute_priority_2`, `effective_stock` FROM `ms_product_attribute` WHERE `product_id` = ? AND `new_sku` = ?",[panit_id, panit_sku]);
                        console.log(stock_have_yes_att);
                        panit_stock = stock_have_yes_att[0].effective_stock
                        let name1 = (stock_have_yes_att[0].attribute_priority_1 == null) ? " " : stock_have_yes_att[0].attribute_priority_1;
                        let name2 = (stock_have_yes_att[0].attribute_priority_2 == null) ? " " : stock_have_yes_att[0].attribute_priority_2;
                        panit_name = have_att[0].name + name1 + name2
                    }
                    if(panit_stock <= 0){
                        this_product_can_sync = true;
                    } else {
                        this_product_can_sync = false;
                    }
                    list_product_tmp.id = list_product_map[index].id;
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
            console.log(error);
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

shopee.listProductUPSNotMap = async (req, result) => {
    var reqUser = await getSellerShop(req.body.PanitToken);
    var returnValue = {};
    var product_arr = [];
    if(reqUser != false){
        //var seller_shop = reqUser.seller_shop_id;
        try {
            var product_ups_mapped = await query("SELECT `panit_product_sku` FROM `tb_product_shopee_base_info` WHERE `panit_product_id` IS NOT NULL AND `panit_product_sku` IS NOT NULL");
            for (let index = 0; index < product_ups_mapped.length; index++) {
                product_ups_mapped[index] = product_ups_mapped[index].panit_product_sku;
            }
            if(product_ups_mapped.length == 0){
                product_ups_mapped = ""
            }
            var product_ups = await query("SELECT * FROM `ms_product` WHERE `sku` NOT IN (?)", [product_ups_mapped]);
            if(product_ups.length > 0){
                for (let index = 0; index < product_ups.length; index++) {
                    let product_ups_tmp = {};
                    let product_url = process.env.PATH_DETAIL_PRODUCT_UPS + encodeURIComponent(product_ups[index].name + '-' + product_ups[index].id);
                    if(product_ups[index].have_attribute == 'no'){
                        product_ups_tmp.ups_product_id = product_ups[index].id;
                        product_ups_tmp.panit_product_sku_id = null
                        product_ups_tmp.sku = product_ups[index].sku;
                        product_ups_tmp.name = product_ups[index].name;
                        product_ups_tmp.link = product_url;
                        product_arr.push(product_ups_tmp)
                    } else if (product_ups[index].have_attribute == 'yes') {
                        let product_att = await query("SELECT * FROM `ms_product_attribute` WHERE `product_id` = ? AND `new_sku` NOT IN (?)", [product_ups[index].id, product_ups_mapped]);
                        if (product_att.length > 0) {
                            for (let x = 0; x < product_att.length; x++) {
                                let product_ups_tmp = {};
                                let name1 = (product_att[x].attribute_priority_1 == null) ? "" : product_att[x].attribute_priority_1;
                                let name2 = (product_att[x].attribute_priority_2 == null) ? "" : product_att[x].attribute_priority_2;
                                product_ups_tmp.ups_product_id = product_att[x].product_id;
                                product_ups_tmp.panit_product_sku_id = product_att[x].id
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

async function getSign(params) {
    let stringSignTemp = "";
    for (const [key, value] of Object.entries(params)) {
        stringSignTemp = stringSignTemp + value 
    }
    var sign = crypto.createHmac('sha256', process.env.SHOPEE_LIVE_KEY)
                    .update(stringSignTemp)
                    .digest('hex')
    return sign
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

const decodeToken = (data) => {
    return decodeURIComponent(escape(atob(reverse(data.slice(0, -5)))))
}

function reverse (s) {
    return s.split('').reverse().join('')
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    //var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = a.getMonth() + 1 < 10 ? '0' + (a.getMonth() + 1) : (a.getMonth() + 1);
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes(); 
    var sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
    var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }

module.exports = shopee;