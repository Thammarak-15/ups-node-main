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

const query = util.promisify(sql.query).bind(sql);

const lazada_order = function (lazada_order) {
    this.id = lazada_order.id
    this.order_id = lazada_order.order_id
    this.order_number = lazada_order.order_number
    this.warehouse_code = lazada_order.warehouse_code
    this.voucher_code = lazada_order.voucher_code
    this.voucher = lazada_order.voucher
    this.gift_option = lazada_order.gift_option
    this.shipping_fee_discount_platform = lazada_order.shipping_fee_discount_platform
    this.customer_first_name = lazada_order.customer_first_name
    this.customer_last_name = lazada_order.customer_last_name
    this.price = lazada_order.price
    this.national_registration_number = lazada_order.national_registration_number
    this.shipping_fee_original = lazada_order.shipping_fee_original
    this.payment_method = lazada_order.payment_method
    this.shipping_fee_discount_seller = lazada_order.shipping_fee_discount_seller
    this.shipping_fee = lazada_order.shipping_fee
    this.branch_number = lazada_order.branch_number
    this.tax_code = lazada_order.tax_code
    this.items_count = lazada_order.items_count
    this.delivery_info = lazada_order.delivery_info
    this.statuses = lazada_order.statuses
    this.address_billing = lazada_order.address_billing
    this.extra_attributes = lazada_order.extra_attributes
    this.gift_message = lazada_order.gift_message
    this.remarks = lazada_order.remarks
    this.address_shipping = lazada_order.address_shipping
    this.promised_shipping_times = lazada_order.promised_shipping_times
    this.created_at = lazada_order.created_at
    this.updated_at = lazada_order.updated_at
}

lazada_order.getOrder = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "getOrder_lazada.log"
    apiName = "/order/get"
    allOrders = []
    reqObject = {}
    reqObject.app_key = "106410"
    reqObject.timestamp = Date.now()
    reqObject.order_id = req.body.order_id
    reqObject.access_token = "50000900521VredqMkvAJGS4nUbY5gWEm1b28becbTZrpFfFBv6P0vGmFMgYb3"
    reqObject.sign_method = "sha256"
    reqObject.sign = await getSign(apiName, reqObject)
    post_string = await buildRequestParam(reqObject)
    call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + apiName + "?"+ post_string +"\""
    try {
        res = execSync(call_api).toString();
        res = JSON.parse(res);
        if(res.code == "0"){
            order = []
            for (let this_order in res.data) {
                order.push(JSON.stringify(res.data[this_order]))
            }
            allOrders.push(order)
            returnValue = {
                "code" : 0
            }
        } else {
            result(null, res)
        }
    } catch (error) {
        console.log(error);
        returnValue = error
    }
    try {
        await query("INSERT INTO `lazada_order` (`voucher`, `warehouse_code`, `order_number`, `created_at`, `voucher_code`, `gift_option`, `shipping_fee_discount_platform`, `customer_last_name`, `updated_at`, `promised_shipping_times`, `price`, `national_registration_number`, `shipping_fee_original`, `payment_method`, `customer_first_name`, `shipping_fee_discount_seller`, `shipping_fee`, `branch_number`, `tax_code`, `items_count`, `delivery_info`, `statuses`, `address_billing`, `extra_attributes`, `order_id`, `gift_message`, `remarks`, `address_shipping`) VALUES ? ON DUPLICATE KEY UPDATE voucher_platform=VALUES(voucher_platform), voucher=VALUES(voucher), warehouse_code=VALUES(warehouse_code), order_number=VALUES(order_number), voucher_seller=VALUES(voucher_seller), created_at=VALUES(created_at), voucher_code=VALUES(voucher_code), gift_option=VALUES(gift_option), shipping_fee_discount_platform=VALUES(shipping_fee_discount_platform), customer_last_name=VALUES(customer_last_name), promised_shipping_times=VALUES(promised_shipping_times), updated_at=VALUES(updated_at), price=VALUES(price), national_registration_number=VALUES(national_registration_number), shipping_fee_original=VALUES(shipping_fee_original), payment_method=VALUES(payment_method), customer_first_name=VALUES(customer_first_name), shipping_fee_discount_seller=VALUES(shipping_fee_discount_seller), shipping_fee=VALUES(shipping_fee), branch_number=VALUES(branch_number), tax_code=VALUES(tax_code), items_count=VALUES(items_count), delivery_info=VALUES(delivery_info), statuses=VALUES(statuses), address_billing=VALUES(address_billing), extra_attributes=VALUES(extra_attributes), order_id=VALUES(order_id), remarks=VALUES(remarks), gift_message=VALUES(gift_message), address_shipping=VALUES(address_shipping)",[allOrders])
    } catch (error) {
        console.log(error);
        returnValue = error
    }
    log_data = JSON.parse(JSON.stringify(returnValue))
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue)
}

