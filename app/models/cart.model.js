const axios = require("axios");
const {parse} = require("dotenv");
const in_array = require("in_array");
const cartQuery = require("../query/cart.query");
const flashExpress = require("./flash.model");
const date_time = require('date-and-time');
const moment = require('moment');
const e = require("cors");
const {ShF_log_to_file} = require('../share_function/log_file');

// constructor
const Cart = function (product) {
    this.sku = product.sku;
};

Cart.frontendLocalStorageDetailCart = async (req, result) => {
    try {
        var data = req;
        var total_quantity = 0;
        var total_price_no_vat = 0.0;
        var total_vat = 0.0;
        var total_price_vat = 0.0;
        var total_discount = 0.0;
        var total_price_discount = 0.0;
        var total_net_price = 0.0;
        var total_shipping = 0.0;

        for (let index = 0; index < data['shop_list'].length; index++) {
            let element_shop_list = data['shop_list'][index];
            for (let index = 0; index < element_shop_list['product_list'].length; index++) {
                let element_product_list = element_shop_list['product_list'][index]
                let product_sku = element_product_list['sku']
                let product_price = parseFloat(element_product_list['price'])
                let product_quantity = parseInt(element_product_list['quantity'])
                if (product_price === 0 || product_price === 0.00) {
                    return result(null, {}, 400, 'Error', `สินค้า sku ${product_sku} มีราคาเป็น 0 ไม่สามารถดำเนินการได้`)
                }
                if (product_quantity === 0 || product_quantity === 0.00) {
                    return result(null, {}, 400, 'Error', `สินค้า sku ${product_sku} มีจำนวนเป็น 0 ไม่สามารถดำเนินการได้`)
                }
            }
        }

        if (data.shop_to_cal.length == 0) {
            for (let i = 0; i < data.shop_list.length; i++) {
                var quantity = 0;
                var price = 0.0;
                var cal_in_shop = 0.0;
                var total_quantity_in_shop = 0;
                var total_price_vat_in_shop = 0.0;
                var total_vat_in_shop = 0.0;
                for (let j = 0; j < data.shop_list[i].product_list.length; j++) {
                    var product_id = data.shop_list[i].product_list[j].product_id;
                    var sku = data.shop_list[i].product_list[j].sku;
                    var quan = data.shop_list[i].product_list[j].quantity;
                    var check = await cartQuery.checkStock(product_id, quan); //เช็คจำนวนสินค้าใน stock

                    var option1 = data.shop_list[i].product_list[j].attribute_option_1;
                    var option2 = data.shop_list[i].product_list[j].attribute_option_2;
                    var have_attribute = data.shop_list[i].product_list[j].have_attribute;
                    if (have_attribute == "no") {
                        let check_product_status = await cartQuery.checkProductStatusNoAtti(
                            sku,
                            quan
                        );
                        if (check_product_status.status == "pre_order") {
                            if (
                                data.shop_list[i].product_list[j].product_name.includes(
                                    "(preorder)"
                                ) == false
                            ) {
                                data.shop_list[i].product_list[j].product_name =
                                    data.shop_list[i].product_list[j].product_name +
                                    " " +
                                    "(preorder)";
                            }
                            data.shop_list[i].product_list[j].product_status =
                                check_product_status.status;
                        } else {
                            data.shop_list[i].product_list[j].product_status =
                                check_product_status.status;
                        }
                    } else if (have_attribute == "yes") {
                        if (option2 == "") {
                            var check_product_status = await cartQuery.checkProductStatusAtti1(product_id, quan, option1);
                        } else {
                            var check_product_status = await cartQuery.checkProductStatusAtti2(product_id, quan, option1, option2);
                        }
                        if (check_product_status.status == "pre_order") {
                            if (
                                data.shop_list[i].product_list[j].product_name.includes(
                                    "(preorder)"
                                ) == false
                            ) {
                                data.shop_list[i].product_list[j].product_name =
                                    data.shop_list[i].product_list[j].product_name +
                                    " " +
                                    "(preorder)";
                            }
                            data.shop_list[i].product_list[j].product_status =
                                check_product_status.status;
                        } else {
                            data.shop_list[i].product_list[j].product_status =
                                check_product_status.status;
                        }
                    }
                    data.shop_list[i].product_list[j].stock_check_status = check.status;
                    // data.shop_list[i].product_list[j].product_image = "";
                }
                //จัดเตรียมข้อมูลของผลคำนวณในร้านค้าตัวเอง
                data.shop_list[i].total_quantity_in_shop = total_quantity_in_shop;
                data.shop_list[i].total_price_in_shop = cal_in_shop.toFixed(2);
                data.shop_list[i].total_price_vat_in_shop =
                    total_price_vat_in_shop.toFixed(2);
                data.shop_list[i].total_vat_in_shop = total_vat_in_shop.toFixed(2);
                data.shop_list[i].total_price_no_vat_in_shop = cal_in_shop.toFixed(2);
                data.shop_list[i].total_net_price_in_shop =
                    total_price_vat_in_shop.toFixed(2);
            }
        } else {
            for (let i = 0; i < data.shop_list.length; i++) {
                var quantity = 0;
                var price = 0.0;
                var cal_in_shop = 0.0;
                var total_quantity_in_shop = 0;
                var total_price_vat_in_shop = 0.0;
                var total_vat_in_shop = 0.0;

                for (let j = 0; j < data.shop_list[i].product_list.length; j++) {
                    for (let k = 0; k < data.product_to_calculate.length; k++) {
                        var sku_from_database;
                        var product_id = data.shop_list[i].product_list[j].product_id;
                        var sku_from_payload = data.shop_list[i].product_list[j].sku;
                        var quan = data.shop_list[i].product_list[j].quantity;
                        var check = await cartQuery.checkStock(product_id, quan); //เช็คจำนวนสินค้าใน stock
                        var option1 = data.shop_list[i].product_list[j].attribute_option_1;
                        var option2 = data.shop_list[i].product_list[j].attribute_option_2;
                        var have_attribute = data.shop_list[i].product_list[j].have_attribute;
                        if (have_attribute == "no") {
                            sku_from_database = await cartQuery.checkSKUforNoAttri(product_id);
                            if (sku_from_payload == sku_from_database) {
                                data.shop_list[i].product_list[j].status_data_change = "no"
                            } else {
                                data.shop_list[i].product_list[j].status_data_change = "yes"
                            }
                            let check_product_status = await cartQuery.checkProductStatusNoAtti(sku_from_payload, quan);
                            if (check_product_status.status == "pre_order") {
                                if (
                                    data.shop_list[i].product_list[j].product_name.includes(
                                        "(preorder)"
                                    ) == false
                                ) {
                                    data.shop_list[i].product_list[j].product_name =
                                        data.shop_list[i].product_list[j].product_name +
                                        " " +
                                        "(preorder)";
                                }
                                data.shop_list[i].product_list[j].product_status =
                                    check_product_status.status;
                            } else {
                                data.shop_list[i].product_list[j].product_status =
                                    check_product_status.status;
                            }
                        } else if (have_attribute == "yes") {
                            if (option2 == "") {
                                var sku_from_database = await cartQuery.checkSKUforAttri(product_id, option1);
                                if (sku_from_database == null) {
                                    sku_from_database = await cartQuery.checkSKUforNoAttri(product_id);
                                }
                                if (sku_from_payload == sku_from_database) {
                                    data.shop_list[i].product_list[j].status_data_change = "no"
                                } else {
                                    data.shop_list[i].product_list[j].status_data_change = "yes"
                                }
                                var check_product_status = await cartQuery.checkProductStatusAtti1(product_id, quan, option1);
                            } else if (option2 != "") {
                                var sku_from_database = await cartQuery.checkSKUforAttri2(product_id, option1, option2);
                                if (sku_from_database == null) {
                                    sku_from_database = await cartQuery.checkSKUforNoAttri(product_id);
                                }
                                if (sku_from_payload == sku_from_database) {
                                    data.shop_list[i].product_list[j].status_data_change = "no"
                                } else {
                                    data.shop_list[i].product_list[j].status_data_change = "yes"
                                }
                                var check_product_status = await cartQuery.checkProductStatusAtti2(product_id, quan, option1, option2);
                            }
                            if (check_product_status.status == "pre_order") {
                                if (
                                    data.shop_list[i].product_list[j].product_name.includes(
                                        "(preorder)"
                                    ) == false
                                ) {
                                    data.shop_list[i].product_list[j].product_name =
                                        data.shop_list[i].product_list[j].product_name +
                                        " " +
                                        "(preorder)";
                                }
                                data.shop_list[i].product_list[j].product_status =
                                    check_product_status.status;
                            } else {
                                data.shop_list[i].product_list[j].product_status =
                                    check_product_status.status;
                            }
                        }

                        data.shop_list[i].product_list[j].stock_check_status = check.status;

                        let condition = ""
                        if (option2 != "") { // กรณี สินค้ามี 2 attibute
                            condition = data.shop_list[i].product_list[j].product_id == data.product_to_calculate[k].product_id && data.shop_list[i].product_list[j].attribute_option_1 == data.product_to_calculate[k].attribute_option_1 && data.shop_list[i].product_list[j].attribute_option_2 == data.product_to_calculate[k].attribute_option_2
                        } else if (option1 == "") { // กรณี สินค้า no attibute
                            condition = data.shop_list[i].product_list[j].product_id == data.product_to_calculate[k].product_id
                        } else { // กรณี สินค้า 1 attibute
                            condition = data.shop_list[i].product_list[j].product_id == data.product_to_calculate[k].product_id && data.shop_list[i].product_list[j].attribute_option_1 == data.product_to_calculate[k].attribute_option_1
                        }

                        if (condition) {
                            quantity = parseFloat(data.shop_list[i].product_list[j].quantity);
                            price = parseFloat(data.shop_list[i].product_list[j].price);
                            cal_in_shop += quantity * price;
                            total_quantity_in_shop += quantity;
                            total_price_vat_in_shop = (cal_in_shop * 107) / 100;
                            total_vat_in_shop = total_price_vat_in_shop - cal_in_shop;
                        }
                    }
                }
                //จัดเตรียมข้อมูลของผลคำนวณในร้านค้าตัวเอง
                data.shop_list[i].total_quantity_in_shop = total_quantity_in_shop;
                data.shop_list[i].total_price_in_shop = cal_in_shop.toFixed(2);
                data.shop_list[i].total_price_vat_in_shop =
                    total_price_vat_in_shop.toFixed(2);
                data.shop_list[i].total_vat_in_shop = total_vat_in_shop.toFixed(2);
                data.shop_list[i].total_price_no_vat_in_shop = cal_in_shop.toFixed(2);
                data.shop_list[i].total_net_price_in_shop =
                    total_price_vat_in_shop.toFixed(2);
                //คำนวณผลรวมทั้งหมดของทุกร้านค้า
                total_quantity += total_quantity_in_shop;
                total_price_no_vat += cal_in_shop;
                var total_discount = 0.0;
                var total_price_discount = 0.0;
                total_vat += total_vat_in_shop;
                total_price_vat += total_price_vat_in_shop;
                var total_shipping = 0.0;
                total_net_price += total_price_vat_in_shop;
            }
        }
        //จัดเตรียมข้อมูลของผลคำนวณของทุกร้านค้า
        data.total_quantity = total_quantity;
        data.total_price_no_vat = total_price_no_vat.toFixed(2);
        data.total_discount = total_discount.toFixed(2);
        data.total_price_discount = total_price_discount.toFixed(2);
        data.total_vat = total_vat.toFixed(2);
        data.total_price_vat = total_price_vat.toFixed(2);
        data.total_shipping = total_shipping.toFixed(2);
        data.total_net_price = total_net_price.toFixed(2);

        result(null, data, 200, "SUCCESS", "Get localstorage detail cart success");
    } catch (err) {

        console.log(err.name + ": " + err.message);
        if (typeof err === "object" && err.stack) {
            console.log(err.stack);
        } else {
            console.log("No stack");
        }

        result(err, null);
        return;
    }
};

Cart.frontendLocalStorageGetCart = async (req, result) => {
    let timeTaken = Date.now()
    let logfile = "frontend_local_storage_get_cart.log"
    let logjson = {
        name: logfile,
        parameter: "",
    }
    try {
        //ประกาศตัวแปร
        var data = req;
        var keep = [];
        var product_to_calculate = [];
        var total_quantity = 0;
        var total_price_no_vat = 0.0;
        var total_discount = 0.0;
        var total_price_discount = 0.0;
        var total_vat = 0.0;
        var total_price_vat = 0.0;
        var total_net_price = 0.0;
        var total_shipping = 0.0;
        for (let i = 0; i < data.shop_list.length; i++) {
            //ประกาศตัวแปร
            var quantity = 0;
            var price = 0.0;
            var cal_in_shop = 0.0;
            var total_quantity_in_shop = 0;
            var total_price_vat_in_shop = 0.0;
            var total_vat_in_shop = 0.0;
            var total_shipping_in_shop = 0.0;

            //สร้าง obj keep เพื่อเก็บ ค่าของ shop_list และ เซตค่า product_list ให้เป็น array ว่าง เพื่อวนลูป หา product list แล้ว นำ product_list มา push ใส่ shop_list นั้นๆ
            keep.push({
                selectData: data.shop_list[i].selectData,
                shop_id: data.shop_list[i].shop_id,
                shop_name: data.shop_list[i].shop_name,
                product_list: [],
            });
            var product_weight = 0;
            var check_weight = 0;
            var arr_weight_zero = []
            for (let j = 0; j < data.shop_list[i].product_list.length; j++) {
                for (let k = 0; k < data.product_to_calculate.length; k++) {
                    ////////////////////// เช็ค stock สินค้า และ ดึง url img ของสินค้า////////////////////
                    var product_id = data.shop_list[i].product_list[j].product_id;
                    var quan = data.shop_list[i].product_list[j].quantity;

                    //ถ้า เช็คแล้วว่า product_to_calculate อยู่ใน product_list ใน shop_list
                    if (data.product_to_calculate[k].have_attribute == "yes" && data.product_to_calculate[k].attribute_option_2 != "") {

                        if (data.shop_list[i].product_list[j].product_id == data.product_to_calculate[k].product_id && data.shop_list[i].product_list[j].attribute_option_1 == data.product_to_calculate[k].attribute_option_1 && data.shop_list[i].product_list[j].attribute_option_2 == data.product_to_calculate[k].attribute_option_2) {
                            keep[i].product_list.push(data.shop_list[i].product_list[j]); // push ค่า ของ product_list ลง obj ที่จัดเตรียมไว้
                            // console.log(keep[i])

                            quantity = parseFloat(data.shop_list[i].product_list[j].quantity);
                            price = parseFloat(data.shop_list[i].product_list[j].price);
                            product_to_calculate.push(data.product_to_calculate[k]);

                            //Shipping
                            var product_data = await cartQuery.productAttribute(product_id, data.product_to_calculate[k].attribute_option_1, data.product_to_calculate[k].attribute_option_2);
                            let weight_cal = parseFloat(JSON.parse(product_data[0].volumn_json).weight)
                            product_weight += weight_cal * quan;
                            if (weight_cal == 0) {
                                arr_weight_zero.push({sku: data.shop_list[i].product_list[j].sku})
                            }
                            if (product_weight > 50000) {
                                check_weight = 1
                            }
                            // คำนวณหาราคา
                            cal_in_shop += quantity * price;
                            total_quantity_in_shop += quantity;
                            total_price_vat_in_shop = (cal_in_shop * 107) / 100;
                            total_vat_in_shop = total_price_vat_in_shop - cal_in_shop;
                        }
                    } else if (data.product_to_calculate[k].have_attribute == "yes" && data.product_to_calculate[k].attribute_option_2 == "") {
                        if (data.shop_list[i].product_list[j].product_id == data.product_to_calculate[k].product_id && data.shop_list[i].product_list[j].attribute_option_1 == data.product_to_calculate[k].attribute_option_1) {
                            keep[i].product_list.push(data.shop_list[i].product_list[j]); // push ค่า ของ product_list ลง obj ที่จัดเตรียมไว้
                            quantity = parseFloat(data.shop_list[i].product_list[j].quantity);
                            price = parseFloat(data.shop_list[i].product_list[j].price);
                            product_to_calculate.push(data.product_to_calculate[k]);

                            //Shipping
                            var product_data = await cartQuery.productAttribute(product_id, data.product_to_calculate[k].attribute_option_1, data.product_to_calculate[k].attribute_option_2);
                            let weight_cal = parseFloat(JSON.parse(product_data[0].volumn_json).weight)
                            product_weight += weight_cal * quan;
                            // console.log("product_weight:", product_weight)
                            if (weight_cal == 0) {
                                arr_weight_zero.push({sku: data.shop_list[i].product_list[j].sku})
                            }
                            if (product_weight > 50000) {
                                check_weight = 1
                            }
                            // คำนวณหาราคา
                            cal_in_shop += quantity * price;
                            total_quantity_in_shop += quantity;
                            total_price_vat_in_shop = (cal_in_shop * 107) / 100;
                            total_vat_in_shop = total_price_vat_in_shop - cal_in_shop;
                        }
                    } else {
                        if (data.shop_list[i].product_list[j].product_id == data.product_to_calculate[k].product_id) {
                            keep[i].product_list.push(data.shop_list[i].product_list[j]); // push ค่า ของ product_list ลง obj ที่จัดเตรียมไว้
                            quantity = parseFloat(data.shop_list[i].product_list[j].quantity);
                            price = parseFloat(data.shop_list[i].product_list[j].price);
                            product_to_calculate.push(data.product_to_calculate[k]);

                            //Shipping
                            var product_data = await cartQuery.findProductById(product_id);
                            let weight_cal = parseFloat(JSON.parse(product_data[0].volumn).weight)
                            product_weight += weight_cal * quan;
                            if (weight_cal == 0) {
                                arr_weight_zero.push({sku: data.shop_list[i].product_list[j].sku})
                            }
                            if (product_weight > 50000) {
                                check_weight = 1
                            }
                            // คำนวณหาราคา
                            cal_in_shop += quantity * price;
                            total_quantity_in_shop += quantity;
                            total_price_vat_in_shop = (cal_in_shop * 107) / 100;
                            total_vat_in_shop = total_price_vat_in_shop - cal_in_shop;
                        }
                    }
                }
                data.shop_list[i].total_quantity_in_shop = total_quantity_in_shop;
                data.shop_list[i].total_price_in_shop = parseFloat(
                    cal_in_shop.toFixed(2)
                );
                data.shop_list[i].total_price_vat_in_shop = parseFloat(
                    total_price_vat_in_shop.toFixed(2)
                );
                data.shop_list[i].total_vat_in_shop = parseFloat(
                    total_vat_in_shop.toFixed(2)
                );
                data.shop_list[i].total_price_no_vat_in_shop = parseFloat(
                    cal_in_shop.toFixed(2)
                );
                data.shop_list[i].total_net_price_in_shop = parseFloat(
                    total_price_vat_in_shop.toFixed(2)
                );
            }
            if (check_weight == 1) {
                keep[i].total_quantity_in_shop = total_quantity_in_shop;
                keep[i].total_price_in_shop = parseFloat(cal_in_shop.toFixed(2));
                keep[i].total_price_vat_in_shop = parseFloat(total_price_vat_in_shop.toFixed(2));
                keep[i].total_vat_in_shop = parseFloat(total_vat_in_shop.toFixed(2));
                keep[i].total_price_no_vat_in_shop = parseFloat(cal_in_shop.toFixed(2));
                keep[i].total_net_price_in_shop = parseFloat(total_price_vat_in_shop.toFixed(2)) + parseFloat(total_shipping_in_shop.toFixed(2));
                keep[i].total_shipping_in_shop = 0.0

                keep.forEach((k, i) => {
                    if (k.product_list.length == 0) {
                        //ลบ ที่มี product_list เท่ากับ []
                        keep.splice(i, 1);
                    }
                    if (data.shop_to_cal.length > 1) {
                        total_quantity += k.total_quantity_in_shop;
                        total_price_no_vat += parseFloat(k.total_price_in_shop);
                        total_vat += parseFloat(k.total_vat_in_shop);
                        total_price_vat += parseFloat(k.total_price_vat_in_shop);
                        total_net_price += parseFloat(k.total_net_price_in_shop);
                        total_shipping += parseFloat(k.total_shipping_in_shop);
                    } else {
                        total_quantity = keep[0].total_quantity_in_shop;
                        total_price_no_vat = parseFloat(keep[0].total_price_in_shop);
                        total_vat = parseFloat(keep[0].total_vat_in_shop);
                        total_price_vat = parseFloat(keep[0].total_price_vat_in_shop);
                        total_net_price = parseFloat(keep[0].total_net_price_in_shop);
                        total_shipping += parseFloat(keep[0].total_shipping_in_shop);
                    }
                });

                if (data.address_data[0].province == undefined) {
                    var res_address_data = [[]];
                } else {
                    var res_address_data = data.address_data;
                }
                //จัดเตรียมข้อมูลส่งให้หน้าบ้าน

                var res = {
                    shop_to_cal: [keep[0].shop_name],
                    product_to_calculate: product_to_calculate,
                    shop_list: data.shop_list,
                    choose_list: keep,
                    address_data: res_address_data,
                    //คำนวณราคาของสินค้าทั้งหมด
                    total_quantity: total_quantity,
                    total_price_no_vat: total_price_no_vat,
                    total_discount: total_discount,
                    total_price_discount: total_price_discount,
                    total_vat: total_vat,
                    total_price_vat: total_price_vat,
                    total_net_price: total_net_price,
                    total_shipping: total_shipping,
                    invoice_id: data.invoice_id,
                };
                result(null, res, 200, "SUCCESS", "Get cart success");
                return;
            }

            if (arr_weight_zero.length > 0) {
                result(null, arr_weight_zero, 400, "FAILED", "Get cart faild.Some products have weight equal 0.");
                return
            }

            //จัดการเรื่องค่าขนส่งโดยประมาณ
            // ที่อยู่ shop
            var shop_address = await cartQuery.findShopAddress();
            let data_shop_address = JSON.parse(shop_address[0].address)
            var shop_province = data_shop_address.province;
            var shop_district = data_shop_address.amphoe;
            var shop_sub_district = data_shop_address.tambon;
            var shop_zipcode = data_shop_address.zipcode;

            //ที่อยู่ user
            var user_province = data.address_data[0].province;
            var user_district = data.address_data[0].district;
            var user_sub_district = data.address_data[0].sub_district;
            var user_zipcode = data.address_data[0].zipcode;

            if (product_weight < 1000) {
                product_weight = 1000
            }
            var data_shipping = {
                mchId: process.env.FLASH_MCHID,
                srcProvinceName: shop_province,
                srcCityName: shop_district,
                srcDistrictName: shop_sub_district,
                srcPostalCode: shop_zipcode,
                dstProvinceName: user_province,
                dstCityName: user_district,
                dstDistrictName: user_sub_district,
                dstPostalCode: user_zipcode,
                weight: product_weight,
                // "width": product_width,
                // "length": product_length,
                // "height": product_height,
                expressCategory: 1,
                insureDeclareValue: 0,
                insured: 0,
                freightInsureEnabled: 0,
                pricingTable: 0,
            };
            // console.log(data_shipping)
            if (data.address_data[0].province) {
                var shipping_value = await flashExpress.estimateRateFlash(
                    data_shipping
                );
                logjson.execution_time = Date.now() - timeTaken
                logjson.shipping_value = shipping_value
                logjson.data_shipping = data_shipping
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                if (shipping_value.message != "success") {
                    console.log(shipping_value)
                    result(null, "", 400, "FAILED", "มีความผิดพลาดจากการคำนวนค่าขนส่ง Flash จากที่อยู่ของผู้ใช้งาน");
                    return
                }
                //ปริม
                total_shipping_in_shop =
                    parseFloat(shipping_value.data.estimatePrice) / 100;
            } else {
                total_shipping_in_shop = 0.00
            }

            //ปริมณฑล = นครปฐม, นนทบุรี, ปทุมธานี, สมุทรปราการ, สมุทรสาคร
            if (
                cal_in_shop >= 5000 &&
                (data.address_data[0].province == "กรุงเทพมหานคร" ||
                    data.address_data[0].province == "นครปฐม" ||
                    data.address_data[0].province == "นนทบุรี" ||
                    data.address_data[0].province == "ปทุมธานี" ||
                    data.address_data[0].province == "สมุทรปราการ" ||
                    data.address_data[0].province == "สมุทรสาคร")
            ) {
                total_shipping_in_shop = 0.0;
            }
            // console.log(data_shipping)
            //จัดเตรียมข้อมูลคำนวณราคาสินค้าใน shop_list
            keep[i].total_quantity_in_shop = total_quantity_in_shop;
            keep[i].total_price_in_shop = parseFloat(cal_in_shop.toFixed(2));
            keep[i].total_price_vat_in_shop = parseFloat(
                total_price_vat_in_shop.toFixed(2)
            );
            keep[i].total_vat_in_shop = parseFloat(total_vat_in_shop.toFixed(2));
            keep[i].total_price_no_vat_in_shop = parseFloat(
                cal_in_shop.toFixed(2)
            );
            keep[i].total_net_price_in_shop = parseFloat(total_price_vat_in_shop.toFixed(2)) + parseFloat(total_shipping_in_shop.toFixed(2));
            keep[i].total_shipping_in_shop = parseFloat(
                total_shipping_in_shop.toFixed(2)
            );
        }

        keep.forEach((k, i) => {
            if (k.product_list.length == 0) {
                //ลบ ที่มี product_list เท่ากับ []
                keep.splice(i, 1);
            }
            if (data.shop_to_cal.length > 1) {
                total_quantity += k.total_quantity_in_shop;
                total_price_no_vat += parseFloat(k.total_price_in_shop);
                total_vat += parseFloat(k.total_vat_in_shop);
                total_price_vat += parseFloat(k.total_price_vat_in_shop);
                total_net_price += parseFloat(k.total_net_price_in_shop);
                total_shipping += parseFloat(k.total_shipping_in_shop);
            } else {
                total_quantity = keep[0].total_quantity_in_shop;
                total_price_no_vat = parseFloat(keep[0].total_price_in_shop);
                total_vat = parseFloat(keep[0].total_vat_in_shop);
                total_price_vat = parseFloat(keep[0].total_price_vat_in_shop);
                total_net_price = parseFloat(keep[0].total_net_price_in_shop);
                total_shipping += parseFloat(keep[0].total_shipping_in_shop);
            }
        });

        if (data.address_data[0].province == undefined) {
            var res_address_data = [[]];
        } else {
            var res_address_data = data.address_data;
        }
        //จัดเตรียมข้อมูลส่งให้หน้าบ้าน

        var res = {
            shop_to_cal: [keep[0].shop_name],
            product_to_calculate: product_to_calculate,
            shop_list: data.shop_list,
            choose_list: keep,
            address_data: res_address_data,
            //คำนวณราคาของสินค้าทั้งหมด
            total_quantity: total_quantity,
            total_price_no_vat: total_price_no_vat,
            total_discount: total_discount,
            total_price_discount: total_price_discount,
            total_vat: total_vat,
            total_price_vat: total_price_vat,
            total_net_price: total_net_price,
            total_shipping: total_shipping,
            invoice_id: data.invoice_id,
        };
        result(null, res, 200, "SUCCESS", "Get cart success");
    } catch (err) {
        result(err, null);
        return;
    }
};