lazada_order.getOrders = async (req, result) => {
    var timeTaken = Date.now()
    var logfile = "getOrders_lazada.log"
    apiName = "/orders/get"
    offsetValue = 1
    allOrders= []
    req.body = clean(req.body)
    do {
        reqObject = JSON.parse(JSON.stringify(req.body))
        reqObject.offset = offsetValue
        reqObject.limit = 100
        reqObject.sort_by = "created_at"
        reqObject.app_key = "106410"
        reqObject.timestamp = Date.now()
        reqObject.access_token = "50000900521VredqMkvAJGS4nUbY5gWEm1b28becbTZrpFfFBv6P0vGmFMgYb3"
        reqObject.sign_method = "sha256"
        reqObject.sign = await getSign(apiName, reqObject)
        post_string = await buildRequestParam(reqObject)
        //post_string = encodeURIComponent(post_string)
        post_string = post_string.replace(/\:/g, "%3A")
        post_string = post_string.replace(/\+/g, "%2B")
        call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + apiName + "?"+ post_string +"\""
        try {
            res = execSync(call_api).toString();
            res = JSON.parse(res);
            if(res.code == "0"){
                for (var index = 0; index < res.data.orders.length; index++) {
                    order = []
                    for (let this_order in res.data.orders[index]) {
                        order.push(JSON.stringify(res.data.orders[index][this_order]))
                    }
                    allOrders.push(order)
                }
                returnValue = {
                    "code" : 0
                }
            } else {
                result(null, res)
            }
        } catch (error) {
            console.log(error);
            returnValue = error
        }
        offsetValue += 100
    } while (!(res.data.count < reqObject.limit))
    try {
        await query("INSERT INTO `lazada_order` (`voucher_platform`, `voucher`, `warehouse_code`, `order_number`, `voucher_seller`, `created_at`, `voucher_code`, `gift_option`, `shipping_fee_discount_platform`, `customer_last_name`, `promised_shipping_times`, `updated_at`, `price`, `national_registration_number`, `shipping_fee_original`, `payment_method`, `customer_first_name`, `shipping_fee_discount_seller`, `shipping_fee`, `branch_number`, `tax_code`, `items_count`, `delivery_info`, `statuses`, `address_billing`, `extra_attributes`, `order_id`, `remarks`, `gift_message`, `address_shipping`) VALUES ? ON DUPLICATE KEY UPDATE voucher_platform=VALUES(voucher_platform), voucher=VALUES(voucher), warehouse_code=VALUES(warehouse_code), order_number=VALUES(order_number), voucher_seller=VALUES(voucher_seller), created_at=VALUES(created_at), voucher_code=VALUES(voucher_code), gift_option=VALUES(gift_option), shipping_fee_discount_platform=VALUES(shipping_fee_discount_platform), customer_last_name=VALUES(customer_last_name), promised_shipping_times=VALUES(promised_shipping_times), updated_at=VALUES(updated_at), price=VALUES(price), national_registration_number=VALUES(national_registration_number), shipping_fee_original=VALUES(shipping_fee_original), payment_method=VALUES(payment_method), customer_first_name=VALUES(customer_first_name), shipping_fee_discount_seller=VALUES(shipping_fee_discount_seller), shipping_fee=VALUES(shipping_fee), branch_number=VALUES(branch_number), tax_code=VALUES(tax_code), items_count=VALUES(items_count), delivery_info=VALUES(delivery_info), statuses=VALUES(statuses), address_billing=VALUES(address_billing), extra_attributes=VALUES(extra_attributes), order_id=VALUES(order_id), remarks=VALUES(remarks), gift_message=VALUES(gift_message), address_shipping=VALUES(address_shipping)",[allOrders])
    } catch (error) {
        console.log(error);
        returnValue = error
    }
    log_data = JSON.parse(JSON.stringify(returnValue))
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null, returnValue)
}