async function notiBotOneChat(one_id_shop, message, msg_notification) {
    if (!message) {
        message = "ไม่มีข้อมูลที่ส่งมา";
    }
    if (!msg_notification) {
        msg_notification = "คุณได้รับข้อความใหม่ อย่าลืมเปิดอ่านด้วยนะครับ";
    }
    const config = {
        method: "post",
        url: process.env.URL_BOT_NOTI,
        headers: {
            Authorization: `Bearer ${process.env.TOKEN_BOT}`,
        },
        data: {
            to: one_id_shop,
            bot_id: process.env.BOT_ID,
            type: "text",
            message: message,
            custom_notification: msg_notification, // This is the body part
        },
    };
    let res = await axios(config);
    // console.log(res.data)
    return res.data;
}

async function notiBotOneChatPdf(one_id_shop, link_pdf, payment_transaction_number, msg_notification) {
    if (!link_pdf) {
        link_pdf = "ไม่มีข้อมูลที่ส่งมา";
    }
    if (!msg_notification) {
        msg_notification = "คุณได้รับข้อความใหม่ อย่าลืมเปิดอ่านด้วยนะครับ";
    }
    const config = {
        method: "post",
        url: process.env.URL_BOT_NOTI,
        headers: {
            Authorization: `Bearer ${process.env.TOKEN_BOT}`,
        },
        data: {
            to: one_id_shop,
            bot_id: process.env.BOT_ID,
            type: "template",
            custom_notification: "เปิดอ่านข้อความใหม่จากทางเรา",
            elements: [
                {
                    image: "https://panit.sdi.inet.co.th/backend/img/logo_ups/ups_onechat.jpg",
                    title: "รายละเอียดใบเสนอราคา",
                    detail: "รายละเอียดใบเสนอราคา" + "\n" + payment_transaction_number,
                    choice: [
                        {
                            label: "รายละเอียดใบเสนอราคา",
                            type: "link",
                            url: link_pdf,
                            sign: "false",
                            onechat_token: "false"
                        }
                    ]
                },

            ]
        },
    };
    let res = await axios(config);
    // console.log(res.data)
    return res.data;
}

async function genPdf(payment_transaction_number, customer_name, customer_phone, customer_email) {
    const config = {
        method: "post",
        url: process.env.URL_GEN_PDF,
        data: {
            transaction_order_number: payment_transaction_number,
            customer_company: "",
            customer_name: customer_name,
            customer_phone: customer_phone,
            customer_email: customer_email,
        },
    };
    try {
        // console.log(config);
        let res = await axios(config);
        // console.log("res :", res);
        // console.log("res.data :", res.data);
        return res.data;
    } catch (err) {
        console.log("-------------");
        console.log(config);
        console.log(err.name + ": " + err.message);
        if (typeof err === "object" && err.stack) {
            console.log(err.stack);
        } else {
            console.log("No stack");
        }
        return;
    }

}

async function notiEmail(payment_transaction_number, pdf_path_qu) {
    try {
        if (!payment_transaction_number || !pdf_path_qu) {
            console.log("payment_transaction_number or pdf_path_qu is null")
        } else {
            const config = {
                method: "post",
                url: process.env.URL_NOTI_EMAIL,
                data: {
                    transaction_order_number: payment_transaction_number,
                    pdf_path_qu: pdf_path_qu,
                },
            };
            let res = await axios(config);
            return res.data;
        }
    } catch (err) {
        console.log(err.name + ": " + err.message);
        if (typeof err === "object" && err.stack) {
            console.log(err.stack);
        } else {
            console.log("No stack");
        }
        return;
    }
}