lazada_order.getOrderItems = async (req, result) => {
    timeTaken = Date.now()
    logfile = "getOrderItems_lazada.log"
    apiName = "/order/items/get"
    reqObject = {}
    allOrderItems = []
    reqObject.app_key = "106410"
    reqObject.timestamp = Date.now()
    reqObject.order_id = req.body.order_id
    reqObject.access_token = "50000900521VredqMkvAJGS4nUbY5gWEm1b28becbTZrpFfFBv6P0vGmFMgYb3"
    reqObject.sign_method = "sha256"
    reqObject.sign = await getSign(apiName, reqObject)
    post_string = await buildRequestParam(reqObject)
    call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + apiName + "?"+ post_string +"\""
    try {
        res = execSync(call_api).toString();
        res = JSON.parse(res);
        //console.log(res);
        if(res.code == "0"){
            for (let index = 0; index < res.data.length; index++) {
                orderItem = []
                for(let this_item in res.data[index]){
                    if(typeof(res.data[index][this_item]) != "string") {
                        orderItem.push(JSON.stringify(res.data[index][this_item]))
                    } else {
                        orderItem.push(res.data[index][this_item])
                    }
                }
                allOrderItems.push(orderItem)
            }
        }
        insertSql = "INSERT INTO `lazada_order_info` (`pick_up_store_info`, `tax_amount`, `reason`, `sla_time_stamp`, `voucher_seller`, `purchase_order_id`, `voucher_code_seller`, `voucher_code`, `package_id`, `buyer_id`, `variation`, `product_id`, `voucher_code_platform`, `purchase_order_number`, `sku`, `order_type`, `invoice_number`, `cancel_return_initiator`, `shop_sku`, `is_reroute`, `stage_pay_status`, `sku_id`, `tracking_code_pre`, `order_item_id`, `shop_id`, `order_flag`, `is_fbl`, `name`, `delivery_option_sof`, `order_id`, `status`, `product_main_image`, `voucher_platform`, `paid_price`, `product_detail_url`, `warehouse_code`, `promised_shipping_time`, `shipping_type`, `created_at`, `voucher_seller_lpi`, `shipping_fee_discount_platform`, `wallet_credits`, `updated_at`, `currency`, `shipping_provider_type`, `voucher_platform_lpi`, `shipping_fee_original`, `item_price`, `is_digital`, `shipping_service_cost`, `tracking_code`, `shipping_fee_discount_seller`, `shipping_amount`, `reason_detail`, `return_status`, `shipment_provider`, `voucher_amount`, `digital_delivery_info`, `extra_attributes`) VALUES ? ON DUPLICATE KEY UPDATE pick_up_store_info=VALUES(pick_up_store_info), tax_amount=VALUES(tax_amount), reason=VALUES(reason), sla_time_stamp=VALUES(sla_time_stamp), voucher_seller=VALUES(voucher_seller), purchase_order_id=VALUES(purchase_order_id), voucher_code_seller=VALUES(voucher_code_seller), voucher_code=VALUES(voucher_code), package_id=VALUES(package_id), buyer_id=VALUES(buyer_id), variation=VALUES(variation), product_id=VALUES(product_id), voucher_code_platform=VALUES(voucher_code_platform), purchase_order_number=VALUES(purchase_order_number), sku=VALUES(sku), order_type=VALUES(order_type), invoice_number=VALUES(invoice_number), cancel_return_initiator=VALUES(cancel_return_initiator), shop_sku=VALUES(shop_sku), is_reroute=VALUES(is_reroute), stage_pay_status=VALUES(stage_pay_status), sku_id=VALUES(sku_id), tracking_code_pre=VALUES(tracking_code_pre), order_item_id=VALUES(order_item_id), shop_id=VALUES(shop_id), order_flag=VALUES(order_flag), is_fbl=VALUES(is_fbl), name=VALUES(name), delivery_option_sof=VALUES(delivery_option_sof), order_id=VALUES(order_id), status=VALUES(status), product_main_image=VALUES(product_main_image), voucher_platform=VALUES(voucher_platform), paid_price=VALUES(paid_price), product_detail_url=VALUES(product_detail_url), promised_shipping_time=VALUES(promised_shipping_time), shipping_type=VALUES(shipping_type)"
        insertSql2 = ", created_at=VALUES(created_at), voucher_seller_lpi=VALUES(voucher_seller_lpi), shipping_fee_discount_platform=VALUES(shipping_fee_discount_platform), wallet_credits=VALUES(wallet_credits), updated_at=VALUES(updated_at), currency=VALUES(currency), shipping_provider_type=VALUES(shipping_provider_type), voucher_platform_lpi=VALUES(voucher_platform_lpi), shipping_fee_original=VALUES(shipping_fee_original), item_price=VALUES(item_price), is_digital=VALUES(is_digital), shipping_service_cost=VALUES(shipping_service_cost), tracking_code=VALUES(tracking_code), shipping_fee_discount_seller=VALUES(shipping_fee_discount_seller), shipping_amount=VALUES(shipping_amount), reason_detail=VALUES(reason_detail), return_status=VALUES(return_status), shipment_provider=VALUES(shipment_provider), voucher_amount=VALUES(voucher_amount), digital_delivery_info=VALUES(digital_delivery_info), extra_attributes=VALUES(extra_attributes)"
        insertSql = insertSql + insertSql2
        //console.log(insertSql);
        await query(insertSql, [allOrderItems])
        resultValue = {"code" : "0"}
    } catch (error) {
        console.log(error);
        resultValue = error
    }
    log_data = JSON.parse(JSON.stringify(resultValue))
    log_data.execution_time = Date.now() - timeTaken
    log_data = JSON.stringify(log_data)
    ShF_log_to_file(logfile, log_data)
    result(null ,resultValue)
}

lazada_order.getMultipleOrderItems = async (req, result) => {
    apiName = "/orders/items/get"
    order_ids_array = []
    allOrderItems = []
    for (let index = 0; index < req.body.order_ids.length; index++) {
        order_ids_array.push(req.body.order_ids[index])
        if((index % 99 == 0 && index != 0) || index == req.body.order_ids.length-1){
            reqObject = {}
            reqObject.app_key = "106410"
            reqObject.timestamp = Date.now()
            reqObject.order_ids = JSON.stringify(order_ids_array)
            reqObject.access_token = "50000900521VredqMkvAJGS4nUbY5gWEm1b28becbTZrpFfFBv6P0vGmFMgYb3"
            reqObject.sign_method = "sha256"
            reqObject.sign = await getSign(apiName, reqObject)
            post_string = await buildRequestParam(reqObject)
            call_api = "curl -X GET \"" + process.env.LAZADA_URLs + "" + apiName + "?"+ post_string +"\""
            console.log(call_api);
            try {
                res = execSync(call_api).toString();
                res = JSON.parse(res);
                //console.log(res);
                if(res.code=="0"){
                    for (let index = 0; index < res.data.length; index++) {
                        for (let x = 0; x < res.data[index].order_items.length; x++) {
                            orderItem = []
                            orderItem.push(JSON.stringify(res.data[index].order_number))
                            for(let y in res.data[index].order_items[x]){
                                if(typeof(res.data[index].order_items[x][y]) != "string"){
                                    orderItem.push(JSON.stringify(res.data[index].order_items[x][y]))
                                } else {
                                    orderItem.push(res.data[index].order_items[x][y])
                                }
                            }
                            allOrderItems.push(orderItem)
                        }
                    }
                    insertSql = "INSERT INTO `lazada_order_info` (`order_number`, `pick_up_store_info`, `tax_amount`, `reason`, `sla_time_stamp`, `voucher_seller`, `purchase_order_id`, `voucher_code_seller`, `voucher_code`, `package_id`, `buyer_id`, `variation`, `voucher_code_platform`, `purchase_order_number`, `sku`, `order_type`, `invoice_number`, `cancel_return_initiator`, `shop_sku`, `is_reroute`, `stage_pay_status`, `sku_id`, `tracking_code_pre`, `order_item_id`, `shop_id`, `order_flag`, `is_fbl`, `name`, `delivery_option_sof`, `order_id`, `status`, `paid_price`, `product_main_image`, `voucher_platform`, `product_detail_url`, `warehouse_code`, `promised_shipping_time`, `shipping_type`, `created_at`, `voucher_seller_lpi`, `shipping_fee_discount_platform`, `wallet_credits`, `updated_at`, `currency`, `shipping_provider_type`, `shipping_fee_original`, `voucher_platform_lpi`, `is_digital`, `item_price`, `shipping_service_cost`, `tracking_code`, `shipping_fee_discount_seller`, `shipping_amount`, `reason_detail`, `return_status`, `shipment_provider`, `voucher_amount`, `digital_delivery_info`, `extra_attributes`) VALUES ? ON DUPLICATE KEY UPDATE order_number=VALUES(order_number), order_id=VALUES(order_id), pick_up_store_info=VALUES(pick_up_store_info), tax_amount=VALUES(tax_amount), reason=VALUES(reason), sla_time_stamp=VALUES(sla_time_stamp), voucher_seller=VALUES(voucher_seller), purchase_order_id=VALUES(purchase_order_id), voucher_code_seller=VALUES(voucher_code_seller), voucher_code=VALUES(voucher_code), package_id=VALUES(package_id), buyer_id=VALUES(buyer_id), variation=VALUES(variation), voucher_code_platform=VALUES(voucher_code_platform), purchase_order_number=VALUES(purchase_order_number), sku=VALUES(sku), order_type=VALUES(order_type), invoice_number=VALUES(invoice_number), cancel_return_initiator=VALUES(cancel_return_initiator), shop_sku=VALUES(shop_sku), is_reroute=VALUES(is_reroute), stage_pay_status=VALUES(stage_pay_status), sku_id=VALUES(sku_id), tracking_code_pre=VALUES(tracking_code_pre), order_item_id=VALUES(order_item_id), shop_id=VALUES(shop_id), order_flag=VALUES(order_flag), is_fbl=VALUES(is_fbl), name=VALUES(name), delivery_option_sof=VALUES(delivery_option_sof), order_id=VALUES(order_id), status=VALUES(status), paid_price=VALUES(paid_price),product_main_image=VALUES(product_main_image), voucher_platform=VALUES(voucher_platform), product_detail_url=VALUES(product_detail_url),"
                    insertSql2 = " warehouse_code=VALUES(warehouse_code), promised_shipping_time=VALUES(promised_shipping_time), shipping_type=VALUES(shipping_type), created_at=VALUES(created_at), voucher_seller_lpi=VALUES(voucher_seller_lpi), shipping_fee_discount_platform=VALUES(shipping_fee_discount_platform), wallet_credits=VALUES(wallet_credits), updated_at=VALUES(updated_at), currency=VALUES(currency), shipping_provider_type=VALUES(shipping_provider_type), shipping_fee_original=VALUES(shipping_fee_original), voucher_platform_lpi=VALUES(voucher_platform_lpi), is_digital=VALUES(is_digital), item_price=VALUES(item_price), shipping_service_cost=VALUES(shipping_service_cost), tracking_code=VALUES(tracking_code), shipping_fee_discount_seller=VALUES(shipping_fee_discount_seller), shipping_amount=VALUES(shipping_amount), reason_detail=VALUES(reason_detail), return_status=VALUES(return_status), shipment_provider=VALUES(shipment_provider), voucher_amount=VALUES(voucher_amount), digital_delivery_info=VALUES(digital_delivery_info), extra_attributes=VALUES(extra_attributes)"
                    insertSql = insertSql + insertSql2
                    //console.log(insertSql);
                    await query(insertSql, [allOrderItems])
                    resultValue = {"code" : "0"}
                }
            } catch (error) {
                console.log(error);
                resultValue = error
            }
        }
    }
    result(null ,resultValue)
}

function clean(obj) {
    for (var propName in obj) {
      if (obj[propName] === null || obj[propName] === undefined || obj[propName] === "") {
        delete obj[propName];
      }
    }
    return obj
}
  
async function getSign(URL, params) {
    let sortedObject = await objectSortByKey(params);
    let stringSignTemp = "";
    for (const [key, value] of Object.entries(sortedObject)) {
        if (key != "token") {
            stringSignTemp = stringSignTemp + key + value 
        }
    }
    var sign = crypto.createHmac('sha256', "XLxWZJLAJlgFmKQCGFjaExM7AlvDPGgA") //process.env.LAZADA_secret_key
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

module.exports = lazada_order