Cart.frontendLocalStorageCreateOrder = async (req, result) => {
    try {
        //ประกาศตัวแปร
        var data = req;
        if (Array.isArray(data.address_data[0])) {
            result(null, data, 400, "ERROR", "address_data is undefined");
        }
        // var product_data_to_delete = []
        var datetime = new Date();
        var total_amount = data.total_net_price;
        var transaction_status = "not paid";
        var user_id = 0;
        var user_name =
            data.address_data[0].first_name + " " + data.address_data[0].last_name;
        var user_address =
            "เลขที่:" +
            data.address_data[0].house_no +
            " รายละเอียด:" +
            data.address_data[0].address_detail +
            " ตำบล:" +
            data.address_data[0].sub_district +
            " อำเภอ:" +
            data.address_data[0].district +
            " จังหวัด" +
            data.address_data[0].province +
            " รหัสไปรษณีย์:" +
            data.address_data[0].zipcode +
            " เบอร์โทรศัพท์" +
            data.address_data[0].phone;

        //ถ้ามีการอัพเดทราคาจากผู้ขาย/ผู้ตั้งราคาสินค้า ต้องไปเช็คราคาสินค้าใหม่ด้วย
        var status_new_price = 0;
        for (let i = 0; i < data.shop_list.length; i++) {
            var quantity = 0;
            var cal_in_shop = 0.0;
            var total_quantity_in_shop = 0.0;
            var total_price_vat_in_shop = 0.0;
            var total_vat_in_shop = 0.0;
            for (let j = 0; j < data.shop_list[i].product_list.length; j++) {
                var product_id = data.shop_list[i].product_list[j].product_id;

                // var attribute_option_1 = data.shop_list[i].product_list[j].attribute_option_1;
                // var attribute_option_2 = data.shop_list[i].product_list[j].attribute_option_2;

                // var check_price = await cartQuery.productAttribute(product_id,attribute_option_1,attribute_option_2);
                // var new_price = 0.0;
                // if (check_price.length == 0) {
                //   var find_price_no_attibute = await cartQuery.findPriceNoAttibute(
                //     product_id
                //   );
                //   new_price = find_price_no_attibute[0].price_fix_0;
                // } else {
                //   var product_attribute_id = check_price[0].id;
                //   var find_price_attibute = await cartQuery.findPriceHaveAttibute(
                //     product_attribute_id
                //   );
                //   new_price = find_price_attibute[0].price_fix_0;

                // }

                // let k_price = parseFloat(data.shop_list[i].product_list[j].price);
                // if (new_price != k_price) {
                //   data.shop_list[i].product_list[j].price = new_price;
                //   data.shop_list[i].product_list[j].net_price = new_price;
                //   price = new_price;
                //   status_new_price = 1;
                // } else {
                //   price = data.shop_list[i].product_list[j].price;
                // }

                quantity = parseFloat(data.shop_list[i].product_list[j].quantity);
                cal_in_shop += quantity * price;
                total_quantity_in_shop += quantity;
                total_price_vat_in_shop = (cal_in_shop * 107) / 100;
                total_vat_in_shop = total_price_vat_in_shop - cal_in_shop;

                //จัดเตรียมข้อมูลของผลคำนวณในร้านค้าตัวเอง
                data.shop_list[i].total_quantity_in_shop = total_quantity_in_shop;

                data.shop_list[i].total_price_in_shop = parseFloat(
                    cal_in_shop.toFixed(2)
                );
                data.shop_list[i].total_price_vat_in_shop = parseFloat(
                    total_price_vat_in_shop.toFixed(2)
                );
                data.shop_list[i].total_vat_in_shop = parseFloat(
                    total_vat_in_shop.toFixed(2)
                );
                data.shop_list[i].total_price_no_vat_in_shop = parseFloat(
                    cal_in_shop.toFixed(2)
                );

                data.shop_list[i].total_net_price_in_shop = parseFloat(
                    total_price_vat_in_shop.toFixed(2)
                );

            }

        }

        // if (status_new_price == 1) {
        //   result(null, data, 200, "SUCCESS", "Update New Price");
        //   return;
        // }
        //payment data insert
        var data_insert_transaction = await cartQuery.insertData(
            total_amount,
            transaction_status,
            user_id,
            user_name,
            user_address
        );

        var insert_id = String(data_insert_transaction.insertId);


        var now = new Date();
        var date_payment = date_time.format(now, 'YYMMDD')
        var date = date_time.format(now, 'YY-MM-DD');
        var payment_transaction_number = date_payment + insert_id.padStart(12, "0");
        // console.log("payment_transaction_number : ", payment_transaction_number);
        cartQuery.updateData(payment_transaction_number, insert_id);
        var data_alert_shop_name;
        var data_alert_po;
        var data_alert_product;
        var data_alert_total = 0.0;
        var buyCountValue = 0;
        for (let i = 0; i < data.choose_list.length; i++) {
            var shop_id = data.choose_list[i].shop_id;
            var count_order_today = 1;
            var check_buy_count_today = await cartQuery.findByDateAndSellerShopID(
                date,
                shop_id
            );

            //insert product count
            if (check_buy_count_today.length == 0) {
                cartQuery.insertCheckBuyCountToday(date, shop_id, count_order_today);
                buyCountValue = 1;
            } else {
                var new_count = check_buy_count_today[0].count_order_today + 1;
                buyCountValue = new_count;

                var id = check_buy_count_today[0].id;
                cartQuery.updateCheckBuyCountToday(new_count, id);
            }

            // cut stock
            var product_data_to_delete = [];
            var ck_loop = false;
            var data_not_stock = [];
            var product_list_array = [];
            var arr_msg = []
            for (let j = 0; j < data.choose_list[i].product_list.length; j++) {
                var product_id = data.choose_list[i].product_list[j].product_id;
                var product_attribute_id = data.choose_list[i].product_list[j].product_attribute_id;
                var sku = data.choose_list[i].product_list[j].sku;
                var data_product = await cartQuery.findProductByID(product_id);
                var inventory_code = data_product[0].inventory_code
                var find_inventory = await cartQuery.findInventory(inventory_code);
                var effective_stock_before = find_inventory[0].effective_stock
                var actual_stock_before = find_inventory[0].actual_stock
                var price = data.choose_list[i].product_list[j].price;
                var quan = data.choose_list[i].product_list[j].quantity;
                var final_effective_stock = effective_stock_before - quan
                var final_actual_stock = actual_stock_before - quan
                var option1 = data.choose_list[i].product_list[j].attribute_option_1;
                var option2 = data.choose_list[i].product_list[j].attribute_option_2;
                var a_status = false;
                // ตัด stock สินค้าที่มี attibute
                if (option1 != "") {
                    a_status = true;
                    if (option2 != "") {
                        var check_stock = await cartQuery.checkStockAtti(
                            product_id,
                            quan,
                            option1,
                            option2
                        );
                    } else {
                        var check_stock = await cartQuery.checkStockAtti2(
                            product_id,
                            quan,
                            option1
                        );
                    }
                    var product = await cartQuery.findProduct(sku);

                    // check_stock.res[0].name = product[0].name
                    // check_stock.res[0].stock_count = check_stock.res[0].actual_stock
                    var update_actual_stock = 0;
                    var update_effective_stock = 0;
                    var invent_count = 0;
                    var data_inventory = await cartQuery.findProduct(sku);
                    if (quan > check_stock.res[0].actual_stock) {
                        update_actual_stock = 0;
                        invent_count = check_stock.res[0].actual_stock;
                        update_effective_stock = check_stock.res[0].effective_stock - quan;
                        update_effective_actual_stock = data_inventory[0].inventory_stock - invent_count;
                    } else {
                        invent_count = check_stock.res[0].actual_stock - quan;
                        update_actual_stock = check_stock.res[0].actual_stock - quan;
                        update_effective_stock = check_stock.res[0].effective_stock - quan;
                        update_effective_actual_stock = data_inventory[0].inventory_stock - quan;
                    }
                    var update_effective_stock_invent = data_inventory[0].inventory_stock - quan;
                    product_data_to_delete.push(product_id);
                } else {
                    // ตัด stock สินค้าที่ไม่มี attibute
                    var check_stock = await cartQuery.checkStock(product_id, quan);
                    var product = await cartQuery.findProduct(sku);
                    var update_stock_count = 0;
                    var invent_count = 0;
                    var data_inventory = await cartQuery.findInventory(sku);
                    if (quan > product[0].stock_count) {
                        update_stock_count = 0;
                        invent_count = check_stock.res[0].stock_count;
                        var update_effective_actual_stock = data_inventory[0].actual_stock - invent_count;
                    } else {
                        update_stock_count = check_stock.res[0].stock_count - quan;
                        var update_effective_actual_stock = data_inventory[0].actual_stock - quan;
                    }
                    var update_effective_stock_invent = data_inventory[0].effective_stock - quan;
                    var inventory_stock = update_stock_count * product[0].inventory_ratio;

                    product_data_to_delete.push(product_id);
                }
                //ถ้า actual_stock,effective_stock เท่ากับ 0 ให้ไป update status ใน ตาราง ms_product field stock_status
                if (data_inventory[0].actual_stock == 0 && data_inventory[0].effective_stock == 0) {
                    let stock_status = "out of stock";
                    cartQuery.updateStatusProduct(stock_status, product_id);
                } else {
                    //a_status = true กรณีสินค้าที่มี attibute ถ้าเป็น false ก็ให้เข้า else สินค้าที่ไม่มี attibute
                    if (a_status == true) {
                        //ในกรณีที่มีการตัด stock แล้ว actual_stock ติดลบ ก็ให้ set เป็น 0 เพื่อไม่ให่้ stock ติดลบ
                        if (update_effective_actual_stock <= 0) {
                            update_effective_actual_stock = 0
                        }
                        // update จำนวนสินค้าที่มี ที่มี attibute ในตาราง ms_product_attribute
                        cartQuery.updateProductAtti(
                            update_actual_stock,
                            update_effective_stock,
                            product_id,
                            option1,
                            option2
                        );
                        // update จำนวนสินค้า ในตาราง ms_inventory
                        cartQuery.updateInventory(
                            final_actual_stock,
                            final_effective_stock,
                            inventory_code
                        );
                        cartQuery.updateProduct(
                            final_effective_stock,
                            final_effective_stock,
                            product_id
                        );
                    } else {
                        if (update_effective_actual_stock <= 0) {
                            update_effective_actual_stock = 0
                        }
                        //update จำนวนสินค้า ในตาราง ms_product
                        cartQuery.updateInventory(
                            final_actual_stock,
                            final_effective_stock,
                            inventory_code
                        );
                        cartQuery.updateProduct(
                            final_effective_stock,
                            final_effective_stock,
                            product_id
                        );
                    }
                }

                // สินค้าขายดี
                var check_best_sold_data = await cartQuery.bestSoldProduct(product_id);
                if (check_best_sold_data.length == 0) {
                    var po_count = 1;
                    cartQuery.insertBestSoldProduct(product_id, shop_id, quan, po_count);
                } else {
                    var total_sold_prize =
                        parseInt(check_best_sold_data[0].total_sold_prize) + parseInt(quan);
                    var po_count = check_best_sold_data[0].po_count + 1;
                    cartQuery.updateBestSoldProduct(
                        total_sold_prize,
                        po_count,
                        product_id
                    );
                }

                var total_cal = 0.0;
                // console.log("product_id : ", product_id);
                // console.log("product_attribute_id : ", product_attribute_id);
                var product_data = await cartQuery.findProductAndAttributeById(product_id, product_attribute_id);
                // console.log("product_data : ", product_data);
                var product_name = product_data[0].name;
                // var img = await cartQuery.getImg(product_id); //ดึง url img ของสินค้า
                var check = await cartQuery.checkStock(product_id, quan); //เช็คจำนวนสินค้าใน stock
                // set data noti onechat
                var shop_data = await cartQuery.findShop(shop_id);
                var shop_name = shop_data[0].name_th + " / " + shop_data[0].name_en;
                var cal = price * quan;
                total_cal += cal;
                var product_attribute_detail;
                var result_volumn;

                if (!product_data[i].have_attribute || product_data[i].have_attribute == "no") {
                    product_attribute_detail = {
                        product_attribute_id: "-1",
                        attribute_priority_1: "",
                        attribute_priority_2: ""
                    };

                    let product_data_volumn = await cartQuery.findProduct(sku);
                    result_volumn = product_data_volumn[i].volumn

                } else {
                    let attribute_option_1 =
                        data.choose_list[i].product_list[j].attribute_option_1;
                    let attribute_option_2 =
                        data.choose_list[i].product_list[j].attribute_option_2;
                    product_attribute_detail = await cartQuery.productAttribute(
                        product_id,
                        attribute_option_1,
                        attribute_option_2
                    );
                    product_attribute_detail = {
                        product_attribute_id: product_attribute_detail[0].id,
                        attribute_priority_1:
                        product_attribute_detail[0].attribute_priority_1,
                        attribute_priority_2:
                        product_attribute_detail[0].attribute_priority_2,
                    };
                    let product_data_volumn = await cartQuery.productAttribute(
                        product_id,
                        attribute_option_1,
                        attribute_option_2
                    );
                    result_volumn = product_data_volumn[i].volumn_json
                }
                var use_to_return_stock
                if (data.choose_list[i].product_list[j].product_status == "pre_order") {
                    var return_actual_stock
                    if (quan > check_stock.res[0].actual_stock) {
                        return_actual_stock = check_stock.res[0].actual_stock;
                    } else {
                        return_actual_stock = quan;
                    }
                    use_to_return_stock = {
                        actual_stock: return_actual_stock,
                        effective_stock: data.choose_list[i].product_list[j].quantity
                    }
                } else {
                    use_to_return_stock = {
                        actual_stock: data.choose_list[i].product_list[j].quantity,
                        effective_stock: data.choose_list[i].product_list[j].quantity
                    }
                }
                var product_list_data = {
                    product_id: product_data[i].id,
                    product_name: product_data[i].name,
                    sku: product_data[i].sku,
                    product_image: data.choose_list[i].product_list[j].product_image,
                    have_attribute: product_data[i].have_attribute,
                    product_status: data.choose_list[i].product_list[j].product_status,
                    product_attribute_detail: product_attribute_detail,
                    quantity: quan,
                    price: price,
                    net_price: cal,
                    net_price_with_discount: cal,
                    discount_percent: 0,
                    price_discount: 0,
                    volumn: JSON.parse(result_volumn),
                    stock: product_data[i].stock_count,
                    stock_check_status: check.status,
                    use_to_return_stock: use_to_return_stock,
                    // unit: product_data[i].unit
                    unit: data.choose_list[i].product_list[j].unit
                };

                product_list_array.push(product_list_data);

                data_alert_shop_name = shop_name;
                data_alert_po = payment_transaction_number;
                data_alert_product = product_name + " " + data.choose_list[i].product_list[j].attribute_option_1 + " " + data.choose_list[i].product_list[j].attribute_option_2 + " x " + quan + " " + price + " THB";
                data_alert_total = total_cal;

                var user_shop_id = await cartQuery.findUserShopid(shop_id);
                var one_id_shop = await cartQuery.findOneIdShop(
                    user_shop_id[0].user_id
                );
                var localTime = moment.utc().toDate();
                localTime = moment(localTime).utcOffset("+0700").format('YYYY/MM/DD HH:mm:ss');

                var msg = {
                    shop_name: data_alert_shop_name,
                    po: data_alert_po,
                    date: localTime,
                    product: data_alert_product,
                    total: data_alert_total
                }
                arr_msg.push(msg)

            }

            var product_detail = ""
            for (let i = 0; i < arr_msg.length; i++) {
                product_detail += arr_msg[i].product + "\n"
            }

            var message =
                arr_msg[0].shop_name +
                "\n" +
                "รหัสการสั่งซื้อ: " +
                arr_msg[0].po +
                "\n" +
                arr_msg[0].date +
                "\n" +
                "---------------------" +
                "\n\n\n" +
                product_detail +
                "\n\n\n" +
                "Total price no vat: " + data.choose_list[0].total_price_in_shop + " THB" +
                "\n" +
                "Discount: 0" + " THB" +
                "\n" +
                "Vat 7%: " + data.choose_list[0].total_vat_in_shop + " THB" +
                "\n" +
                "Total price vat: " + data.choose_list[0].total_price_vat_in_shop + " THB" +
                "\n" +
                "Shipping rate: " + data.choose_list[0].total_shipping_in_shop + " THB" +
                "\n" +
                "Net price: " + data.choose_list[0].total_net_price_in_shop + " THB"


            var msg_notification = "คำสั่งซื้อ " + data_alert_po + " ถูกสร้าง";
            await notiBotOneChat(one_id_shop, message, msg_notification);


            // if (ck_loop) {
            //   result(null,data_not_stock,400,"FAILED","Not enough product in stock");
            //   return;
            // }

            var required_invoice;
            var invoice_id;
            if (!data.invoice_id) {
                required_invoice = "no";
                invoice_id = null;
            } else {
                required_invoice = "yes";
                invoice_id = data.invoice_id;
            }
            if ((option1 || option2) || (option1 && option2)) {
                var product_weight_data = await cartQuery.productAttribute(product_id, option1, option2);
                let weight_cal = parseFloat(JSON.parse(product_weight_data[0].volumn_json).weight)
                var product_weight = weight_cal * quan;
            } else {
                var product_weight_data = await cartQuery.checkWeightforNoAttri(product_id);
                let weight_cal = parseFloat(product_weight_data)
                var product_weight = weight_cal * quan;
            }
            var buyer_name =
                data.address_data[0].first_name + " " + data.address_data[0].last_name;
            var order_number = payment_transaction_number;
            var product_list = JSON.stringify(product_list_array);
            var promotion = {promotion: [], discount: []};
            var promotion_discount = JSON.stringify(promotion);
            var total_quantity = data.total_quantity;
            var total_price_no_vat = data.total_price_no_vat;
            var total_discount = 0.0;
            var total_price_discount = 0.0;
            var total_price_vat = data.total_price_vat;
            var total_vat = data.total_vat;
            var total_shipping = data.total_shipping;
            var net_price = data.total_net_price;
            if (total_price_no_vat >= 5000 &&
                (data.address_data[0].province == "กรุงเทพมหานคร" ||
                    data.address_data[0].province == "นครปฐม" ||
                    data.address_data[0].province == "นนทบุรี" ||
                    data.address_data[0].province == "ปทุมธานี" ||
                    data.address_data[0].province == "สมุทรปราการ" ||
                    data.address_data[0].province == "สมุทรสาคร") &&
                product_weight >= 50000
            ) {
                var shipping_by = "seller_shop_shipping"
            } else if (total_price_no_vat >= 5000 &&
                !(data.address_data[0].province == "กรุงเทพมหานคร" ||
                    data.address_data[0].province == "นครปฐม" ||
                    data.address_data[0].province == "นนทบุรี" ||
                    data.address_data[0].province == "ปทุมธานี" ||
                    data.address_data[0].province == "สมุทรปราการ" ||
                    data.address_data[0].province == "สมุทรสาคร") &&
                product_weight >= 50000
            ) {
                var shipping_by = "seller_shop_shipping"
            } else if (total_price_no_vat >= 5000 &&
                (data.address_data[0].province == "กรุงเทพมหานคร" ||
                    data.address_data[0].province == "นครปฐม" ||
                    data.address_data[0].province == "นนทบุรี" ||
                    data.address_data[0].province == "ปทุมธานี" ||
                    data.address_data[0].province == "สมุทรปราการ" ||
                    data.address_data[0].province == "สมุทรสาคร") &&
                product_weight < 50000
            ) {
                var shipping_by = "seller_shop_shipping"
            } else if (total_price_no_vat >= 5000 &&
                !(data.address_data[0].province == "กรุงเทพมหานคร" ||
                    data.address_data[0].province == "นครปฐม" ||
                    data.address_data[0].province == "นนทบุรี" ||
                    data.address_data[0].province == "ปทุมธานี" ||
                    data.address_data[0].province == "สมุทรปราการ" ||
                    data.address_data[0].province == "สมุทรสาคร") &&
                product_weight < 50000
            ) {
                var shipping_by = "flash_shipping"
            } else if (total_price_no_vat < 5000 && product_weight < 50000
            ) {
                var shipping_by = "flash_shipping"
            } else if (total_price_no_vat < 5000 && product_weight >= 50000
            ) {
                var shipping_by = "seller_shop_shipping"
            }

            var status = "N";
            var created_by = "-1";
            var updated_by = "-1";

            // console.log("buyer_name : ", buyer_name);
            // console.log("order_number : ", order_number);
            // console.log("shop_id : ", shop_id);
            // console.log("product_list : ", product_list);
            // console.log("promotion_discount : ", promotion_discount);
            // console.log("total_quantity : ", total_quantity);
            // console.log("total_price_no_vat : ", total_price_no_vat);
            // console.log("total_discount : ", total_discount);
            // console.log("total_price_discount : ", total_price_discount);
            // console.log("total_price_vat : ", total_price_vat);
            // console.log("total_vat :", total_vat);
            // console.log("total_shipping : ", total_shipping);
            // console.log("net_price : ", net_price);
            // console.log("shipping_by : ", shipping_by);
            // console.log("status : ", status);
            // console.log("required_invoice : ", required_invoice);
            // console.log("invoice_id : ", invoice_id);
            // console.log("created_by : ", created_by);
            // console.log("updated_by : ", updated_by);
            if(shipping_by == "flash_shipping"){
              var shipping = await cartQuery.isShippingActive();
              if(shipping.length > 0){
                shipping_by == "flash_shipping"
              }else{
                shipping_by = "seller_shop_shipping"
              }
            }else{
              shipping_by = "seller_shop_shipping"
            }
            cartQuery.insertOrder(
                buyer_name,
                order_number,
                shop_id,
                product_list,
                promotion_discount,
                total_quantity,
                total_price_no_vat,
                total_discount,
                total_price_discount,
                total_price_vat,
                total_vat,
                total_shipping,
                net_price,
                shipping_by,
                status,
                required_invoice,
                invoice_id,
                created_by,
                updated_by
            );

            cartQuery.insertOrderTransactionJoin(
                order_number,
                payment_transaction_number
            );

            if (data.address_data[0].first_name) {
                cartQuery.insertUserAddressNew(
                    payment_transaction_number,
                    data.address_data[0].email,
                    data.address_data[0].first_name,
                    data.address_data[0].last_name,
                    data.address_data[0].address_detail,
                    data.address_data[0].sub_district,
                    data.address_data[0].district,
                    data.address_data[0].province,
                    data.address_data[0].phone,
                    data.address_data[0].zipcode,
                    localTime
                );
            } else {
                cartQuery.insertUserAddressNew(
                    payment_transaction_number,
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    localTime
                );
            }

            let customer_phone = data.address_data[0].phone;
            let customer_name = data.address_data[0].first_name + " " + data.address_data[0].last_name;
            let customer_email = data.address_data[0].email
            let pdf = await genPdf(payment_transaction_number, customer_name, customer_phone, customer_email);
            //console.log("pdf",pdf)
            var pdf_path_qu = pdf? pdf.data.pdf_path_qu:''
            let link_pdf = pdf? pdf.data.link_pdf:''
            // await notiBotOneChatPdf(one_id_shop, link_pdf, data_alert_po, msg_notification);
        }
        //await notiEmail(payment_transaction_number,pdf_path_qu)

        for (let i = 0; i < data.shop_list.length; i++) {
            for (let j = 0; j < data.shop_list[i].product_list.length; j++) {
                if (
                    in_array(
                        data.shop_list[i].product_list[j].product_id,
                        product_data_to_delete
                    )
                ) {
                    data.shop_list[i].product_list.splice(j, 1);
                    j--;
                }
            }

            if (data.shop_list[i].product_list.length == 0) {
                data.shop_list.splice(i, 1);
                i--;
            }
        }

        if (data.length == 0) {
            data.shop_to_cal = [];
            data.product_to_calculate = [];
            data.shop_list = [];
            data.payment_transaction_number = payment_transaction_number;
        } else {
            data.shop_to_cal = [];
            data.product_to_calculate = [];
            data.shop_list = data.shop_list;
            data.payment_transaction_number = payment_transaction_number;
        }
        result(null, data, 200, "SUCCESS", "Create Order success");
    } catch (err) {
        console.log(err.name + ": " + err.message);
        if (typeof err === "object" && err.stack) {
            console.log(err.stack);
        } else {
            console.log("No stack");
        }
        return result(err, null);

    }
};


module.exports = Cart;
