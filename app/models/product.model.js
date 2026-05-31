const sql = require("./db.js");
const util = require("util");
const { parse } = require("path");
const { json } = require("body-parser");
const { ShF_log_to_file } = require("../share_function/log_file");
const { Console } = require("console");
const productBySKU = require("../query/product_by_sku.query");
const he = require("he");

const query = util.promisify(sql.query).bind(sql);

// constructor
const Product = function (product) {
  this.id = product.id;
  this.composite_index = product.composite_index;
  this.custom_user_ID = product.custom_user_ID;
  this.what_component = product.what_component;
  this.component_ID = product.component_ID;
  this.product_array = product.product_array;
  this.custom_field = product.active;
};

Product.getProductBySKU = async (sku, result) => {
  let timeTaken = Date.now();
  let logfile = "get_product_by_SKU.log";
  let logjson = {
    name: logfile,
    parameter: "",
  };
  if (sku == "") {
    data_result = {
      message: "success",
      status: true,
      product_id:"",
      sku:"",
      product_name:"",
      product_short_description:"",
      price:"",
      product_image:"",
      QTY:"",
    };
    logjson.status = 200;
    logjson.return_data = data_result;
    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(null, data_result);
    return;
  }
  try {
    data_query = await query(
      "SELECT `ms_product`.`id` AS product_id, `ms_product`.`sku`, `ms_product`.`name` AS product_name, `ms_product_price`.`real_price` AS price , `ms_product_image_vdo`.`media_path` AS product_image,`ms_product`.`short_description` As description, `ms_product`.`unit` FROM `ms_product` JOIN `ms_product_price` ON `ms_product`.`id` = `ms_product_price`.`ms_product_id` JOIN `ms_product_image_vdo` ON `ms_product_image_vdo`.`product_id` = `ms_product`.`id` WHERE `ms_product`.`sku` = ? AND `ms_product_image_vdo`.`media_type` = 'image' AND `ms_product_image_vdo`.`index` = '0' ;",
      sku
    );
    if (data_query.length == 0) {
      let data_query_no_img = await query(
        "SELECT `ms_product`.`id` AS product_id, `ms_product`.`sku`, `ms_product`.`name` AS product_name, `ms_product_price`.`real_price` AS price , `ms_product`.`short_description` As description, `ms_product`.`unit` FROM `ms_product` JOIN `ms_product_price` ON `ms_product`.`id` = `ms_product_price`.`ms_product_id`  WHERE `ms_product`.`sku` = ?",
        sku
      );
      if(data_query_no_img.length == 0) {
        let return_data = await productBySKU.getProductBySKUForGetKeyword(sku);
        return_data.product_image = return_data === undefined ? "" :
          process.env.IMAGE_PATH + return_data.product_image;
        data_result = {
          message: "success",
          status: true,
          product_id: return_data.product_id,
          sku: return_data.sku,
          product_name: return_data.product_name ? return_data.product_name : '',
          product_short_description: return_data.description ? return_data.description : '',
          price: return_data.price ? return_data.price : '',
          product_image: return_data.product_image ? return_data.product_image : '',
          QTY: return_data.unit ? return_data.unit : '',
        };
        logjson.status = 200;
        logjson.return_data = data_result;
        logjson.execution_time = Date.now() - timeTaken;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result(null, data_result);
        return;
      }
      data_result = {
        message: "success",
        status: true,
        product_id: data_query_no_img.product_id,
        sku: data_query_no_img.sku,
        product_name: data_query_no_img.product_name ? data_query_no_img.product_name : '',
        product_short_description: data_query_no_img.description ? data_query_no_img.description : '',
        price: data_query_no_img.price ? data_query_no_img.price : '',
        product_image: "",
        QTY: data_query_no_img.unit ? data_query_no_img.unit : '',
      };
      logjson.status = 200;
      logjson.return_data = data_result;
      logjson.execution_time = Date.now() - timeTaken;
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result(null, data_result);
      return;
    }
    data_query[0].product_image =
      process.env.IMAGE_PATH + data_query[0].product_image;
    select_data = JSON.parse(JSON.stringify(data_query[0]));
    data_result = {
      message: "success",
      status: true,
      product_id: select_data.product_id,
      sku: select_data.sku,
      product_name: select_data.product_name ? select_data.product_name : '',
      product_short_description: select_data.description ? select_data.description : '',
      price: select_data.price ? select_data.price : '',
      product_image: select_data.product_image ? select_data.product_image : '',
      QTY: select_data.unit ? select_data.unit : '',
    };
    logjson.status = 200;
    logjson.return_data = data_result;
    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(null, data_result);
    return;
  } catch (error) {
    data_result = {
      message: "error",
      status: false,
      "error message": error,
    };
    logjson.status = 500;
    logjson.return_data = "";
    logjson.execution_time = Date.now() - timeTaken;
    logjson.message = error;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    console.log("error: ", error);
    result(null, data_result);
    return;
  }
  // sql.query("SELECT `ms_product`.`id` AS product_id, `ms_product`.`sku`, `ms_product`.`name` AS product_name, `ms_product_price`.`real_price` AS price , GROUP_CONCAT(DISTINCT `ms_product_image_vdo`.`media_path` SEPARATOR',') AS product_image FROM `ms_product` JOIN `ms_product_price` ON `ms_product`.`id` = `ms_product_price`.`ms_product_id` JOIN `ms_product_image_vdo` ON `ms_product_image_vdo`.`product_id` = `ms_product`.`id` WHERE `ms_product`.`sku` = ? AND `ms_product_image_vdo`.`media_type` = 'image';", sku, async (err, res) => {
  //     if (err) {
  //         logjson.status = 500
  //         logjson.return_data = ""
  //         logjson.execution_time = Date.now() - timeTaken
  //         logjson.message = err.name + ": " + err.message
  //         logjson = JSON.stringify(logjson)
  //         ShF_log_to_file(logfile, logjson)
  //         console.log("error: ", err);
  //         result(err, null);
  //         return
  //     } else if (res.length == 0 && res[0].product_id === null){
  //         let return_data = await productBySKU.getProductBySKU(sku)
  //         result(null, return_data)
  //         return
  //     } else {
  //     logjson.status = 200
  //     logjson.return_data = res
  //     logjson.execution_time = Date.now() - timeTaken
  //     logjson = JSON.stringify(logjson)
  //     ShF_log_to_file(logfile, logjson)
  //     result(null, res[0]);
  //     return
  //     }
  // });
};

Product.getAll = (result) => {
  let timeTaken = Date.now();
  let logfile = "getAll_custom_ruleFunc.log";
  let logjson = {
    name: logfile,
    parameter: "",
  };
  sql.query("SELECT * FROM tb_custom_rule_product_sorted_list", (err, res) => {
    if (err) {
      logjson.status = 500;
      logjson.return_data = "";
      logjson.execution_time = Date.now() - timeTaken;
      logjson.message = err.name + ": " + err.message;
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      console.log("error: ", err);
      result(err, null);
      return;
    }
    logjson.status = 200;
    logjson.return_data = res;
    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    console.log("product: ", res);
    result(null, res);
    return;
  });
};

// ในส่วนนี้เขียน logic ไว้เรียบร้อยแล้ว
//==== ตัวอย่าง input ====
// {
//     "custom_user_ID":"555",
//     "what_component":"category_product",
//     "component_ID":"100"
// }
// =====================

Product.getCustomRuleProductList = async (
  custom_user_ID,
  what_component,
  component_ID,
  extra_query_rule,
  result
) => {
  let composite_index =
    custom_user_ID + "+" + what_component + "+" + component_ID;
  let timeTaken = Date.now();
  let logfile = "get_custom_rule_productFunc.log";
  let logjson = {
    name: logfile,
    parameter: {
      custom_user_ID: custom_user_ID,
      what_component: what_component,
      component_ID: component_ID,
      extra_query_rule: extra_query_rule,
    },
  };
  let URL = [];
  let product_list = [];
  let sub_product_list = [];
  let sub_product_list_array = [];
  try {
    if (
      typeof (custom_user_ID == "number" || typeof custom_user_ID == "int") &&
      (what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product" ||
        what_component == "promotion")
    ) {
      if (
        what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "promotion"
      ) {
        if (component_ID && parseInt(component_ID)) {
          if (what_component == "category_product") {
            let finalRes = { ok: "", product_array: [], sub_product_array: [] };
            const queryResult = await query(
              "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
              composite_index
            );

            if (queryResult.length == 0) {
              finalRes.ok = "y";
              finalRes.message = "custom rule not exist";
              logjson.status = 200;
              logjson.return_data = "";
              logjson.message = "custom rule not exist";
              logjson.execution_time = Date.now() - timeTaken;
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result(null, finalRes);
              return;
            }

            let componentId = JSON.parse(queryResult[0].component_ID);
            let allProductIdSub = [];
            let all_product_id_from_component = [];
            let sub_product_array = [];
            // console.log(allProducts)

            const hierachy = await query(
              "SELECT hierachy FROM ms_category  WHERE id = ?",
              componentId
            );
            const allSubProduct = await query(
              "SELECT id FROM ms_category  WHERE hierachy LIKE ?",
              `%${hierachy[0].hierachy}%`
            );
            allSubProduct.forEach((s) => {
              allProductIdSub.push(s.id);
            });

            allSubProduct.forEach((c) => {
              all_product_id_from_component.push(
                composite_index.split("+")[0] +
                  "+" +
                  composite_index.split("+")[1] +
                  "+" +
                  c.id
              );
            });
            if (all_product_id_from_component.length > 0) {
              for (var i = 0; i < all_product_id_from_component.length; i++) {
                if (all_product_id_from_component[i] == composite_index) {
                  all_product_id_from_component.splice(i, 1);
                }
              }
              if (all_product_id_from_component.length > 0) {
                const sub_product_query = await query(
                  "SELECT * FROM `tb_custom_rule_product_sorted_list` WHERE composite_index IN (?)",
                  [all_product_id_from_component]
                );
                sub_product_query.forEach((s) => {
                  sub_product_array.push(s.product_array);
                });
              } else {
                sub_product_array = [];
              }
            } else {
              let finalRes = {
                ok: "y",
                product_array: [],
                sub_product_array: [],
              };

              logjson.status = 200;
              logjson.return_data = finalRes;
              logjson.execution_time = Date.now() - timeTaken;
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result(null, finalRes);
              return;
            }
            finalRes.ok = "y";
            finalRes.product_array =
              JSON.parse(queryResult[0].product_array) || [];
            if (sub_product_array.length < 1) {
              finalRes.sub_product_array = [];
            } else {
              sub_product_array.forEach((element) => {
                finalRes.sub_product_array.push(JSON.parse(element));
              });
            }

            if (finalRes.product_array.length > 0) {
              let query_product_list = await query(
                "SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC",
                [finalRes.product_array]
              );
              product_list = query_product_list;
              customSort({
                data: product_list,
                sortBy: finalRes.product_array,
                sortField: "id",
              });
              //console.log(product_list);

              let id_query_product_list = query_product_list.map(
                (value) => value.id
              );
              // console.log(id_query_product_list)

              if (id_query_product_list.length == 0) {
                id_query_product_list = [0];
              }

              let searchURLImg = await query(
                "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
                [id_query_product_list]
              );

              //console.log(searchURLImg)
              if (searchURLImg.length > 0 && product_list.length > 0) {
                let productIDImageURL = {};
                for (let j = 0; j < searchURLImg.length; ++j) {
                  if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                    productIDImageURL[searchURLImg[j].ms_product_id] = [];
                  }
                  productIDImageURL[searchURLImg[j].ms_product_id].push(
                    process.env.IMAGE_PATH + searchURLImg[j].URL
                  );
                }

                for (let index = 0; index < product_list.length; index++) {
                  product_list[index].images_URL =
                    productIDImageURL[product_list[index].id];
                }
              }
              let searchPromotion = await query(
                "SELECT product_id,promotion_id FROM ms_product_promotion WHERE product_id  IN (?)",
                [id_query_product_list]
              );
              if (searchPromotion.length > 0 && product_list.length > 0) {
                let productIDPromotionId = {};
                for (let j = 0; j < searchPromotion.length; ++j) {
                  if (
                    !(searchPromotion[j].product_id in productIDPromotionId)
                  ) {
                    productIDPromotionId[searchPromotion[j].product_id] = [];
                  }
                  productIDPromotionId[searchPromotion[j].product_id].push(
                    searchPromotion[j].promotion_id
                  );
                }

                for (let index = 0; index < product_list.length; index++) {
                  product_list[index].promotion_id =
                    productIDPromotionId[product_list[index].id];
                }
              }

              for (let index = 0; index < product_list.length; index++) {
                if (!product_list[index].images_URL) {
                  product_list[index].images_URL = [];
                }
                if (!product_list[index].promotion_id) {
                  product_list[index].promotion_id = [];
                }
              }
              // --------------old code-------------
              // for (let index = 0; index < finalRes.product_array.length; index++) {
              //     let query_product_list = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC", finalRes.product_array[index])
              //     product_list.push(query_product_list[0])
              // }
              // for (let index = 0; index < product_list.length; index++) {
              //     URL = []
              //     let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", product_list[index].id)
              //     if (searchURLImg.length > 0) {
              //         searchURLImg.forEach(element => {
              //             URL.push(element.URL)
              //         });
              //     }
              //     product_list[index].images_URL = URL
              // }
              // --------------old code-------------

              if (product_list) {
                finalRes.ok = "y";
                finalRes.product_list = product_list;
              }
            } else {
              finalRes.product_list = [];
            }

            if (finalRes.sub_product_array.length > 0) {
              for (
                let index = 0;
                index < finalRes.sub_product_array.length;
                index++
              ) {
                sub_product_list_array = [];
                if (finalRes.sub_product_array[index].length > 0) {
                  for (
                    let s = 0;
                    s < finalRes.sub_product_array[index].length;
                    s++
                  ) {
                    if (finalRes.sub_product_array[index][s] > 0) {
                      let query_sub_product_list = await query(
                        "SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC",
                        finalRes.sub_product_array[index][s]
                      );
                      sub_product_list_array.push(query_sub_product_list[0]);
                      for (
                        let index = 0;
                        index < sub_product_list_array.length;
                        index++
                      ) {
                        URL = [];
                        let PROMOTION = [];
                        let searchURLImg = await query(
                          "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
                          sub_product_list_array[index].id
                        );
                        if (searchURLImg.length > 0) {
                          searchURLImg.forEach((element) => {
                            URL.push(element.URL);
                          });
                        }
                        sub_product_list_array[index].images_URL = URL;
                        let searchPromotion = await query(
                          "SELECT promotion_id FROM ms_product_promotion WHERE product_id = ? ORDER BY image_index ASC",
                          sub_product_list_array[index].id
                        );
                        if (searchPromotion.length > 0) {
                          searchPromotion.forEach((element) => {
                            PROMOTION.push(element.promotion_id);
                          });
                        }
                        sub_product_list_array[index].promotion_id = PROMOTION;
                      }
                    } else {
                      sub_product_list_array.push([]);
                    }
                  }
                  sub_product_list.push(sub_product_list_array);
                } else {
                  sub_product_list.push([]);
                }
              }
              finalRes.sub_product_list = sub_product_list;
            } else {
              finalRes.sub_product_list = [];
            }
            // console.log("finalRes: ", finalRes)
            logjson.status = 200;
            logjson.return_data = finalRes;
            logjson.execution_time = Date.now() - timeTaken;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, finalRes);
            return;
          } else {
            let finalRes = { ok: "", product_array: [], sub_product_array: [] };
            let res = await query(
              "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
              composite_index
            );
            if (!res || res.length == 0) {
              console.log("message: ", "no data");
              logjson.status = 200;
              logjson.return_data = "";
              logjson.execution_time = Date.now() - timeTaken;
              logjson.message = "no data";
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result({ message: "no data" }, null);
              return;
            }
            let product_array = JSON.parse(res[0].product_array);
            let ProductList = await query(
              "SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC",
              [product_array]
            );
            customSort({
              data: ProductList,
              sortBy: product_array,
              sortField: "id",
            });

            let image_vdo = await query(
              "SELECT product_id, media_path FROM ms_product_image_vdo WHERE product_id IN (?)",
              [product_array]
            );

            // this is very inefficient...
            for (i = 0; i < image_vdo.length; ++i) {
              for (j = 0; j < ProductList.length; ++j) {
                if (image_vdo[i].product_id == ProductList[j].id) {
                  if (!("images_URL" in ProductList[j])) {
                    ProductList[j].images_URL = [];
                  }

                  ProductList[j].images_URL.push(
                    process.env.IMAGE_PATH + image_vdo[i].media_path
                  );
                }
              }
            }

            finalRes.ok = "y";
            finalRes.product_array =
              res.length > 0 ? JSON.parse(res[0].product_array) : [];
            finalRes.product_list = ProductList.length > 0 ? ProductList : [];
            finalRes.sub_product_array = [];
            logjson.status = 200;
            logjson.return_data = finalRes;
            logjson.execution_time = Date.now() - timeTaken;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            // console.log("finalRes: ", finalRes);
            result(null, finalRes);
          }
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.message = "missing/invalid component_ID";
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "missing/invalid component_ID" }, null);
          return;
        }
      } else if (
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product"
      ) {
        if (component_ID == "") {
          let finalRes = { ok: "", product_array: [], sub_product_array: [] };
          let res = await query(
            "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
            composite_index
          );
          if (!res || res.length == 0) {
            console.log("message: ", "no data");
            logjson.status = 200;
            logjson.return_data = "";
            logjson.execution_time = Date.now() - timeTaken;
            logjson.message = "no data";
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result({ message: "no data" }, null);
            return;
          }
          let product_array = JSON.parse(res[0].product_array);
          let ProductList = await query(
            "SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC",
            [product_array]
          );
          customSort({
            data: ProductList,
            sortBy: product_array,
            sortField: "id",
          });

          let image_vdo = await query(
            "SELECT product_id, media_path FROM ms_product_image_vdo WHERE product_id IN (?)",
            [product_array]
          );

          // this is very inefficient...
          for (i = 0; i < image_vdo.length; ++i) {
            for (j = 0; j < ProductList.length; ++j) {
              if (image_vdo[i].product_id == ProductList[j].id) {
                if (!("images_URL" in ProductList[j])) {
                  ProductList[j].images_URL = [];
                }

                ProductList[j].images_URL.push(
                  process.env.IMAGE_PATH + image_vdo[i].media_path
                );
              }
            }
          }

          finalRes.ok = "y";
          finalRes.product_array =
            res.length > 0 ? JSON.parse(res[0].product_array) : [];
          finalRes.product_list = ProductList.length > 0 ? ProductList : [];
          finalRes.sub_product_array = [];
          logjson.status = 200;
          logjson.return_data = finalRes;
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          // console.log("finalRes: ", finalRes);
          result(null, finalRes);
          return;
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.execution_time = Date.now() - timeTaken;
          logjson.message = "component_ID not required";
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "component_ID not required" }, null);
          return;
        }
      }
    } else {
      logjson.status = 400;
      logjson.return_data = "";
      logjson.execution_time = Date.now() - timeTaken;
      logjson.message = "missing/invalid custom_user_ID or what_component";
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result({ message: "missing/invalid custom_user_ID or what_component" });
      return;
    }
  } catch (err) {
    logjson.status = 500;
    logjson.return_data = "";
    logjson.message = err.name + ": " + err.message;

    if (typeof err === "object" && err.stack) {
      logjson.errstack = err.stack;
    } else {
      logjson.errstack = "";
    }

    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(err, null);
    return;
  }
};

function isNormalInteger(str) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

Product.upsertCustomRuleProductList = async (
  custom_user_ID,
  what_component,
  component_ID,
  product_array,
  token,
  result
) => {
  let timeTaken = Date.now();
  let logfile = "upsert_custom_rule_productFunc.log";
  let logjson = {
    name: logfile,
    parameter: {
      custom_user_ID: custom_user_ID,
      what_component: what_component,
      component_ID: component_ID,
      product_array: product_array,
    },
  };

  let errMsg = "";
  let product_array_sane_check = 1;
  try {
    if (typeof product_array != "string") {
      logjson.status = 400;
      logjson.return_data = "";
      logjson.execution_time = Date.now() - timeTaken;
      logjson.message = errMsg;
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result({ message: "product_array must be string" }, null);
      return;
    }

    /*let Login = await isLogin(token)
        if (!Login) {
            logjson.status = 400
            logjson.return_data = ""
            logjson.execution_time = Date.now() - timeTaken
            logjson.message = errMsg
            logjson = JSON.stringify(logjson)
            ShF_log_to_file(logfile, logjson)
            console.log("Invalid token")
            console.log(token)
            result({ message: "Please login" }, null);
            return;
        }*/
    // if (!(product_array.charAt(0) == "[" && product_array.charAt(product_array.length - 1) == "]")) {
    //     product_array_sane_check = 0
    //     errMsg = "Not array"
    // } else {

    //     stripped_product_array = product_array.substr(1, product_array.length - 2)
    //     splitted_product_array = stripped_product_array.split(",")
    //     //console.log(stripped_product_array)
    //     //console.log(splitted_product_array)
    //     for (i = 0; i < splitted_product_array.length; ++i) {
    //         if (!(isNormalInteger(splitted_product_array[i]))) {

    //             product_array_sane_check = 0
    //             errMsg = "index " + i + " is not integer"
    //             break
    //         }
    //     }
    // }
  } catch (err) {
    product_array_sane_check = 0;
    errMsg = err.name + ": " + err.message;
  }

  if (product_array_sane_check == 0) {
    logjson.status = 400;
    logjson.return_data = "";
    logjson.execution_time = Date.now() - timeTaken;
    logjson.message = errMsg;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result({ message: errMsg }, null);
    return;
  }

  let composite_index =
    custom_user_ID + "+" + what_component + "+" + component_ID;
  try {
    if (
      typeof (custom_user_ID == "number" || typeof custom_user_ID == "int") &&
      (what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product" ||
        what_component == "promotion")
    ) {
      if (
        what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "promotion"
      ) {
        if (component_ID && parseInt(component_ID)) {
          // -----------------old code ---------------------
          // product_id_checker = sql.query("SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?", composite_index, (err, res) => {
          // console.log(product_id_checker);
          //     if (err) {
          //         logjson.status = 500
          //         logjson.return_data = ""
          //         logjson.execution_time = Date.now() - timeTaken
          //         logjson.message = err.name + ": " + err.message
          //         logjson = JSON.stringify(logjson)
          //         ShF_log_to_file(logfile, logjson)
          //         console.log("error: ", err);
          //         result(err, null);
          //         return;
          //     }

          // ---------------new code ---------------------- (benz)
          try {
            var product_id_checker = await query(
              "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
              composite_index
            );
          } catch (error) {
            logjson.status = 500;
            logjson.return_data = "";
            logjson.execution_time = Date.now() - timeTaken;
            logjson.message = err.name + ": " + err.message;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (product_id_checker.length == 0) {
            // not found product with the id
            sql.query(
              "INSERT INTO tb_custom_rule_product_sorted_list(composite_index,custom_user_ID, what_component, component_ID, product_array) VALUES (?, ?, ?, ?,?)",
              [
                composite_index,
                custom_user_ID,
                what_component,
                component_ID,
                product_array,
              ],
              (err, res) => {
                if (err) {
                  logjson.status = 500;
                  logjson.return_data = "";
                  logjson.execution_time = Date.now() - timeTaken;
                  logjson.message = err.name + ": " + err.message;
                  logjson = JSON.stringify(logjson);
                  ShF_log_to_file(logfile, logjson);
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                logjson.status = 200;
                logjson.return_data = res;
                logjson.execution_time = Date.now() - timeTaken;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                result(null, { ok: "y ", result: res });
                return;
              }
            );
          } else {
            sql.query(
              "UPDATE tb_custom_rule_product_sorted_list SET composite_index = ?, custom_user_ID = ?, what_component = ?, component_ID = ?, product_array = ? WHERE composite_index = ?",
              [
                composite_index,
                custom_user_ID,
                what_component,
                component_ID,
                product_array,
                composite_index,
              ],
              (err, res) => {
                if (err) {
                  logjson.status = 500;
                  logjson.return_data = "";
                  logjson.execution_time = Date.now() - timeTaken;
                  logjson.message = err.name + ": " + err.message;
                  logjson = JSON.stringify(logjson);
                  ShF_log_to_file(logfile, logjson);
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                logjson.status = 200;
                logjson.return_data = res;
                logjson.execution_time = Date.now() - timeTaken;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                console.log("update product with id: ", composite_index);
                result(null, { ok: "y ", result: res });
                return;
              }
            );
          }
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.execution_time = Date.now() - timeTaken;
          logjson.message = "missing/invalid component_ID";
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "missing/invalid component_ID" }, null);
          return;
        }
      } else if (
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product"
      ) {
        if (component_ID == "") {
          sql.query(
            "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
            composite_index,
            (err, res) => {
              if (err) {
                logjson.status = 500;
                logjson.return_data = "";
                logjson.execution_time = Date.now() - timeTaken;
                logjson.message = err.name + ": " + err.message;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if (res.length == 0) {
                sql.query(
                  "INSERT INTO tb_custom_rule_product_sorted_list(composite_index,custom_user_ID, what_component, component_ID, product_array) VALUES (?, ?, ?, ?,?)",
                  [
                    composite_index,
                    custom_user_ID,
                    what_component,
                    component_ID,
                    product_array,
                  ],
                  (err, res) => {
                    if (err) {
                      logjson.status = 500;
                      logjson.return_data = "";
                      logjson.execution_time = Date.now() - timeTaken;
                      logjson.message = err.name + ": " + err.message;
                      logjson = JSON.stringify(logjson);
                      ShF_log_to_file(logfile, logjson);
                      console.log("error: ", err);
                      result(err, null);
                      return;
                    }
                    result(null, { ok: "y ", result: res });
                    return;
                  }
                );
              } else {
                sql.query(
                  "UPDATE tb_custom_rule_product_sorted_list SET composite_index = ?, custom_user_ID = ?, what_component = ?, component_ID = ?, product_array = ? WHERE composite_index = ?",
                  [
                    composite_index,
                    custom_user_ID,
                    what_component,
                    component_ID,
                    product_array,
                    composite_index,
                  ],
                  (err, res) => {
                    if (err) {
                      logjson.status = 500;
                      logjson.return_data = "";
                      logjson.execution_time = Date.now() - timeTaken;
                      logjson.message = err.name + ": " + err.message;
                      logjson = JSON.stringify(logjson);
                      ShF_log_to_file(logfile, logjson);
                      console.log("error: ", err);
                      result(err, null);
                      return;
                    }
                    logjson.status = 200;
                    logjson.return_data = res;
                    logjson.execution_time = Date.now() - timeTaken;
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                    console.log(
                      "update product with composite_index: ",
                      composite_index
                    );
                    result(null, { ok: "y ", result: res });
                    return;
                  }
                );
              }
            }
          );
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.message = "component_ID not required";
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "component_ID not required" }, null);
          return;
        }
      }
      // result(null, { ok: "y " });
    } else {
      logjson.status = 400;
      logjson.return_data = "";
      logjson.message = "missing/invalid custom_user_ID or what_component";
      logjson.execution_time = Date.now() - timeTaken;
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result({ message: "missing/invalid custom_user_ID or what_component" });
      return;
    }
  } catch (err) {
    logjson.status = 500;
    logjson.return_data = "";
    logjson.message = err.name + ": " + err.message;

    if (typeof err === "object" && err.stack) {
      logjson.errstack = err.stack;
    } else {
      logjson.errstack = "";
    }

    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(err, null);
    return;
  }
};

Product.deleteCustomRuleProductList = (
  custom_user_ID,
  what_component,
  component_ID,
  result
) => {
  let timeTaken = Date.now();
  let logfile = "delete_custom_rule_productFunc.log";
  let logjson = {
    name: logfile,
    parameter: {
      custom_user_ID: custom_user_ID,
      what_component: what_component,
      component_ID: component_ID,
    },
  };
  let composite_index =
    custom_user_ID + "+" + what_component + "+" + component_ID;
  try {
    if (
      typeof (custom_user_ID == "number" || typeof custom_user_ID == "int") &&
      (what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product" ||
        what_component == "promotion")
    ) {
      if (
        what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "promotion"
      ) {
        if (component_ID && parseInt(component_ID)) {
          sql.query(
            "DELETE FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
            composite_index,
            (err, res) => {
              if (err) {
                console.log("error: ", err);
                logjson.status = 500;
                logjson.return_data = "";
                logjson.message = err.name + ": " + err.message;
                logjson.execution_time = Date.now() - timeTaken;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                result(err, null);
                return;
              }

              let toReturn = { ok: "y", result: res };

              if (res.affectedRows == 0) {
                toReturn.productFound = 0;
                // not found product with the id
                //result(null, { ok: "y", result: res});
                //return;
              } else {
                toReturn.productFound = 1;
              }

              logjson.status = 200;
              logjson.return_data = toReturn;
              logjson.execution_time = Date.now() - timeTaken;
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result(null, toReturn);
              return;
            }
          );
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.message = "missing/invalid component_ID";
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "missing/invalid component_ID" }, null);
          return;
        }
      } else if (
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product"
      ) {
        if (component_ID == "") {
          sql.query(
            "DELETE FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
            composite_index,
            (err, res) => {
              if (err) {
                logjson.status = 500;
                logjson.return_data = "";
                logjson.message = err.name + ": " + err.message;
                logjson.execution_time = Date.now() - timeTaken;
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
                console.log("error: ", err);
                result(err, null);
                return;
              }
              /*if (res.affectedRows == 0) {
                            // not found product with the id
                            logjson.status = 400
                            logjson.return_data = ""
                            logjson.execution_time = Date.now() - timeTaken
                            logjson = JSON.stringify(logjson)
                            ShF_log_to_file(logfile, logjson)
                            result({ message: "not_found" }, null);
                            return;
                        }*/
              let toReturn = { ok: "y", result: res };
              if (res.affectedRows == 0) {
                toReturn.productFound = 0;
              } else {
                toReturn.productFound = 1;
              }

              logjson.status = 200;
              logjson.return_data = res;
              logjson.execution_time = Date.now() - timeTaken;
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result(null, toReturn);
              return;
            }
          );
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.message = "component_ID not required";
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "component_ID not required" }, null);
          return;
        }
      }
    } else {
      logjson.status = 400;
      logjson.return_data = "";
      logjson.message = "missing/invalid custom_user_ID or what_component";
      logjson.execution_time = Date.now() - timeTaken;
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result({ message: "missing/invalid custom_user_ID or what_component" });
      return;
    }
  } catch (err) {
    logjson.status = 500;
    logjson.return_data = "";
    logjson.message = err.name + ": " + err.message;
    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(err, null);
    return;
  }
};

// ในส่วนของฟังก์ชั่นนี้เหลือ logic ในข้อ 9 และข้อ 10 ครับ และการ validate นอกนั้นเสร็จแล้ว test เรียบร้อยครับ
// ===== ตัวอย่าง input =====
// {
//     "begin_search_type":"component",
//     "begin_search_details": {
//         "custom_user_ID": "555",
//         "what_component": "category_product",
//         "component_id": "111"
//        },
//     "extra_filters": [{}]
// }
// =========================
Product.search = async (
  begin_search_type,
  begin_search_details,
  extra_filters,
  search_category_from_result,
  search_industry_from_result,
  search_brand_from_result,
  seller_shop_id,
  token,
  role_user,
  order_by_price,
  order_by_sku,
  result
) => {
  let timeTaken = Date.now();
  let finalResult = {};
  let all_product_from_sorted_list;
  let all_product_from_component = [];
  let search_result_product_list = [];
  let search_result_product_list_tmp = [];
  let search_result_product_list_industry_tmp = [];
  let search_result_product_list_brand_tmp = [];
  let all_product_from_sorted_list_tmp = [];
  let array_product = [];
  let product_list = [];
  let dup_cleaner_final_list = [];
  let URL = [];
  let logfile = "searchFunc.log";
  let mysql_seller_shop_id_cmd = "";
  let mysql_p_seller_shop_id_cmd = "";
  let mysql_i_seller_shop_id_cmd = "";
  let mysql_b_seller_shop_id_cmd = "";
  if (isNormalInteger(seller_shop_id)) {
    mysql_seller_shop_id_cmd = "seller_shop_id = " + seller_shop_id + " AND";
    mysql_p_seller_shop_id_cmd =
      "p.seller_shop_id = " + seller_shop_id + " AND";
    mysql_i_seller_shop_id_cmd =
      "i.seller_shop_id = " + seller_shop_id + " AND";
    mysql_b_seller_shop_id_cmd =
      "b.seller_shop_id = " + seller_shop_id + " AND";
  }

  if (begin_search_details.forced_component_id != undefined) {
    begin_search_details.component_id =
      begin_search_details.forced_component_id;
  }

  try {
    if (begin_search_type == "product_id") {
      let searchResult = [];
      if (begin_search_details.id) {
        searchResult = await query(
          "SELECT * FROM `ms_product` WHERE id = ?",
          begin_search_details.id
        );
      }
      if (searchResult.length > 0) {
        let searchURLImg = await query(
          "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
          [searchResult[0].id]
        );
        if (searchURLImg.length > 0 && searchResult.length > 0) {
          productIDImageURL = {};
          for (let j = 0; j < searchURLImg.length; ++j) {
            if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
              productIDImageURL[searchURLImg[j].ms_product_id] = [];
            }
            productIDImageURL[searchURLImg[j].ms_product_id].push(
              process.env.IMAGE_PATH + searchURLImg[j].URL
            );
          }
          for (let index = 0; index < searchResult.length; index++) {
            searchResult[index].images_URL =
              productIDImageURL[searchResult[index].id];
          }
        }
      }
      finalResult.query_result = searchResult;
    } else if (begin_search_type == "search_bar") {
      let searchBarResult = await query(
        "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name,name_en, inventory_ratio, stock_count, inventory_stock, IF(description, null, null) as description,IF(description_en, null, null) as description_en, short_description,short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE (status = 'active' AND name LIKE ?) OR (status = 'active' AND sku LIKE ?) OR (status = 'active' AND description LIKE ?) OR (status = 'active' AND description_en LIKE ?) OR (status = 'active' AND short_description LIKE ?) OR (status = 'active' AND name_en LIKE ?) OR (status = 'active' AND short_description_en LIKE ?) OR id IN (SELECT mp.id FROM `ms_product` mp JOIN tb_tag_product_join ttpj ON ttpj.product_ID = mp.id JOIN tb_tag tt ON ttpj.tag_ID = tt.id WHERE mp.status = 'active' AND tt.name LIKE ?) OR id IN (SELECT mp.id FROM `ms_product` mp JOIN ms_product_attribute mpa ON mpa.product_id = mp.id WHERE mp.status = 'active' AND mpa.new_sku LIKE ?) ORDER BY updated_at DESC",
        [
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
        ]
      );

      let id_searchBarResult = searchBarResult.map((value) => value.id);

      if (id_searchBarResult.length == 0) {
        id_searchBarResult = [0];
      }

      let searchURLImg = await query(
        "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
        [id_searchBarResult]
      );

      URL = [];

      if (searchURLImg.length > 0 && searchBarResult.length > 0) {
        productIDImageURL = {};
        for (let j = 0; j < searchURLImg.length; ++j) {
          if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
            productIDImageURL[searchURLImg[j].ms_product_id] = [];
          }
          productIDImageURL[searchURLImg[j].ms_product_id].push(
            process.env.IMAGE_PATH + searchURLImg[j].URL
          );
        }

        for (let index = 0; index < searchBarResult.length; index++) {
          searchBarResult[index].images_URL =
            productIDImageURL[searchBarResult[index].id];
        }
      }
      if (searchBarResult) {
        finalResult.ok = "y";
        finalResult.query_result = searchBarResult;
      }

      var query_result_remove_html = [];
      newskudict = {};
      var result_by_new_sku = await query(
        "SELECT mp.id FROM `ms_product` mp JOIN ms_product_attribute mpa ON mpa.product_id = mp.id WHERE mp.status = 'active' AND mpa.new_sku LIKE ?",
        `%${begin_search_details.keyword}%`
      );
      for (let index = 0; index < result_by_new_sku.length; index++) {
        newskudict[result_by_new_sku[index].id] = 0;
      }
      for (let index = 0; index < finalResult.query_result.length; index++) {
        let html =
          finalResult.query_result[index].description == null
            ? ""
            : finalResult.query_result[index].description;
        let stripedHtml = html.replace(/<[^>]+>/g, "");
        var decodedStripedHtml = he.decode(stripedHtml);
        if (
          decodedStripedHtml
            .toLowerCase()
            .includes(begin_search_details.keyword.toLowerCase()) ||
          (finalResult.query_result[index].name === null
            ? 0
            : finalResult.query_result[index].name
                .toLowerCase()
                .includes(begin_search_details.keyword.toLowerCase())) ||
          (finalResult.query_result[index].name_en === null
            ? 0
            : finalResult.query_result[index].name_en
                .toLowerCase()
                .includes(begin_search_details.keyword.toLowerCase())) ||
          (finalResult.query_result[index].sku === null
            ? 0
            : finalResult.query_result[index].sku
                .toLowerCase()
                .includes(begin_search_details.keyword.toLowerCase())) ||
          (finalResult.query_result[index].short_description === null
            ? 0
            : finalResult.query_result[index].short_description
                .toLowerCase()
                .includes(begin_search_details.keyword.toLowerCase())) ||
          (finalResult.query_result[index].short_description_en === null
            ? 0
            : finalResult.query_result[index].short_description_en
                .toLowerCase()
                .includes(begin_search_details.keyword.toLowerCase())) ||
          typeof newskudict[finalResult.query_result[index].id] !== "undefined"
        ) {
          query_result_remove_html.push(finalResult.query_result[index]);
        }
      }
      finalResult.query_result = query_result_remove_html;
    } else if (begin_search_type == "component") {
      let allowed_components = [
        "new_product",
        "best_seller",
        "recommended_product",
        "category_product",
        "industry_product",
        "brand_product",
        "promotion",
      ];

      if (!allowed_components.includes(begin_search_details.what_component)) {
        let logjson = {
          name: logfile,
          parameter: {
            begin_search_type: begin_search_type,
            begin_search_details: begin_search_details,
            extra_filters: extra_filters,
            search_category_from_result: search_category_from_result,
            search_industry_from_result: search_industry_from_result,
            search_brand_from_result: search_brand_from_result,
          },
        };
        logjson.status = 400;
        logjson.return_data = "";
        logjson.execution_time = Date.now() - timeTaken;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result({ message: "what_component invalid" }, null);
        return;
      }

      let composite_index =
        begin_search_details.custom_user_ID +
        "+" +
        begin_search_details.what_component +
        "+" +
        begin_search_details.component_id;

      const searchComponentResult = await query(
        "SELECT product_array,component_ID FROM `tb_custom_rule_product_sorted_list` WHERE composite_index = ?",
        composite_index
      );
      if (searchComponentResult.length == 0) {
        let logjson = {
          name: logfile,
          parameter: {
            begin_search_type: begin_search_type,
            begin_search_details: begin_search_details,
            extra_filters: extra_filters,
            search_category_from_result: search_category_from_result,
            search_industry_from_result: search_industry_from_result,
            search_brand_from_result: search_brand_from_result,
          },
        };
        /*logjson.status = 200
                logjson.return_data = ""
                logjson.message = "custom rule not exist"
                logjson.execution_time = Date.now() - timeTaken
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                result(null, { "ok": "y", "query_result": [], "message": "custom rule not exist" })
                return*/
        all_product_from_sorted_list = [0];
        original_all_product_from_sorted_list = all_product_from_sorted_list;
        //console.log("custom rule not existed")
      } else {
        all_product_from_sorted_list = JSON.parse(
          searchComponentResult[0].product_array
        );
        original_all_product_from_sorted_list = all_product_from_sorted_list;
      }
      //console.log("all_product_from_sorted_list")
      //console.log(all_product_from_sorted_list)
      cateId = begin_search_details.component_id; // JSON.parse(searchComponentResult[0].component_ID)

      if (begin_search_details.what_component == "category_product") {
        //console.log("category_product")

        let allProductIdSub = [];
        const searchProductResultSorted = await query(
          "SELECT hierachy FROM `ms_category` WHERE " +
            mysql_seller_shop_id_cmd +
            " id = ?",
          cateId
        );

        if (searchProductResultSorted.length > 0) {
          //const cateIdSubAll = await query("SELECT id FROM `ms_category` WHERE " + mysql_seller_shop_id_cmd + " hierachy like ?", `${searchProductResultSorted[0].hierachy}\_%`)
          //const cateIdSubAll = await query("SELECT id FROM `ms_category` WHERE " + mysql_seller_shop_id_cmd + " hierachy like '" +  searchProductResultSorted[0].hierachy + "_%'")

          // above has issue. Still can't fix. Use below for now.
          const cateIdSubAll = await query(
            "SELECT id FROM `ms_category` WHERE " +
              mysql_seller_shop_id_cmd +
              " hierachy = ?",
            searchProductResultSorted[0].hierachy
          );

          cateIdSubAll.forEach((c) => {
            allProductIdSub.push(c.id);
          });
          // console.log(allProductIdSub)
          const all_product_from_component = await query(
            "SELECT ms_product_id FROM `ms_product_category` WHERE ms_category_id IN (?)",
            [allProductIdSub]
          );
          //console.log('all_product_from_component => ', all_product_from_component)
          if (all_product_from_sorted_list.length > 0) {
            let CustomProductResult = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description,description_en, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,name_en,short_description_en,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active'",
              [all_product_from_sorted_list]
            );
            let id_CustomProductResult = CustomProductResult.map(
              (value) => value.id
            );

            if (id_CustomProductResult.length == 0)
              id_CustomProductResult = [0];

            let searchURLImg = await query(
              "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
              [id_CustomProductResult]
            );

            if (searchURLImg.length > 0 && CustomProductResult.length > 0) {
              productIDImageURL = {};
              for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                  productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                  process.env.IMAGE_PATH + searchURLImg[j].URL
                );
              }

              for (let index = 0; index < CustomProductResult.length; index++) {
                CustomProductResult[index].images_URL =
                  productIDImageURL[CustomProductResult[index].id];
                product_list.push(CustomProductResult[index]);
              }
            }
            // ------------benz code---------------
            // for (let index = 0; index < all_product_from_sorted_list.length; index++) {
            //     let CustomProductResult = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?)", all_product_from_sorted_list[index])
            //     for (let index = 0; index < CustomProductResult.length; index++) {
            //         URL = []
            //         let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", CustomProductResult[index].id)
            //         if (searchURLImg.length > 0) {
            //             searchURLImg.forEach(element => {
            //                 URL.push(element.URL)
            //             });
            //         }
            //         CustomProductResult[index].URL = URL
            //     }
            //     product_list.push(CustomProductResult[0])
            // }
            // ------------benz code---------------
          }
          for (
            let index = 0;
            index < all_product_from_sorted_list.length;
            index++
          ) {
            for (let s = 0; s < all_product_from_component.length; s++) {
              if (
                all_product_from_component[s].ms_product_id ==
                all_product_from_sorted_list[index]
              ) {
                all_product_from_component.splice(s, 1);
              }
            }
          }

          all_product_from_sorted_list.forEach((element) => {
            search_result_product_list.push(element);
          });

          all_product_from_component.forEach((element) => {
            array_product.push(element.ms_product_id);
            search_result_product_list.push(element.ms_product_id);
          });

          // for sorted product
          if (original_all_product_from_sorted_list.length > 0) {
            array_product_sort_tmp = [];
            if (begin_search_details.what_component == "category_product") {
              var product_in_cate = await query(
                "SELECT ms_product_id FROM ms_product_category WHERE ms_category_id = ?",
                begin_search_details.component_id
              );
              for (let index = 0; index < product_in_cate.length; index++) {
                product_in_cate[index] = product_in_cate[index].ms_product_id;
              }
              for (
                let index = 0;
                index < original_all_product_from_sorted_list.length;
                index++
              ) {
                if (
                  product_in_cate.includes(
                    original_all_product_from_sorted_list[index]
                  )
                ) {
                  array_product_sort_tmp.push(
                    original_all_product_from_sorted_list[index]
                  );
                }
              }
              original_all_product_from_sorted_list = array_product_sort_tmp;
            }

            mySortedList = "";
            //console.log(original_all_product_from_sorted_list)
            for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
              mySortedList += original_all_product_from_sorted_list[i];

              if (i < original_all_product_from_sorted_list.length - 1)
                mySortedList += ",";
            }
            try {
              if (mySortedList != "") {
                ProductResult = await query(
                  "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description,description_en, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,name_en,short_description_en,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id, " +
                    mySortedList +
                    " )",
                  [original_all_product_from_sorted_list]
                );
              } else {
                ProductResult = await query(
                  "SELECT m.id, m.seller_shop_id, m.sku,m.message_status, m.have_attribute, m.product_owner, m.unique_custom_product, m.inventory_code, m.name, m.inventory_ratio, m.stock_count, m.inventory_stock, m.description, m.description_en, m.short_description, m.stock_status, m.weight, m.volumn, m.product_size, m.shipping_rate, m.created_at, m.updated_at,name_en,short_description_en,unit,unit_en FROM `ms_product` m JOIN `ms_product_category` c ON c.ms_product_id = m.id WHERE m.status = 'active' AND c.ms_category_id = ? ORDER BY m.created_at ASC",
                  begin_search_details.component_id
                );
              }
            } catch (error) {
              console.log(error);
            }

            let id_ProductResult = ProductResult.map((value) => value.id);
            if (id_ProductResult.length == 0) {
              id_ProductResult = [0];
            }

            let searchURLImg = await query(
              "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
              [id_ProductResult]
            );

            if (ProductResult.length > 0) {
              productIDImageURL = {};
              for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                  productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                  process.env.IMAGE_PATH + searchURLImg[j].URL
                );
              }

              for (let index = 0; index < ProductResult.length; index++) {
                ProductResult[index].images_URL =
                  productIDImageURL[ProductResult[index].id];
              }
              /*ProductResult.forEach(element => {
                                product_list.push(element)
                            });*/

              for (i = 0; i < ProductResult.length; ++i) {
                product_list.push(ProductResult[i]);
              }
            }
          }

          if (array_product.length > 0) {
            let ProductResult = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, description_en,short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,name_en,short_description_en,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY updated_at ASC",
              [array_product]
            );

            let id_ProductResult = ProductResult.map((value) => value.id);

            if (id_ProductResult.length == 0) {
              id_ProductResult = [0];
            }

            let searchURLImg = await query(
              "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
              [id_ProductResult]
            );

            if (searchURLImg.length > 0 && ProductResult.length > 0) {
              productIDImageURL = {};
              for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                  productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                  process.env.IMAGE_PATH + searchURLImg[j].URL
                );
              }

              for (let index = 0; index < ProductResult.length; index++) {
                ProductResult[index].images_URL =
                  productIDImageURL[ProductResult[index].id];
              }
            }

            // ------------benz code---------------
            // for (let index = 0; index < ProductResult.length; index++) {
            //     URL = []
            //     let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", ProductResult[index].id)
            //     if (searchURLImg.length > 0) {
            //         searchURLImg.forEach(element => {
            //             URL.push(element.URL)
            //         });
            //     }
            //     ProductResult[index].images_URL = URL
            // }
            // ------------benz code---------------
            ProductResult.forEach((element) => {
              product_list.push(element);
            });
          }
          finalResult.query_result = product_list;
        } else {
          finalResult.query_result = [];
        }
      } else {
        //console.log("category_product NOT")
        const searchProductResultSorted = await query(
          "SELECT id FROM `ms_product` WHERE " +
            mysql_seller_shop_id_cmd +
            " id IN (?)",
          [all_product_from_sorted_list]
        );
        if (searchProductResultSorted) {
          all_product_from_sorted_list = searchProductResultSorted;
          finalResult.ok = "y";
          all_product_from_sorted_list.forEach((element) => {
            all_product_from_sorted_list_tmp.push(element.id);
            search_result_product_list.push(element.id);
          });
          all_product_from_sorted_list = all_product_from_sorted_list_tmp;
        }
        if (begin_search_details.what_component == "industry_product") {
          const searchProductResult = await query(
            "SELECT pi.product_id FROM `ms_product_industry` pi LEFT JOIN `ms_product` p ON pi.product_id = p.id WHERE " +
              mysql_p_seller_shop_id_cmd +
              " pi.industry_id = ?",
            begin_search_details.component_id
          );
          if (searchProductResult) {
            all_product_from_component = searchProductResult;
            finalResult.ok = "y";
            for (
              let index = 0;
              index < all_product_from_sorted_list.length;
              index++
            ) {
              for (let s = 0; s < all_product_from_component.length; s++) {
                if (
                  all_product_from_component[s].product_id ==
                  all_product_from_sorted_list[index]
                ) {
                  all_product_from_component.splice(s, 1);
                }
              }
            }
            all_product_from_component.forEach((element) => {
              array_product.push(element.product_id);
              search_result_product_list.push(element.product_id);
            });
          }
        } else if (begin_search_details.what_component == "brand_product") {
          const searchProductResult = await query(
            "SELECT pb.ms_product_id FROM `ms_product_manufacturer` pb LEFT JOIN `ms_product` p ON pb.ms_product_id = p.id WHERE " +
              mysql_p_seller_shop_id_cmd +
              " pb.ms_manufacturer_id = ?",
            begin_search_details.component_id
          );
          if (searchProductResult) {
            all_product_from_component = searchProductResult;
            finalResult.ok = "y";
            for (
              let index = 0;
              index < all_product_from_sorted_list.length;
              index++
            ) {
              for (let s = 0; s < all_product_from_component.length; s++) {
                if (
                  all_product_from_component[s].ms_product_id ==
                  all_product_from_sorted_list[index]
                ) {
                  all_product_from_component.splice(s, 1);
                }
              }
            }
            for (i = 0; i < all_product_from_component.length; ++i) {
              array_product.push(all_product_from_component[i].ms_product_id);
              search_result_product_list.push(
                all_product_from_component[i].ms_product_id
              );
            }
            /*all_product_from_component.forEach(element => {
                            array_product.push(element.ms_product_id)
                            search_result_product_list.push(element.ms_product_id)
                        });*/
            //console.log( all_product_from_component )
            //console.log("brand")
            //console.log(array_product)
            //console.log(search_result_product_list)
          }
        } else if (
          begin_search_details.what_component == "new_product" ||
          begin_search_details.what_component == "recommended_product" ||
          begin_search_details.what_component == "best_seller"
        ) {
          // FOR NEW PRODUCT, RECOMMENDED PRODUCT, BEST SELLER

          const searchProductResult = await query(
            "SELECT id FROM ms_product WHERE 1 " +
              mysql_seller_shop_id_cmd +
              " ORDER BY updated_at DESC"
          );
          if (searchProductResult) {
            all_product_from_component = searchProductResult;
            finalResult.ok = "y";
            for (
              let index = 0;
              index < all_product_from_sorted_list.length;
              index++
            ) {
              for (let s = 0; s < all_product_from_component.length; s++) {
                if (
                  all_product_from_component[s].ms_product_id ==
                  all_product_from_sorted_list[index]
                ) {
                  all_product_from_component.splice(s, 1);
                }
              }
            }

            for (i = 0; i < all_product_from_component.length; ++i) {
              array_product.push(all_product_from_component[i].ms_product_id);
              search_result_product_list.push(
                all_product_from_component[i].ms_product_id
              );
            }
          }
        }

        /*if (all_product_from_sorted_list.length > 0) {
                    let CustomProductResult = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?)", [all_product_from_sorted_list])

                    let id_CustomProductResult = CustomProductResult.map(value => value.id);

                    if (id_CustomProductResult.length == 0){
                        id_CustomProductResult = [0]
                    }

                    let searchURLImg = await query("SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC", [id_CustomProductResult])

                    if (searchURLImg.length > 0 && CustomProductResult.length > 0) {
                        productIDImageURL = {}
                        for (let j = 0; j < searchURLImg.length; ++j) {
                            if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                                productIDImageURL[searchURLImg[j].ms_product_id] = []
                            }
                            productIDImageURL[searchURLImg[j].ms_product_id].push(process.env.IMAGE_PATH + searchURLImg[j].URL)
                        }

                        for (let index = 0; index < CustomProductResult.length; index++) {
                            CustomProductResult[index].images_URL = productIDImageURL[CustomProductResult[index].id]
                            product_list.push(CustomProductResult[index])
                        }
                    }
                    // ------------benz code------------
                    // for (let index = 0; index < all_product_from_sorted_list.length; index++) {
                    //     let CustomProductResult = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?)", all_product_from_sorted_list[index])
                    //     for (let index = 0; index < CustomProductResult.length; index++) {
                    //         URL = []
                    //         let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", CustomProductResult[index].id)
                    //         if (searchURLImg.length > 0) {
                    //             searchURLImg.forEach(element => {
                    //                 URL.push(element.URL)
                    //             });
                    //         }
                    //         CustomProductResult[index].images_URL = URL
                    //     }
                    //     product_list.push(CustomProductResult[0])
                    // }
                    // ------------benz code------------
                //}

                /*			for (i = 0; i < product_list.length ; ++i ){
                console.log("BBB" + product_list[i].id)

                if (i == 10)break;
            }*/
        //console.log("original_all_product_from_sorted_list")
        //console.log(original_all_product_from_sorted_list)
        // for sorted product
        if (original_all_product_from_sorted_list.length > 0) {
          array_product_sort_tmp = [];
          if (begin_search_details.what_component == "industry_product") {
            var product_in_industry = await query(
              "SELECT product_id FROM ms_product_industry WHERE industry_id = ?",
              begin_search_details.component_id
            );
            for (let index = 0; index < product_in_industry.length; index++) {
              product_in_industry[index] =
                product_in_industry[index].product_id;
            }
            for (
              let index = 0;
              index < original_all_product_from_sorted_list.length;
              index++
            ) {
              if (
                product_in_industry.includes(
                  original_all_product_from_sorted_list[index]
                )
              ) {
                array_product_sort_tmp.push(
                  original_all_product_from_sorted_list[index]
                );
              }
            }
            original_all_product_from_sorted_list = array_product_sort_tmp;
          }

          if (begin_search_details.what_component == "brand_product") {
            var product_in_brand = await query(
              "SELECT ms_product_id FROM ms_product_manufacturer WHERE ms_manufacturer_id = ?",
              begin_search_details.component_id
            );
            for (let index = 0; index < product_in_brand.length; index++) {
              product_in_brand[index] = product_in_brand[index].ms_product_id;
            }
            for (
              let index = 0;
              index < original_all_product_from_sorted_list.length;
              index++
            ) {
              if (
                product_in_brand.includes(
                  original_all_product_from_sorted_list[index]
                )
              ) {
                array_product_sort_tmp.push(
                  original_all_product_from_sorted_list[index]
                );
              }
            }
            original_all_product_from_sorted_list = array_product_sort_tmp;
          }

          mySortedList = "";
          //console.log(original_all_product_from_sorted_list)
          for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
            mySortedList += original_all_product_from_sorted_list[i];

            if (i < original_all_product_from_sorted_list.length - 1)
              mySortedList += ",";
          }
          if (
            begin_search_details.what_component == "industry_product" &&
            mySortedList == ""
          ) {
            ProductResult = await query(
              "SELECT m.id, m.seller_shop_id, m.sku,m.message_status, m.have_attribute, m.product_owner, m.unique_custom_product, m.inventory_code, m.name, m.inventory_ratio, m.stock_count, m.inventory_stock, m.description, m.description_en, m.short_description, m.stock_status, m.weight, m.volumn, m.product_size, m.shipping_rate, m.created_at, m.updated_at,m.name_en,m.short_description_en,m.unit,m.unit_en FROM `ms_product` m JOIN `ms_product_industry` i ON i.product_id = m.id WHERE m.status = 'active' AND i.industry_id = ? ORDER BY m.created_at ASC",
              begin_search_details.component_id
            );
          } else if (
            begin_search_details.what_component == "brand_product" &&
            mySortedList == ""
          ) {
            ProductResult = await query(
              "SELECT m.id, m.seller_shop_id, m.sku,m.message_status, m.have_attribute, m.product_owner, m.unique_custom_product, m.inventory_code, m.name, m.inventory_ratio, m.stock_count, m.inventory_stock, m.description, m.description_en, m.short_description, m.stock_status, m.weight, m.volumn, m.product_size, m.shipping_rate, m.created_at, m.updated_at,m.name_en,m.short_description_en,m.unit,m.unit_en FROM `ms_product` m JOIN `ms_product_manufacturer` b ON b.ms_product_id = m.id WHERE m.status = 'active' AND b.ms_manufacturer_id = ? ORDER BY m.created_at ASC",
              begin_search_details.component_id
            );
          } else {
            ProductResult = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description,description_en, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,name_en,short_description_en,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id, " +
                mySortedList +
                " )",
              [original_all_product_from_sorted_list]
            );
          }
          // ProductResult.forEach(element => {
          //     console.log(element.id);
          // });
          let id_ProductResult = ProductResult.map((value) => value.id);

          if (id_ProductResult.length == 0) id_ProductResult = [0];
          let searchURLImg = await query(
            "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
            [id_ProductResult]
          );

          if (ProductResult.length > 0) {
            productIDImageURL = {};
            for (let j = 0; j < searchURLImg.length; ++j) {
              if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                productIDImageURL[searchURLImg[j].ms_product_id] = [];
              }
              productIDImageURL[searchURLImg[j].ms_product_id].push(
                process.env.IMAGE_PATH + searchURLImg[j].URL
              );
            }

            for (let index = 0; index < ProductResult.length; index++) {
              ProductResult[index].images_URL =
                productIDImageURL[ProductResult[index].id];
            }
            /*ProductResult.forEach(element => {
                            product_list.push(element)
                        });*/

            for (i = 0; i < ProductResult.length; ++i) {
              product_list.push(ProductResult[i]);
            }
          }
        }

        /*for (i = 0 ; i < product_list.length ; ++i ){
                    console.log("IDID")
                    console.log( product_list[i].id )

                }*/

        new_search_result_product_list = [];
        dict_nogoin = {};
        for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
          new_search_result_product_list.push(
            original_all_product_from_sorted_list[i]
          );
          dict_nogoin[original_all_product_from_sorted_list[i]] = 0;
        }
        // console.log("dict_nogoin : ")
        if (begin_search_details.what_component === 'brand_product'){
          var getProductBrand = await query(`SELECT ms_product.id FROM ms_product JOIN ms_product_manufacturer ON ms_product_manufacturer.ms_product_id = ms_product.id WHERE ms_product_manufacturer.ms_manufacturer_id = ? AND ms_product.status = 'active'`,begin_search_details.component_id)
          original_all_product_from_sorted_list = []
          for (i=0;i<getProductBrand.length;i++){
            original_all_product_from_sorted_list.push(getProductBrand[i].id)
          }

        }
        for (i = 0; i < search_result_product_list.length; ++i) {
          if (
            !(search_result_product_list[i] in dict_nogoin) &&
            original_all_product_from_sorted_list.includes(
              search_result_product_list[i]
            )
          ) {
            //console.log("IN")
            //console.log( search_result_product_list[i])
            new_search_result_product_list.push(search_result_product_list[i]);
          } else {
            //console.log("OUT")
            //console.log( search_result_product_list[i])
          }
        }
        // console.log("new_search_result_product_list")
        // console.log( new_search_result_product_list )

        search_result_product_list = new_search_result_product_list;
        // for remaining products.
        if (search_result_product_list.length > 0) {
          const ProductResult = await query(
            "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description,description_en, short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at, unit, unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY updated_at ASC",
            [search_result_product_list]
          );
            // console.log(ProductResult)
          let id_ProductResult = ProductResult.map((value) => value.id);

          if (id_ProductResult.length == 0) {
            id_ProductResult = [0];
          }
          let searchURLImg = await query(
            "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
            [id_ProductResult]
          );

          if (ProductResult.length > 0) {
            productIDImageURL = {};
            for (let j = 0; j < searchURLImg.length; ++j) {
              if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                productIDImageURL[searchURLImg[j].ms_product_id] = [];
              }
              productIDImageURL[searchURLImg[j].ms_product_id].push(
                process.env.IMAGE_PATH + searchURLImg[j].URL
              );
            }

            for (let index = 0; index < ProductResult.length; index++) {
              ProductResult[index].images_URL =
                productIDImageURL[ProductResult[index].id];
            }
            /*ProductResult.forEach(element => {
                            product_list.push(element)
                        });*/
            for (i = 0; i < ProductResult.length; ++i) {
              product_list.push(ProductResult[i]);
            }
          }
          // for (let index = 0; index < ProductResult.length; index++) {
          //     URL = []
          //     let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", ProductResult[index].id)
          //     if (searchURLImg.length > 0) {
          //         searchURLImg.forEach(element => {
          //             URL.push(element.URL)
          //         });
          //     }
          //     ProductResult[index].images_URL = URL
          // }
          // ProductResult.forEach(element => {
          //     product_list.push(element)
          // });
        }
        // console.log('product_list')
        // console.log(product_list)
        finalResult.query_result = product_list;
      }

      /*for (i = 0; i < product_list.length ; ++i ){
                console.log(product_list[i].id)

                //if (i == 10)break;
            }*/
    } else {
      let logjson = {
        name: logfile,
        parameter: {
          begin_search_type: begin_search_type,
          begin_search_details: begin_search_details,
          extra_filters: extra_filters,
          search_category_from_result: search_category_from_result,
          search_industry_from_result: search_industry_from_result,
          search_brand_from_result: search_brand_from_result,
        },
        status: 400,
        return_data: "",
        message: "begin_search_type invalid.",
        execution_time: Date.now() - timeTaken,
      };
      err = {
        message: "begin_search_type invalid.",
      };
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result(err, null);
      return;
    }
    //console.log("extra_filters")
    if (extra_filters) {
      category_filter_hierachy = [];
      filter_category = [];
      result_category = [];
      filter_industry = [];
      result_industry = [];
      filter_brand = [];
      result_brand = [];
      var copy_finalResult = finalResult.query_result;

      for (let index = 0; index < extra_filters.length; index++) {
        let xx = []
        if (extra_filters[index].filter == "category") {
          if (extra_filters[index].filter_value != "") {
            const UPS_category_hierachy = await query(
              "SELECT id, hierachy from ms_category WHERE " +
                mysql_seller_shop_id_cmd +
                " id IN (?)",
              [extra_filters[index].filter_value]
            );
            for (let index = 0; index < UPS_category_hierachy.length; index++) {
              let searchHierachy = UPS_category_hierachy[
                index
              ].hierachy.replace(/_/g, "\\_");
              const UPS_category_sub_hierachy = await query(
                "SELECT id, hierachy from ms_category WHERE hierachy LIKE ?",
                `%${searchHierachy}%`
              );
              category_filter_hierachy.push(UPS_category_sub_hierachy[0]);
            }
            for (
              let index = 0;
              index < category_filter_hierachy.length;
              index++
            ) {
              const result_filter_category = await query(
                "SELECT ms_product_id from ms_product_category WHERE ms_category_id IN (?)",
                category_filter_hierachy[index].id
              );
              result_filter_category.forEach((element) => {
                filter_category.push(element);
              });
            }
            for (
              let index = 0;
              index < finalResult.query_result.length;
              index++
            ) {
              for (let s = 0; s < filter_category.length; s++) {
                if (
                  finalResult.query_result[index].id ==
                  filter_category[s].ms_product_id
                ) {
                  result_category.push(finalResult.query_result[index]);
                  search_result_product_list_tmp.push(
                    filter_category[s].ms_product_id
                  );
                  search_result_product_list_industry_tmp.push(
                    filter_category[s].ms_product_id
                  );
                  search_result_product_list_brand_tmp.push(
                    filter_category[s].ms_product_id
                  );
                }
              }
            }
            finalResult.query_result = result_category;
          }
        } else if (extra_filters[index].filter == "industry") {
          if (extra_filters[index].filter_value != "") {
            const filter_product_industry = await query(
              "SELECT pi.product_id FROM ms_product_industry pi LEFT JOIN `ms_industry` i ON pi.industry_id = i.id WHERE " +
                mysql_i_seller_shop_id_cmd +
                " pi.industry_id IN (?)",
              [extra_filters[index].filter_value]
            );
            filter_industry = filter_product_industry;
            for (
              let index = 0;
              index < finalResult.query_result.length;
              index++
            ) {
              for (let s = 0; s < filter_industry.length; s++) {
                if (
                  finalResult.query_result[index].id ==
                  filter_industry[s].product_id
                ) {
                  result_industry.push(finalResult.query_result[index]);
                  search_result_product_list_tmp.push(
                    filter_industry[s].product_id
                  );
                  search_result_product_list_industry_tmp.push(
                    filter_industry[s].product_id
                  );
                  search_result_product_list_brand_tmp.push(
                    filter_industry[s].product_id
                  );
                }
              }
            }
            finalResult.query_result = result_industry;
          }
        } else if (extra_filters[index].filter == "brand") {
          if (extra_filters[index].filter_value != "") {
            const filter_product_brand = await query(
              "SELECT pb.ms_product_id FROM ms_product_manufacturer pb LEFT JOIN ms_manufacturer b ON b.id = pb.ms_manufacturer_id WHERE " +
                mysql_b_seller_shop_id_cmd +
                " pb.ms_manufacturer_id IN (?)",
              [extra_filters[index].filter_value]
            );
            filter_brand = filter_product_brand;
            for (
              let index = 0;
              index < finalResult.query_result.length;
              index++
            ) {
              for (let s = 0; s < filter_brand.length; s++) {
                if (
                  finalResult.query_result[index].id ==
                  filter_brand[s].ms_product_id
                ) {
                  result_brand.push(finalResult.query_result[index]);
                  search_result_product_list_tmp.push(
                    filter_brand[s].ms_product_id
                  );
                  search_result_product_list_industry_tmp.push(
                    filter_brand[s].ms_product_id
                  );
                  search_result_product_list_brand_tmp.push(
                    filter_brand[s].ms_product_id
                  );
                }
              }
            }
            finalResult.query_result = result_brand;
          }
          // ----------------- New code ----------------- //
          if (begin_search_details.what_component == "category_product") {
            let finalResultIDList_category_product = [];
            for (let i = 0; i < copy_finalResult.length; ++i) {
              finalResultIDList_category_product.push(copy_finalResult[i].id);
            }
            if (finalResultIDList_category_product.length == 0) {
              finalResultIDList_category_product.push(0);
            }
            // let filter_product_by_category = await query(`SELECT * FROM tb_custom_rule_product_sorted_list WHERE custom_user_ID =${begin_search_details.custom_user_ID}  and what_component = 'category_product' and component_ID = ${begin_search_details.component_id}`)
            // product_custom_by_ct = JSON.parse(filter_product_by_category[0].product_array)
            // let result_allBrand = await query("SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)", [product_custom_by_ct])
            let result_allBrand_category = await query(
              "SELECT DISTINCT mm.id as brand_id ,manufacturer_name,manufacturer_name_en from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
              [finalResultIDList_category_product]
            );
            // finalResult.query_all_brand = result_allBrand
            finalResult.query_all_brand = result_allBrand_category;
          }
          //----------------- New code ----------------- //
          //----------------- New code ----------------- //
          if (begin_search_details.what_component == "industry_product") {
            let finalResultIDListIndustry = [];
            for (let i = 0; i < copy_finalResult.length; ++i) {
              finalResultIDListIndustry.push(copy_finalResult[i].id);
            }
            if (finalResultIDListIndustry.length == 0) {
              finalResultIDListIndustry.push(0);
            }
            let result_allBrand_Industry = await query(
              "SELECT DISTINCT mm.id as brand_id ,manufacturer_name,manufacturer_name_en from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
              [finalResultIDListIndustry]
            );
            finalResult.query_all_brand = result_allBrand_Industry;
          }
          //----------------- New code ----------------- //
        }
      }
    //   if (extra_filters[0].filter == "brand") {
    //     if (extra_filters[0].filter_value == "") {
    //       if (begin_search_details.what_component == "category_product") {
    //       let check_filter_value_category = [];
    //       for (let i = 0; i < result_category.length; ++i) {
    //         check_filter_value_category.push(result_category[i].id);
    //       }
    //       if (check_filter_value_category.length == 0) {
    //         check_filter_value_category.push(0);
    //       }
    //       let category_result_noFilter_value = await query(
    //         "SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
    //         [check_filter_value_category]
    //       );
    //       finalResult.query_all_brand = category_result_noFilter_value;
    //       // console.log(check_filter_value_category)
    //     }
    //     if (begin_search_details.what_component == "industry_product") {
    //       let check_filter_value_industry = [];
    //       for (let i = 0; i < result_category.length; ++i) {
    //         check_filter_value_industry.push(result_category[i].id);
    //       }
    //       if (check_filter_value_industry.length == 0) {
    //         check_filter_value_industry.push(0);
    //       }
    //       console.log(check_filter_value_industry)
    //       let industry_result_noFilter_value = await query(
    //         "SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
    //         [check_filter_value_industry]
    //       );
    //       finalResult.query_all_brand = industry_result_noFilter_value;
    //     }
    //   }
    // }
    }
    prod_array_list_for_search_further = [];
    for (i = 0; i < product_list.length; ++i) {
      prod_array_list_for_search_further.push(product_list[i].id);
    }
    //console.log()
    if (prod_array_list_for_search_further.length == 0) {
      prod_array_list_for_search_further = [0];
    }
    //console.log(prod_array_list_for_search_further)
    if (begin_search_type != "search_bar") {
      //console.log("NOT search bar")
      // Khon Kaen code
      if (search_category_from_result) {
        // let category_result = []
        // if (search_result_product_list_tmp.length > 0) {
        //     //console.log("!")
        //     searchCate = search_result_product_list_tmp
        // } else {
        //     //console.log("E")
        //     searchCate = search_result_product_list
        // }

        // if (searchCate.length == 0)
        //     searchCate.push(0)
        // console.log(searchCate);

        let finalResultIDList = [];
        for (let i = 0; i < finalResult["query_result"].length; ++i) {
          finalResultIDList.push(finalResult["query_result"][i].id);
        }
        if (finalResultIDList.length == 0) {
          finalResultIDList.push(0);
        }
        // console.log(finalResult["query_result"],'2322')
        const result_categoryID = await query(
          "SELECT DISTINCT mc.id as category_id ,category_name,category_name_en from ms_category mc LEFT JOIN ms_product_category mpc ON mc.id = mpc.ms_category_id WHERE mpc.ms_product_id IN (?) AND mc.hierachy NOT LIKE '%\\_%' ",
          [finalResultIDList]
        );
        finalResult.query_result_category = result_categoryID;
        // --------------old code-------------
        // const result_categoryID = await query("SELECT DISTINCT ms_category_id from `ms_product_category` WHERE ms_product_id IN (?)", [searchCate])
        // if (result_categoryID.length > 0) {
        //     for (let index = 0; index < result_categoryID.length; index++) {
        //         let result_categoryName = await query("SELECT id as category_id ,category_name from `ms_category` WHERE id = (?)", result_categoryID[index].ms_category_id)
        //         category_result.push(result_categoryName[0])
        //     }
        //     finalResult.query_result_category = category_result
        // }
        // --------------old code-------------
      }
      if (search_industry_from_result) {
        let industry_result = [];
        // console.log(search_result_product_list_industry_tmp.length,'2342');
        if (search_result_product_list_industry_tmp.length > 0) {
          searchIndustry = search_result_product_list_industry_tmp;
        } else {
          searchIndustry = search_result_product_list;
        }

        if (searchIndustry.length == 0) searchIndustry.push(0);

        const result_industryID = await query(
          "SELECT DISTINCT mi.id as industry_id ,industry_name_th,industry_name_en from ms_industry mi LEFT JOIN ms_product_industry mpi ON mi.id = mpi.industry_id WHERE mpi.product_id IN (?)",
          [searchIndustry]
        );
        finalResult.query_result_industry = result_industryID;

        // --------------old code-------------
        // const result_industryID = await query("SELECT DISTINCT industry_id from `ms_product_industry` WHERE product_id IN (?)", [searchIndustry])
        // if (result_industryID.length > 0) {
        //     for (let index = 0; index < result_industryID.length; index++) {
        //         let result_industryName = await query("SELECT id as industry_id ,industry_name_th from `ms_industry` WHERE id = (?)", result_industryID[index].industry_id)
        //         industry_result.push(result_industryName[0])
        //     }
        //     finalResult.query_result_industry = industry_result
        // }
        // --------------old code-------------
      }
      if (search_brand_from_result) {
        // if (search_result_product_list_brand_tmp.length > 0) {
        //     searchBrand = search_result_product_list_brand_tmp
        // } else {
        //     searchBrand = search_result_product_list
        // }

        // if (searchBrand.length == 0)
        //     searchBrand.push(0)
        // console.log(p1)

        let finalResultIDList = [];
        for (let i = 0; i < finalResult["query_result"].length; ++i) {
          finalResultIDList.push(finalResult["query_result"][i].id);
        }
        if (finalResultIDList.length == 0) {
          finalResultIDList.push(0);
        }

        const result_brandID = await query(
          "SELECT DISTINCT mm.id as brand_id ,manufacturer_name,manufacturer_name_en from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
          [finalResultIDList]
        );
        finalResult.query_result_brand = result_brandID;

        // --------------old code-------------
        // const result_brandID = await query("SELECT DISTINCT ms_manufacturer_id from `ms_product_manufacturer` WHERE ms_product_id IN (?)", [searchBrand])
        // if (result_brandID.length > 0) {
        //     for (let index = 0; index < result_brandID.length; index++) {
        //         let result_brandName = await query("SELECT id as brand_id ,manufacturer_name from `ms_manufacturer` WHERE id = (?)", result_brandID[index].ms_manufacturer_id)
        //         brand_result.push(result_brandName[0])
        //     }
        //     finalResult.query_result_brand = brand_result
        // }
        // --------------old code-------------
      }
    } else {
      //Jack code
      if (
        search_category_from_result ||
        search_industry_from_result ||
        search_brand_from_result
      ) {
        //finalResultParsed = JSON.parse(JSON.stringify( finalResult ))

        //console.log( finalResult )

        // create array of ID first.
        let finalResultIDList = [];
        for (let i = 0; i < finalResult["query_result"].length; ++i) {
          finalResultIDList.push(finalResult["query_result"][i].id);
        }
        if (finalResultIDList.length == 0) {
          finalResultIDList.push(0);
        }

        if (search_category_from_result) {
          finalResult.query_result_category = await query(
            "SELECT DISTINCT pc.ms_category_id, c.category_name,c.category_name_en, c.category_logo_path from `ms_product_category` pc LEFT JOIN `ms_category` c ON c.id = pc.ms_category_id WHERE pc.ms_product_id IN (?);",
            [finalResultIDList]
          );
        }

        if (search_industry_from_result) {
          finalResult.query_result_industry = await query(
            "SELECT DISTINCT pi.industry_id, i.industry_name_th,i.industry_name_en, i.industry_logo from `ms_product_industry` pi LEFT JOIN `ms_industry` i ON i.id = pi.industry_id WHERE pi.product_id IN (?);",
            [finalResultIDList]
          );
        }

        if (search_brand_from_result) {
          finalResult.query_result_brand = await query(
            "SELECT DISTINCT pb.ms_manufacturer_id, b.manufacturer_name,b.manufacturer_name_en, b.logo_path from `ms_product_manufacturer` pb LEFT JOIN `ms_manufacturer` b ON b.id = pb.ms_manufacturer_id WHERE pb.ms_product_id IN (?);",
            [finalResultIDList]
          );
        }
      }
    }

    let finalId = [];
    let finalSellerShopId = [];

    finalResult.query_result.forEach((r) => {
      finalId.push(r.id);
      finalSellerShopId.push(r.seller_shop_id);
      if (!r.images_URL) r.images_URL = [];
      if (!r.promotion_id) r.promotion_id = [];
    });

    // ใส่รายละเอียดต่างๆลงไปใน query_result Promotion ราคา order
    if (finalResult.query_result.length != 0) {
      // เรียงตาม tb_custom_rules
      let cIndex =
        begin_search_details.custom_user_ID +
        "+" +
        begin_search_details.what_component +
        "+" +
        begin_search_details.component_id;
      const prodArray = await query(
        "SELECT product_array FROM `tb_custom_rule_product_sorted_list` WHERE composite_index = ?",
        cIndex
      );
      let prod_array_to_sort = [];
      if (prodArray && prodArray.length != 0) {
        prod_array_to_sort = JSON.parse(prodArray[0].product_array);
      }
      customSort({
        data: finalResult.query_result,
        sortBy: prod_array_to_sort,
        sortField: "id",
      });
      // เรียงตาม tb_custom_rules

      if (finalId.length == 0) finalId = [0];

      // ใส่ค่า favorite ให้ทุก product
      let userForFav = await isLoginAndGetUser(token);
      let favProductByUser = await findFavByUser(userForFav.user_id, finalId);
      finalResult.query_result.forEach((pd) => {
        if (favProductByUser.includes(pd.id)) {
          pd.isFavorite = true;
        } else {
          pd.isFavorite = false;
        }
      });
      // ใส่ค่า favorite ให้ทุก product

      // ใส่ Promotion ให้ทุก product
      let productIDPromotionId = {};
      let productIDPromotionIdAndHidden = {};
      //console.log(finalId)
      let searchPromotion = await query(
        "SELECT pp.product_id, pp.promotion_id, p.hidden_type FROM ms_product_promotion pp LEFT JOIN ms_promotion p ON p.id = pp.promotion_id WHERE pp.product_id IN (?)",
        [finalId]
      );
      if (searchPromotion.length > 0 && finalResult.query_result.length > 0) {
        for (let j = 0; j < searchPromotion.length; ++j) {
          if (!(searchPromotion[j].product_id in productIDPromotionId)) {
            productIDPromotionId[searchPromotion[j].product_id] = [];
            productIDPromotionIdAndHidden[searchPromotion[j].product_id] = [];
          }
          productIDPromotionId[searchPromotion[j].product_id].push(
            searchPromotion[j].promotion_id
          );
          productIDPromotionIdAndHidden[searchPromotion[j].product_id].push({
            promotion_id: searchPromotion[j].promotion_id,
            hidden_type: searchPromotion[j].hidden_type,
          });
        }

        for (let index = 0; index < finalResult.query_result.length; index++) {
          finalResult.query_result[index].promotion_id =
            productIDPromotionId[finalResult.query_result[index].id];
          finalResult.query_result[index].promotion_id_with_hidden_type =
            productIDPromotionIdAndHidden[finalResult.query_result[index].id];
        }
      }

      for (let index = 0; index < finalResult.query_result.length; index++) {
        let id = finalResult.query_result[index].id;
        if (begin_search_details.what_component == "category_prroduct") {
          category = await query(
            "SELECT p.ms_product_id, p.ms_category_id, c.category_name,c.category_name_en FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id = ? AND p.ms_category_id = ?",
            [id, begin_search_details.component_id]
          );
        } else {
          category = await query(
            "SELECT p.ms_product_id, p.ms_category_id, c.category_name,c.category_name_en FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id = ?",
            id
          );
        }
        finalResult.query_result[index].category_name =
          category[0]?.category_name;
          finalResult.query_result[index].category_name_en =
          category[0]?.category_name_en;
        let brand = await query(
          "SELECT p.ms_product_id, p.ms_manufacturer_id, m.manufacturer_name,m.manufacturer_name_en FROM `ms_product_manufacturer` p JOIN `ms_manufacturer` m ON p.ms_manufacturer_id = m.id WHERE p.ms_product_id = ?",
          id
        );
        finalResult.query_result[index].brand_name = brand[0]?.manufacturer_name;
        finalResult.query_result[index].brand_name_en = brand[0]?.manufacturer_name_en;
        let star = await query(
          "SELECT total_rating FROM tb_product_rating_average WHERE product_id = ?",
          id
        );
        if (star.length == 1) {
          finalResult.query_result[index].stars = star[0].total_rating;
        } else if (star.length < 1) {
          finalResult.query_result[index].stars = 0;
        }
      }

      // เพิ่มราคาเข้าไปใน product_list
      let user = await isLoginAndGetUser(token);
      let priceByTier = await findProductPriceByUser(
        user.user_id,
        finalId,
        role_user,
        finalSellerShopId
      );
      let productIDPriceId = {};
      for (let j = 0; j < priceByTier.length; ++j) {
        if (!(priceByTier[j].product_id in productIDPriceId)) {
          productIDPriceId[priceByTier[j].product_id] = [];
        }
        productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
      }

      for (let index = 0; index < finalResult.query_result.length; index++) {
        if (!finalResult.query_result[index].message_status) {
          finalResult.query_result[index].message_status = "no_status";
        }
        try {
          finalResult.query_result[index].real_price =
            productIDPriceId[finalResult.query_result[index].id][0].real_price;
          finalResult.query_result[index].fake_price =
            productIDPriceId[finalResult.query_result[index].id][0].fake_price;
          finalResult.query_result[index].special_price =
            productIDPriceId[finalResult.query_result[index].id][0].special_price;
          finalResult.query_result[index].discount_percent =
            productIDPriceId[finalResult.query_result[index].id][0].discount_percent;
        } catch (e) {
          //console.log(e)
        }
      }
      // เพิ่มราคาเข้าไปใน product_list

      // kill all duplicates here.
      dup_cleaner_dict = {};
      for (i = 0; i < finalResult.query_result.length; ++i) {
        if (!(finalResult.query_result[i].id in dup_cleaner_dict)) {
          dup_cleaner_dict[finalResult.query_result[i].id] = 0;
          dup_cleaner_final_list.push(finalResult.query_result[i]);
        }
      }

      finalResult.query_result = dup_cleaner_final_list;

      // Order_by_price การเรียงสินค้า หรือ sku มากไปน้อย น้อยไปมาก
      if (order_by_price && order_by_price.toUpperCase() == "DESC") {
        finalResult.query_result.sort(function (a, b) {
          var A = a.real_price;
          var B = b.real_price;
          if (A > B) {
            return -1;
          }
          if (A < B) {
            return 1;
          }
          // price must be equal
          return 0;
        });
      } else if (order_by_price && order_by_price.toUpperCase() == "ASC") {
        finalResult.query_result.sort(function (a, b) {
          var A = a.real_price;
          var B = b.real_price;
          if (A < B) {
            return -1;
          }
          if (A > B) {
            return 1;
          }
          // price must be equal
          return 0;
        });
      } else if (order_by_sku && order_by_sku.toUpperCase() == "DESC") {
        // มากไปน้อย
        finalResult.query_result.sort((a, b) => b.sku.toLowerCase().localeCompare(a.sku.toLowerCase()))
      } else if (order_by_sku && order_by_sku.toUpperCase() == "ASC") {
          // น้อยไปมาก
          finalResult.query_result.sort((a, b) => a.sku.toLowerCase().localeCompare(b.sku.toLowerCase()))
      }
      // Order_by_price การเรียงสินค้า  หรือ sku มากไปน้อย น้อยไปมาก
    }

    // ใส่รายละเอียดต่างๆลงไปใน query_result Promotion ราคา order

    timeTaken = Date.now() - timeTaken;
    let logjson = {
      name: logfile,
      parameter: {
        begin_search_type: begin_search_type,
        begin_search_details: begin_search_details,
        extra_filters: extra_filters,
        search_category_from_result: search_category_from_result,
        search_industry_from_result: search_industry_from_result,
        search_brand_from_result: search_brand_from_result,
      },
      status: 200,
      return_data: finalId,
      execution_time: timeTaken,
    };
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(null, finalResult);
    return;
  } catch (err) {
    let finalId = [];
    if (finalResult && finalResult.query_result)
      finalResult.query_result.forEach((r) => finalId.push(r.id));
    let logjson = {
      name: logfile,
      parameter: {
        begin_search_type: begin_search_type,
        begin_search_details: begin_search_details,
        extra_filters: extra_filters,
        search_category_from_result: search_category_from_result,
        search_industry_from_result: search_industry_from_result,
        search_brand_from_result: search_brand_from_result,
      },
      status: 500,
      message: err.name + ": " + err.message,
      return_data: finalId,
      execution_time: Date.now() - timeTaken,
    };

    if (typeof err === "object" && err.stack) {
      logjson.errstack = err.stack;
    } else {
      logjson.errstack = "";
    }

    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(err, null);
    return;
    //return response(500,false,null,"server error")
  }
};

Product.getAllProductName = (result) => {
  let timeTaken = Date.now();
  let logfile = "getAll_Product_Name.log";
  let logjson = {
    name: logfile,
    parameter: "",
  };
  sql.query("SELECT id,name,name_en FROM ms_product", (err, res) => {
    if (err) {
      logjson.status = 500;
      logjson.return_data = "";
      logjson.execution_time = Date.now() - timeTaken;
      logjson.message = err.name + ": " + err.message;
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      console.log("error: ", err);
      result(err, null);
      return;
    }
    logjson.status = 200;
    logjson.return_data = res;
    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    // console.log("product: ", res);
    result(null, res);
    return;
  });
};

Product.getCustomRuleAllProductList = async (
  custom_user_ID,
  what_component,
  component_ID,
  extra_query_rule,
  token,
  role_user,
  result
) => {
  let composite_index =
    custom_user_ID + "+" + what_component + "+" + component_ID;
  let timeTaken = Date.now();
  let logfile = "get_custom_rule_ll_productFunc.log";
  let dup_cleaner_final_list = [];
  let logjson = {
    name: logfile,
    parameter: {
      custom_user_ID: custom_user_ID,
      what_component: what_component,
      component_ID: component_ID,
      extra_query_rule: extra_query_rule,
    },
  };
  let URL = [];
  let product_list = [];
  let sub_product_list = [];
  let sub_product_list_array = [];
  try {
    if (
      typeof (custom_user_ID == "number" || typeof custom_user_ID == "int") &&
      (what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product" ||
        what_component == "promotion")
    ) {
      if (
        what_component == "category_product" ||
        what_component == "industry_product" ||
        what_component == "brand_product" ||
        what_component == "promotion"
      ) {
        if (component_ID && parseInt(component_ID)) {
          if (what_component == "category_product") {
            let finalRes = { ok: "", product_array: [], sub_product_array: [] };
            // const queryResult = await query("SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?", composite_index)
            let array_for_query_prod = [0];
            const querySorted = await query(
              "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
              composite_index
            );
            if (querySorted.length != 0) {
              array_for_query_prod = JSON.parse(querySorted[0].product_array);
            }
            const queryResultUnsorted = await query(
              "SELECT ms_product_id as product_id FROM ms_product_category WHERE ms_category_id = ?",
              component_ID
            );
            const queryResult = await query(
              "SELECT id as product_id FROM ms_product WHERE id IN (?) AND status != 'inactive'",
              [array_for_query_prod]
            );

            queryResultUnsorted.forEach((p) => {
              queryResult.push(p);
            });
            // console.log(queryResult)

            // if (queryResult.length == 0) {
            //     finalRes.ok = "y"
            //     finalRes.message = "custom rule not exist"
            //     logjson.status = 200
            //     logjson.return_data = ""
            //     logjson.message = "custom rule not exist"
            //     logjson.execution_time = Date.now() - timeTaken
            //     logjson = JSON.stringify(logjson)
            //     ShF_log_to_file(logfile, logjson)
            //     result(null, finalRes);
            //     return
            // }

            let componentId = component_ID;
            let allProductIdSub = [];
            let all_product_id_from_component = [];
            let sub_product_array = [];
            // console.log(allProducts)

            const hierachy = await query(
              "SELECT hierachy FROM ms_category  WHERE id = ?",
              componentId
            );
            const allSubProduct = await query(
              "SELECT id FROM ms_category  WHERE hierachy LIKE ?",
              `%${hierachy[0].hierachy}%`
            );
            allSubProduct.forEach((s) => {
              allProductIdSub.push(s.id);
            });

            // allSubProduct.forEach(c => {
            //     all_product_id_from_component.push(composite_index.split('+')[0] + '+' + composite_index.split('+')[1] + '+' + c.id)
            // })
            if (allProductIdSub.length > 0) {
              if (allProductIdSub.length > 0) {
                // const sub_product_query = await query("SELECT * FROM `tb_custom_rule_product_sorted_list` WHERE composite_index IN (?)", [all_product_id_from_component])
                const sub_product_query = await query(
                  "SELECT ms_product_id as product_id FROM ms_product_category WHERE ms_category_id IN (?)",
                  [allProductIdSub]
                );
                sub_product_query.forEach((s) => {
                  sub_product_array.push(s.product_id);
                });
              } else {
                sub_product_array = [];
              }
            } else {
              let finalRes = {
                ok: "y",
                product_array: [],
                sub_product_array: [],
              };

              logjson.status = 200;
              logjson.return_data = finalRes;
              logjson.execution_time = Date.now() - timeTaken;
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result(null, finalRes);
              return;
            }
            finalRes.ok = "y";
            finalRes.product_array = [];
            for (let index = 0; index < queryResult.length; index++) {
              finalRes.product_array.push(
                JSON.parse(queryResult[index].product_id)
              );
            }
            // finalRes.product_array = JSON.parse(queryResult[0].product_array) || []
            if (sub_product_array.length < 1) {
              finalRes.sub_product_array = [];
            } else {
              // sub_product_array.forEach(element => {
              //     finalRes.sub_product_array.push(JSON.parse(element))
              // });
              finalRes.sub_product_array = sub_product_array;
            }

            if (finalRes.product_array.length > 0) {
              let query_product_list = await query(
                "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en, short_description,short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status != 'inactive' ORDER BY updated_at DESC",
                [finalRes.product_array]
              );
              product_list = query_product_list;
              console.log("product_list",product_list)
              customSort({
                data: product_list,
                sortBy: finalRes.product_array,
                sortField: "id",
              });
              // console.log(product_list)

              let id_query_product_list = query_product_list.map(
                (value) => value.id
              );
              // console.log(id_query_product_list)

              if (id_query_product_list.length == 0) {
                id_query_product_list = [0];
              }

              let searchURLImg = await query(
                "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND media_type = 'image' ORDER BY `index` ASC",
                [id_query_product_list]
              );

              // console.log(searchURLImg)
              if (searchURLImg.length > 0 && product_list.length > 0) {
                let productIDImageURL = {};
                for (let j = 0; j < searchURLImg.length; ++j) {
                  if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                    productIDImageURL[searchURLImg[j].ms_product_id] = [];
                  }
                  productIDImageURL[searchURLImg[j].ms_product_id].push(
                    process.env.IMAGE_PATH + searchURLImg[j].URL
                  );
                }

                for (let index = 0; index < product_list.length; index++) {
                  product_list[index].images_URL =
                    productIDImageURL[product_list[index].id];
                }
              }
              //for (let j = 0; j < searchURLImg.length; ++j) {
              //  if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
              //    productIDImageURL[searchURLImg[j].ms_product_id] = [];
              //  }
              //  productIDImageURL[searchURLImg[j].ms_product_id].push(
              //    process.env.IMAGE_PATH + searchURLImg[j].URL
              //  );
              //}

              let searchPromotion = await query(
                "SELECT product_id,promotion_id FROM ms_product_promotion WHERE product_id  IN (?)",
                [id_query_product_list]
              );
              if (searchPromotion.length > 0 && product_list.length > 0) {
                let productIDPromotionId = {};
                for (let j = 0; j < searchPromotion.length; ++j) {
                  if (
                    !(searchPromotion[j].product_id in productIDPromotionId)
                  ) {
                    productIDPromotionId[searchPromotion[j].product_id] = [];
                  }
                  productIDPromotionId[searchPromotion[j].product_id].push(
                    searchPromotion[j].promotion_id
                  );
                }

                for (let index = 0; index < product_list.length; index++) {
                  product_list[index].promotion_id =
                    productIDPromotionId[product_list[index].id];
                }
              }

              for (let index = 0; index < product_list.length; index++) {
                if (!product_list[index].images_URL) {
                  product_list[index].images_URL = [];
                }
                if (!product_list[index].promotion_id) {
                  product_list[index].promotion_id = null;
                }
                if (!product_list[index].short_description) {
                  product_list[index].short_description = null;
                }
                if (!product_list[index].short_description_en) {
                  product_list[index].short_description_en = null;
                }
                if (!product_list[index].message_status) {
                  product_list[index].message_status = "no status";
                }
                if (!product_list[index].real_price) {
                  product_list[index].real_price = null;
                }
                if (!product_list[index].discount_percent) {
                  product_list[index].discount_percent = null;
                }
              }
              // --------------old code-------------
              // for (let index = 0; index < finalRes.product_array.length; index++) {
              //     let query_product_list = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC", finalRes.product_array[index])
              //     product_list.push(query_product_list[0])
              // }
              // for (let index = 0; index < product_list.length; index++) {
              //     URL = []
              //     let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", product_list[index].id)
              //     if (searchURLImg.length > 0) {
              //         searchURLImg.forEach(element => {
              //             URL.push(element.URL)
              //         });
              //     }
              //     product_list[index].images_URL = URL
              // }
              // --------------old code-------------

              if (product_list) {
                for (let index = 0; index < product_list.length; index++) {
                  let id = product_list[index].id;
                  let star = await query(
                    "SELECT total_rating FROM tb_product_rating_average WHERE product_id = ?",
                    id
                  );
                  if (star.length == 1) {
                    product_list[index].stars = star[0].total_rating;
                  } else {
                    product_list[index].stars = 0;
                  }
                }
                finalRes.ok = "y";
                finalRes.product_list = product_list;
              }
            } else {
              finalRes.product_list = [];
            }

            if (finalRes.sub_product_array.length > 0) {
              for (
                let index = 0;
                index < finalRes.sub_product_array.length;
                index++
              ) {
                sub_product_list_array = [];
                if (finalRes.sub_product_array[index].length > 0) {
                  for (
                    let s = 0;
                    s < finalRes.sub_product_array[index].length;
                    s++
                  ) {
                    if (finalRes.sub_product_array[index][s] > 0) {
                      let query_sub_product_list = await query(
                        "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en, short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) ORDER BY updated_at DESC",
                        finalRes.sub_product_array[index][s]
                      );
                      sub_product_list_array.push(query_sub_product_list[0]);
                      for (
                        let index = 0;
                        index < sub_product_list_array.length;
                        index++
                      ) {
                        URL = [];
                        let PROMOTION = [];
                        let searchURLImg = await query(
                          "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND media_type = 'image' ORDER BY `index` ASC",
                          sub_product_list_array[index].id
                        );
                        if (searchURLImg.length > 0) {
                          searchURLImg.forEach((element) => {
                            URL.push(element.URL);
                          });
                        }
                        sub_product_list_array[index].images_URL = URL;
                        let searchPromotion = await query(
                          "SELECT promotion_id FROM ms_product_promotion WHERE product_id = ? ORDER BY image_index ASC",
                          sub_product_list_array[index].id
                        );
                        if (searchPromotion.length > 0) {
                          searchPromotion.forEach((element) => {
                            PROMOTION.push(element.promotion_id);
                          });
                        }
                        sub_product_list_array[index].promotion_id = PROMOTION;
                      }
                    } else {
                      sub_product_list_array.push([]);
                    }
                  }
                  sub_product_list.push(sub_product_list_array);
                } else {
                  sub_product_list.push([]);
                }
              }
              // finalRes.sub_product_list = sub_product_list
            } else {
              // finalRes.sub_product_list = []
            }

            // ---------------------ส่วนเพิ่มเติม----------------------
            let finalId = [];
            let finalSellerShopId = [];
            finalRes.product_list.forEach((r) => {
              finalId.push(r.id);
              finalSellerShopId.push(r.seller_shop_id);
            });

            // เพิ่มราคาเข้าไปใน product_list
            let user = await isLoginAndGetUser(token);
            let priceByTier = await findProductPriceByUser(
              user.user_id,
              finalId,
              role_user,
              finalSellerShopId
            );
            let productIDPriceId = {};
            for (let j = 0; j < priceByTier.length; ++j) {
              if (!(priceByTier[j].product_id in productIDPriceId)) {
                productIDPriceId[priceByTier[j].product_id] = [];
              }
              productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
            }
            for (let index = 0; index < finalRes.product_list.length; index++) {
              try {
                if (!finalRes.product_list[index].short_description) {
                  finalRes.product_list[index].short_description = null;
                }
                if (!finalRes.product_list[index].short_description_en) {
                  finalRes.product_list[index].short_description_en = null;
                }
                if (!finalRes.product_list[index].message_status) {
                  finalRes.product_list[index].message_status = "no_status";
                }
                finalRes.product_list[index].real_price =
                  productIDPriceId[finalRes.product_list[index].id][0].real_price;
                finalRes.product_list[index].fake_price = productIDPriceId[finalRes.product_list[index].id][0].fake_price
                // finalRes.product_list[index].special_price = productIDPriceId[finalRes.product_list[index].id][0].special_price
                finalRes.product_list[index].discount_percent =
                  productIDPriceId[finalRes.product_list[index].id][0].discount_percent;
              } catch (e) {
                //console.log(e)
              }
            }
            // เพิ่มราคาเข้าไปใน product_list

            // เรียงตาม tb_custom_rules
            let prodArrayForSorted = await query(
              "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
              composite_index
            );
            let prodArrayToSort = [];
            if (prodArrayForSorted.length != 0) {
              prodArrayToSort = JSON.parse(prodArrayForSorted[0].product_array);
            }
            // console.log(prodArrayToSort)
            customSort({
              data: finalRes.product_list,
              sortBy: prodArrayToSort,
              sortField: "id",
            });
            // เรียงตาม tb_custom_rules

            // kill all duplicates here.
            dup_cleaner_dict = {};
            for (i = 0; i < finalRes.product_list.length; ++i) {
              if (!(finalRes.product_list[i].id in dup_cleaner_dict)) {
                dup_cleaner_dict[finalRes.product_list[i].id] = 0;
                dup_cleaner_final_list.push(finalRes.product_list[i]);
              }
            }

            finalRes.product_list = dup_cleaner_final_list;

            let userForFav = await isLoginAndGetUser(token);
            let favProductByUser = await findFavByUser(
              userForFav.user_id,
              finalId
            );
            finalRes.product_list.forEach((pd) => {
              if (favProductByUser.includes(pd.id)) {
                pd.isFavorite = true;
              } else {
                pd.isFavorite = false;
              }
            });

            for (let index = 0; index < finalRes.product_list.length; index++) {
              let id = finalRes.product_list[index].id;
              let star = await query(
                "SELECT total_rating FROM tb_product_rating_average WHERE product_id = ?",
                id
              );
              if (star.length == 1) {
                finalRes.product_list[index].stars = star[0].total_rating;
              } else {
                finalRes.product_list[index].stars = 0;
              }
            }
            // ---------------------ส่วนเพิ่มเติม----------------------

            let unique_product_array = [...new Set(finalRes.product_array)];
            let unique_sub_product_array = [
              ...new Set(finalRes.sub_product_array),
            ];
            finalRes.product_array =
              finalRes.product_array.length > 0 ? unique_product_array : [];
            finalRes.sub_product_array =
              finalRes.sub_product_array.length > 0
                ? unique_sub_product_array
                : [];
            // console.log("finalRes: ", finalRes)
            logjson.status = 200;
            logjson.return_data = ""; //finalRes
            logjson.execution_time = Date.now() - timeTaken;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, finalRes);
            return;
          } else {
            let array_for_query_prod = [0];
            let res = [];
            let finalRes = { ok: "", product_array: [], sub_product_array: [] };
            if (what_component == "industry_product") {
              const querySorted = await query(
                "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
                composite_index
              );
              if (querySorted.length != 0) {
                array_for_query_prod = JSON.parse(querySorted[0].product_array);
              }
              const queryResultUnsorted = await query(
                "SELECT product_id FROM ms_product_industry WHERE industry_id = ?",
                component_ID
              );
              res = await query(
                "SELECT id as product_id FROM ms_product WHERE id IN (?) AND status != 'inactive'",
                [array_for_query_prod]
              );

              queryResultUnsorted.forEach((p) => {
                res.push(p);
              });
              // res = await query("SELECT product_id FROM ms_product_industry WHERE industry_id = ?", component_ID)
            } else if (what_component == "brand_product") {
              const querySorted = await query(
                "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
                composite_index
              );
              if (querySorted.length != 0) {
                array_for_query_prod = JSON.parse(querySorted[0].product_array);
              }
              const queryResultUnsorted = await query(
                "SELECT ms_product_id as product_id FROM ms_product_manufacturer WHERE ms_manufacturer_id = ?",
                component_ID
              );
              res = await query(
                "SELECT id as product_id FROM ms_product WHERE id IN (?) AND status != 'inactive'",
                [array_for_query_prod]
              );

              queryResultUnsorted.forEach((p) => {
                res.push(p);
              });
              // res = await query("SELECT ms_product_id as product_id FROM ms_product_manufacturer WHERE ms_manufacturer_id = ?", component_ID)
            } else if (what_component == "promotion") {
              const querySorted = await query(
                "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
                composite_index
              );
              if (querySorted.length != 0) {
                array_for_query_prod = JSON.parse(querySorted[0].product_array);
              }
              const queryResultUnsorted = await query(
                "SELECT product_id FROM ms_product_promotion WHERE promotion_id = ?",
                component_ID
              );
              res = await query(
                "SELECT id as product_id FROM ms_product WHERE id IN (?) AND status != 'inactive'",
                [array_for_query_prod]
              );

              queryResultUnsorted.forEach((p) => {
                res.push(p);
              });
              // res = await query("SELECT product_id FROM ms_product_promotion WHERE promotion_id = ?", component_ID)
            }
            let prodArrayForSorted = await query(
              "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
              composite_index
            );
            let prodArrayToSort = [];
            if (prodArrayForSorted.length != 0) {
              prodArrayToSort = JSON.parse(prodArrayForSorted[0].product_array);
            }
            // console.log(prodArrayToSort)
            if (!res || res.length == 0) {
              //console.log("message: ", "no data");
              logjson.status = 200;
              logjson.return_data = "";
              logjson.execution_time = Date.now() - timeTaken;
              logjson.message = "no data";
              logjson = JSON.stringify(logjson);
              ShF_log_to_file(logfile, logjson);
              result({ message: "no data" }, null);
              return;
            }
            // let product_array = JSON.parse(res[0].product_array)
            let product_array = [];
            for (let index = 0; index < res.length; index++) {
              product_array.push(JSON.parse(res[index].product_id));
            }
            let unique_product_array_for_sort = [...new Set(product_array)];
            let ProductList = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en, short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status != 'inactive' ORDER BY updated_at DESC",
              [product_array]
            );
            customSort({
              data: ProductList,
              sortBy: unique_product_array_for_sort,
              sortField: "id",
            });
            customSort({
              data: ProductList,
              sortBy: prodArrayToSort,
              sortField: "id",
            });

            let image_vdo = await query(
              "SELECT product_id, media_path FROM ms_product_image_vdo WHERE product_id IN (?) AND media_type = 'image' ORDER BY `index` ASC",
              [product_array]
            );

            // this is very inefficient...
            for (i = 0; i < image_vdo.length; ++i) {
              for (j = 0; j < ProductList.length; ++j) {
                if (image_vdo[i].product_id == ProductList[j].id) {
                  if (!("images_URL" in ProductList[j])) {
                    ProductList[j].images_URL = [];
                  }

                  ProductList[j].images_URL.push(
                    process.env.IMAGE_PATH + image_vdo[i].media_path
                  );
                }
              }
            }

            let product_price_query = await query(
              "SELECT ms_product_id, real_price, discount_percent FROM ms_product_price WHERE ms_product_id IN (?) LIMIT 1",
              [product_array]
            );

            for (let index = 0; index < product_price_query.length; index++) {
              for (let y = 0; y < ProductList.length; y++) {
                if (
                  product_price_query[index].ms_product_id == ProductList[y].id
                ) {
                  ProductList[y].real_price =
                    product_price_query[index].real_price;
                  ProductList[y].discount_percent =
                    product_price_query[index].discount_percent;
                }
              }
            }

            for (let index = 0; index < ProductList.length; index++) {
              if (!ProductList[index].images_URL) {
                ProductList[index].images_URL = [];
              }
              if (!ProductList[index].promotion_id) {
                ProductList[index].promotion_id = null;
              }
              if (!ProductList[index].short_description) {
                ProductList[index].short_description = null;
              }
              if (!ProductList[index].short_description_en) {
                ProductList[index].short_description_en = null;
              }
              if (!ProductList[index].message_status) {
                ProductList[index].message_status = "no status";
              }
              if (!ProductList[index].real_price) {
                ProductList[index].real_price = null;
              }
              if (!ProductList[index].discount_percent) {
                ProductList[index].discount_percent = null;
              }
            }

            // ---------------------ส่วนเพิ่มเติม----------------------
            let finalId = [];
            let finalSellerShopId = [];
            ProductList.forEach((r) => {
              finalId.push(r.id);
              finalSellerShopId.push(r.seller_shop_id);
            });

            // เพิ่มราคาเข้าไปใน product_list
            let user = await isLoginAndGetUser(token);
            let priceByTier = await findProductPriceByUser(
              user.user_id,
              finalId,
              role_user,
              finalSellerShopId
            );
            let productIDPriceId = {};
            for (let j = 0; j < priceByTier.length; ++j) {
              if (!(priceByTier[j].product_id in productIDPriceId)) {
                productIDPriceId[priceByTier[j].product_id] = [];
              }
              productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
            }

            for (let index = 0; index < ProductList.length; index++) {
              try {
                if (!ProductList[index].short_description) {
                  ProductList[index].short_description = null;
                }
                if (!ProductList[index].short_description_en) {
                  ProductList[index].short_description_en = null;
                }
                if (!ProductList[index].message_status) {
                  ProductList[index].message_status = "no_status";
                }
                ProductList[index].real_price =
                  productIDPriceId[ProductList[index].id][0].real_price;
                ProductList[index].fake_price = productIDPriceId[ProductList[index].id][0].fake_price
                // ProductList[index].special_price = productIDPriceId[ProductList[index].id][0].special_price
                ProductList[index].discount_percent =
                  productIDPriceId[ProductList[index].id][0].discount_percent;
              } catch (e) {
                //console.log(e)
              }
            }
            // เพิ่มราคาเข้าไปใน product_list

            // kill all duplicates here.
            dup_cleaner_dict = {};
            for (i = 0; i < ProductList.length; ++i) {
              if (!(ProductList[i].id in dup_cleaner_dict)) {
                dup_cleaner_dict[ProductList[i].id] = 0;
                dup_cleaner_final_list.push(ProductList[i]);
              }
            }

            for (
              let index = 0;
              index < dup_cleaner_final_list.length;
              index++
            ) {
              let id = dup_cleaner_final_list[index].id;
              let star = await query(
                "SELECT total_rating FROM tb_product_rating_average WHERE product_id = ?",
                id
              );
              if (star.length == 1) {
                dup_cleaner_final_list[index].stars = star[0].total_rating;
              } else {
                dup_cleaner_final_list[index].stars = 0;
              }
            }

            ProductList = dup_cleaner_final_list;
            let userForFav = await isLoginAndGetUser(token);
            let favProductByUser = await findFavByUser(
              userForFav.user_id,
              finalId
            );
            ProductList.forEach((pd) => {
              if (favProductByUser.includes(pd.id)) {
                pd.isFavorite = true;
              } else {
                pd.isFavorite = false;
              }
            });
            // ---------------------ส่วนเพิ่มเติม----------------------

            finalRes.ok = "y";
            let unique_product_array = [...new Set(product_array)];
            finalRes.product_array = res.length > 0 ? unique_product_array : [];
            finalRes.product_list = ProductList.length > 0 ? ProductList : [];
            finalRes.sub_product_array = [];
            logjson.status = 200;
            logjson.return_data = ""; //finalRes
            logjson.execution_time = Date.now() - timeTaken;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            // console.log("finalRes: ", finalRes);
            result(null, finalRes);
          }
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.message = "missing/invalid component_ID";
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "missing/invalid component_ID" }, null);
          return;
        }
      } else if (
        what_component == "new_product" ||
        what_component == "best_seller" ||
        what_component == "recommended_product"
      ) {
        if (component_ID == "") {
          let finalRes = { ok: "", product_array: [], sub_product_array: [] };
          let res = await query(
            "SELECT * FROM tb_custom_rule_product_sorted_list WHERE composite_index = ?",
            composite_index
          );
          if (!res || res.length == 0) {
            //console.log("message: ", "no data");
            logjson.status = 200;
            logjson.return_data = "";
            logjson.execution_time = Date.now() - timeTaken;
            logjson.message = "no data";
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result({ message: "no data" }, null);
            return;
          }
          let product_array = JSON.parse(res[0].product_array);
          let ProductList = await query(
            "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en, short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status != 'inactive' ORDER BY updated_at DESC",
            [product_array]
          );
          customSort({
            data: ProductList,
            sortBy: product_array,
            sortField: "id",
          });

          let image_vdo = await query(
            "SELECT product_id, media_path FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
            [product_array]
          );

          // this is very inefficient...
          for (i = 0; i < image_vdo.length; ++i) {
            for (j = 0; j < ProductList.length; ++j) {
              if (image_vdo[i].product_id == ProductList[j].id) {
                if (!("images_URL" in ProductList[j])) {
                  ProductList[j].images_URL = [];
                }

                ProductList[j].images_URL.push(
                  process.env.IMAGE_PATH + image_vdo[i].media_path
                );
              }
            }
          }

          // ---------------------ส่วนเพิ่มเติม----------------------
          let finalId = [];
          let finalSellerShopId = [];
          ProductList.forEach((r) => {
            finalId.push(r.id);
            finalSellerShopId.push(r.seller_shop_id);
          });

          // เพิ่มราคาเข้าไปใน product_list
          let user = await isLoginAndGetUser(token);
          let priceByTier = await findProductPriceByUser(
            user.user_id,
            finalId,
            role_user,
            finalSellerShopId
          );
          let productIDPriceId = {};
          for (let j = 0; j < priceByTier.length; ++j) {
            if (!(priceByTier[j].product_id in productIDPriceId)) {
              productIDPriceId[priceByTier[j].product_id] = [];
            }
            productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
          }

          for (let index = 0; index < ProductList.length; index++) {
            try {
              if (!ProductList[index].short_description) {
                ProductList[index].short_description = null;
              }
              if (!ProductList[index].short_description_en) {
                ProductList[index].short_description_en = null;
              }
              if (!ProductList[index].message_status) {
                ProductList[index].message_status = "no_status";
              }
              ProductList[index].real_price =
                productIDPriceId[ProductList[index].id][0].real_price;
              ProductList[index].fake_price = productIDPriceId[ProductList[index].id][0].fake_price
              // ProductList[index].special_price = productIDPriceId[ProductList[index].id][0].special_price
              ProductList[index].discount_percent =
                productIDPriceId[ProductList[index].id][0].discount_percent;
            } catch (e) {
              //console.log(e)
            }
          }
          // เพิ่มราคาเข้าไปใน product_list
          for (let index = 0; index < ProductList.length; index++) {
            let id = ProductList[index].id;
            let star = await query(
              "SELECT total_rating FROM tb_product_rating_average WHERE product_id = ?",
              id
            );
            if (star.length == 1) {
              ProductList[index].stars = star[0].total_rating;
            } else {
              ProductList[index].stars = 0;
            }
          }

          let userForFav = await isLoginAndGetUser(token);
          let favProductByUser = await findFavByUser(
            userForFav.user_id,
            finalId
          );
          ProductList.forEach((pd) => {
            if (favProductByUser.includes(pd.id)) {
              pd.isFavorite = true;
            } else {
              pd.isFavorite = false;
            }
          });

          // ---------------------ส่วนเพิ่มเติม----------------------

          finalRes.ok = "y";
          finalRes.product_array =
            res.length > 0 ? JSON.parse(res[0].product_array) : [];
          finalRes.product_list = ProductList.length > 0 ? ProductList : [];
          finalRes.sub_product_array = [];
          logjson.status = 200;
          logjson.return_data = ""; //finalRes
          logjson.execution_time = Date.now() - timeTaken;
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          // console.log("finalRes: ", finalRes);
          result(null, finalRes);
          return;
        } else {
          logjson.status = 400;
          logjson.return_data = "";
          logjson.execution_time = Date.now() - timeTaken;
          logjson.message = "component_ID not required";
          logjson = JSON.stringify(logjson);
          ShF_log_to_file(logfile, logjson);
          result({ message: "component_ID not required" }, null);
          return;
        }
      }
    } else {
      logjson.status = 400;
      logjson.return_data = "";
      logjson.execution_time = Date.now() - timeTaken;
      logjson.message = "missing/invalid custom_user_ID or what_component";
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result({ message: "missing/invalid custom_user_ID or what_component" });
      return;
    }
  } catch (err) {
    logjson.status = 500;
    logjson.return_data = "";
    logjson.message = err.name + ": " + err.message;

    if (typeof err === "object" && err.stack) {
      logjson.errstack = err.stack;
    } else {
      logjson.errstack = "";
    }

    logjson.execution_time = Date.now() - timeTaken;
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(err, null);
    return;
  }
};

const customSort = ({ data, sortBy, sortField }) => {
  if (!sortBy || sortBy.length == 0) {
    sortBy = [];
  }
  const sortByObject = sortBy.reduce((obj, item, index) => {
    return {
      ...obj,
      [item]: index,
    };
  }, {});
  return data.sort(
    (a, b) => sortByObject[a[sortField]] - sortByObject[b[sortField]]
  );
};

const isLoginAndGetUser = async (token) => {
  if (token) {
    let checkUserLogin = await query(
      "SELECT user_id FROM token WHERE access_token = ?",
      token
    );
    if (checkUserLogin.length != 0) {
      return { checkUserLogin: true, user_id: checkUserLogin[0].user_id };
    } else {
      return { checkUserLogin: true, user_id: "" };
    }
  } else {
    return { checkUserLogin: false, user_id: "" };
  }
};

const findProductPriceByUser = async (
  user_id,
  product_id_list,
  role_user,
  sellerShopId
) => {

  let searchProductPriceByUser = [];
  let ResultProductPriceByUser = [];

  if (role_user == "purchaser" && user_id) {
    let getTier = [];
    let getComId = await query(
      "SELECT company_id FROM `user_has_permission` WHERE purchaser = '1' AND user_id = ?",
      user_id
    );
    if (getComId.length != 0 && product_id_list.length != 0) {
      getTier = await query(
        "SELECT f_price_tier,gt.partner_com_id,gt.seller_com_id FROM tb_customer_type tct JOIN (SELECT give_tier_id,seller_com_id,partner_com_id FROM `seller_with_partner` WHERE partner_com_id = ? AND seller_com_id = ?) AS gt ON tct.id = gt.give_tier_id",
        [getComId[0].company_id, sellerShopId[0]]
      );
      // console.log(getTier)
      let seller_id_array = [];
      let tier_shop_array = [];
      getTier.forEach((gt) => {
        seller_id_array.push(gt.seller_com_id);
        tier_shop_array.push({ shop: gt.seller_com_id, tier: gt.f_price_tier });
      });
      //console.log(tier_shop_array);
      if (getTier.length != 0) {
        let searchSpecialPrice = [];
        let searchRealPrice = [];
        let allProductPriceArray = [];
        searchRealPrice = await query(
          `SELECT DISTINCT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent FROM ms_product_price WHERE ms_product_id IN (?)`,
          [product_id_list]
        );
        searchProductPriceByUser = searchRealPrice;

        let querySpecialPrice = await query(
          `SELECT DISTINCT ms_product_id,mp.seller_shop_id,price_fix_0 as real_price,price_fix_1,price_fix_2,price_fix_3,price_fix_4,price_fix_5 FROM ms_product_price mpp JOIN ms_product mp ON mpp.ms_product_id = mp.id WHERE mp.seller_shop_id IN (?)`,
          [seller_id_array]
        );
        for (let index = 0; index < tier_shop_array.length; index++) {
          for (let j = 0; j < querySpecialPrice.length; j++) {
            if (
              tier_shop_array[index].shop == querySpecialPrice[j].seller_shop_id
            ) {
              allProductPriceArray.push({
                ms_product_id: querySpecialPrice[j].ms_product_id,
                seller_shop_id: querySpecialPrice[j].seller_shop_id,
                real_price: querySpecialPrice[j].real_price,
                special_price:
                  querySpecialPrice[j][
                    `price_fix_${tier_shop_array[index].tier}`
                  ] == 0
                    ? querySpecialPrice[j].real_price
                    : querySpecialPrice[j][
                        `price_fix_${tier_shop_array[index].tier}`
                      ],
              });
            }
          }
        }
        let productIDPriceId = {};
        for (let j = 0; j < allProductPriceArray.length; ++j) {
          if (!(allProductPriceArray[j].ms_product_id in productIDPriceId)) {
            productIDPriceId[allProductPriceArray[j].ms_product_id] = [];
          }
          productIDPriceId[allProductPriceArray[j].ms_product_id].push(
            allProductPriceArray[j]
          );
        }
        for (let index = 0; index < searchProductPriceByUser.length; index++) {
          if (productIDPriceId[searchProductPriceByUser[index].ms_product_id]) {
            if (
              productIDPriceId[searchProductPriceByUser[index].ms_product_id][0]
                .special_price != 0
            ) {
              searchProductPriceByUser[index].special_price =
                productIDPriceId[
                  searchProductPriceByUser[index].ms_product_id
                ][0].special_price;
            } else {
              searchProductPriceByUser[index].special_price = "";
            }
          }
        }
      } else {
        searchProductPriceByUser = await query(
          `SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price`,
          [product_id_list]
        );
      }
    } else {
      searchProductPriceByUser = await query(
        `SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price`,
        [product_id_list]
      );
    }
  } else {
    if(product_id_list.length != 0){
      searchProductPriceByUser = await query(
        `SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price`,
        [product_id_list]
      );
    }
    else{
      ResultProductPriceByUser.push({
        product_id: "",
        real_price: "",
        fake_price: "",
        special_price: "",
        discount_percent: ""
      });
      return ResultProductPriceByUser
    }
  }

  searchProductPriceByUser.forEach((p) => {
    if (p.special_price) {
      ResultProductPriceByUser.push({
        product_id: p.ms_product_id,
        real_price: p.real_price,
        fake_price: p.fake_price,
        special_price: p.special_price,
        discount_percent: p.discount_percent
      });
    } else {
      ResultProductPriceByUser.push({
        product_id: p.ms_product_id,
        real_price: p.real_price,
        fake_price: p.fake_price,
        special_price: "",
        discount_percent: p.discount_percent
      });
    }
  });
  //console.log(ResultProductPriceByUser)
  return ResultProductPriceByUser || null;
};

Product.search_pag = async (
  begin_search_type,
  begin_search_details,
  extra_filters,
  search_category_from_result,
  search_industry_from_result,
  search_brand_from_result,
  seller_shop_id,
  token,
  role_user,
  order_by_price,
  order_by_sku,
  page,
  page_type,
  result
) => {
  let timeTaken = Date.now();
  let finalResult = {};
  let all_product_from_sorted_list;
  let all_product_from_component = [];
  let search_result_product_list = [];
  let search_result_product_list_tmp = [];
  let search_result_product_list_industry_tmp = [];
  let search_result_product_list_brand_tmp = [];
  let all_product_from_sorted_list_tmp = [];
  let array_product = [];
  let product_list = [];
  let dup_cleaner_final_list = [];
  let URL = [];
  let logfile = "searchFunc.log";
  let mysql_seller_shop_id_cmd = "";
  let mysql_p_seller_shop_id_cmd = "";
  let mysql_i_seller_shop_id_cmd = "";
  let mysql_b_seller_shop_id_cmd = "";
  let product_page,
    total_page,
    limit = 0;
  if (isNormalInteger(seller_shop_id)) {
    mysql_seller_shop_id_cmd = "seller_shop_id = " + seller_shop_id + " AND";
    mysql_p_seller_shop_id_cmd =
      "p.seller_shop_id = " + seller_shop_id + " AND";
    mysql_i_seller_shop_id_cmd =
      "i.seller_shop_id = " + seller_shop_id + " AND";
    mysql_b_seller_shop_id_cmd =
      "b.seller_shop_id = " + seller_shop_id + " AND";
  }

  try {
    if (begin_search_type == "product_id") {
      let searchResult = [];
      if (begin_search_details.id) {
        searchResult = await query(
          "SELECT * FROM `ms_product` WHERE id = ?",
          begin_search_details.id
        );
      }
      if (searchResult.length > 0) {
        let searchURLImg = await query(
          "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
          [searchResult[0].id]
        );
        if (searchURLImg.length > 0 && searchResult.length > 0) {
          productIDImageURL = {};
          for (let j = 0; j < searchURLImg.length; ++j) {
            if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
              productIDImageURL[searchURLImg[j].ms_product_id] = [];
            }
            productIDImageURL[searchURLImg[j].ms_product_id].push(
              process.env.IMAGE_PATH + searchURLImg[j].URL
            );
          }
          for (let index = 0; index < searchResult.length; index++) {
            searchResult[index].images_URL =
              productIDImageURL[searchResult[index].id];
          }
        }
      }
      finalResult.query_result = searchResult;
    } else if (begin_search_type == "search_bar") {
      let searchBarResult = await query(
        "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE status = 'active' AND name LIKE ? OR (status = 'active' AND sku LIKE ?) OR (status = 'active' AND description LIKE ?) OR (status = 'active' AND short_description LIKE ?) OR id IN (SELECT mp.id FROM `ms_product` mp JOIN tb_tag_product_join ttpj ON ttpj.product_ID = mp.id JOIN tb_tag tt ON ttpj.tag_ID = tt.id WHERE mp.status = 'active' AND tt.name LIKE ?) OR id IN (SELECT mp.id FROM `ms_product` mp JOIN ms_product_attribute mpa ON mpa.product_id = mp.id WHERE mp.status = 'active' AND mpa.new_sku LIKE ?) ORDER BY updated_at DESC",
        [
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
          `%${begin_search_details.keyword}%`,
        ]
      );

      let id_searchBarResult = searchBarResult.map((value) => value.id);

      if (id_searchBarResult.length == 0) {
        id_searchBarResult = [0];
      }

      let searchURLImg = await query(
        "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
        [id_searchBarResult]
      );

      URL = [];

      if (searchURLImg.length > 0 && searchBarResult.length > 0) {
        productIDImageURL = {};
        for (let j = 0; j < searchURLImg.length; ++j) {
          if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
            productIDImageURL[searchURLImg[j].ms_product_id] = [];
          }
          productIDImageURL[searchURLImg[j].ms_product_id].push(
            process.env.IMAGE_PATH + searchURLImg[j].URL
          );
        }

        for (let index = 0; index < searchBarResult.length; index++) {
          searchBarResult[index].images_URL =
            productIDImageURL[searchBarResult[index].id];
        }
      }
      if (searchBarResult) {
        finalResult.ok = "y";
        finalResult.query_result = searchBarResult;
      }
    } else if (begin_search_type == "component") {
      let allowed_components = [
        "new_product",
        "best_seller",
        "recommended_product",
        "category_product",
        "industry_product",
        "brand_product",
        "promotion",
      ];

      if (!allowed_components.includes(begin_search_details.what_component)) {
        let logjson = {
          name: logfile,
          parameter: {
            begin_search_type: begin_search_type,
            begin_search_details: begin_search_details,
            extra_filters: extra_filters,
            search_category_from_result: search_category_from_result,
            search_industry_from_result: search_industry_from_result,
            search_brand_from_result: search_brand_from_result,
          },
        };
        logjson.status = 400;
        logjson.return_data = "";
        logjson.execution_time = Date.now() - timeTaken;
        logjson = JSON.stringify(logjson);
        ShF_log_to_file(logfile, logjson);
        result({ message: "what_component invalid" }, null);
        return;
      }

      let composite_index =
        begin_search_details.custom_user_ID +
        "+" +
        begin_search_details.what_component +
        "+" +
        begin_search_details.component_id;

      const searchComponentResult = await query(
        "SELECT product_array,component_ID FROM `tb_custom_rule_product_sorted_list` WHERE composite_index = ?",
        composite_index
      );
      if (searchComponentResult.length == 0) {
        let logjson = {
          name: logfile,
          parameter: {
            begin_search_type: begin_search_type,
            begin_search_details: begin_search_details,
            extra_filters: extra_filters,
            search_category_from_result: search_category_from_result,
            search_industry_from_result: search_industry_from_result,
            search_brand_from_result: search_brand_from_result,
          },
        };
        /*logjson.status = 200
                logjson.return_data = ""
                logjson.message = "custom rule not exist"
                logjson.execution_time = Date.now() - timeTaken
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                result(null, { "ok": "y", "query_result": [], "message": "custom rule not exist" })
                return*/
        all_product_from_sorted_list = [0];
        original_all_product_from_sorted_list = all_product_from_sorted_list;
        //console.log("custom rule not existed")
      } else {
        all_product_from_sorted_list = JSON.parse(
          searchComponentResult[0].product_array
        );
        original_all_product_from_sorted_list = all_product_from_sorted_list;
      }
      //console.log("all_product_from_sorted_list")
      //console.log(all_product_from_sorted_list)
      cateId = begin_search_details.component_id; // JSON.parse(searchComponentResult[0].component_ID)

      if (begin_search_details.what_component == "category_product") {
        //console.log("category_product")

        let allProductIdSub = [];
        const searchProductResultSorted = await query(
          "SELECT hierachy FROM `ms_category` WHERE " +
            mysql_seller_shop_id_cmd +
            " id = ?",
          cateId
        );

        // console.log(searchProductResultSorted[0].hierachy)

        if (searchProductResultSorted.length > 0) {
          //const cateIdSubAll = await query("SELECT id FROM `ms_category` WHERE " + mysql_seller_shop_id_cmd + " hierachy like ?", `${searchProductResultSorted[0].hierachy}\_%`)
          //const cateIdSubAll = await query("SELECT id FROM `ms_category` WHERE " + mysql_seller_shop_id_cmd + " hierachy like '" +  searchProductResultSorted[0].hierachy + "_%'")

          // above has issue. Still can't fix. Use below for now.
          const cateIdSubAll = await query(
            "SELECT id FROM `ms_category` WHERE " +
              mysql_seller_shop_id_cmd +
              " hierachy = ?",
            searchProductResultSorted[0].hierachy
          );

          cateIdSubAll.forEach((c) => {
            allProductIdSub.push(c.id);
          });
          // console.log(allProductIdSub)
          const all_product_from_component = await query(
            "SELECT ms_product_id FROM `ms_product_category` WHERE ms_category_id IN (?)",
            [allProductIdSub]
          );
          // console.log('all_product_from_component => ', all_product_from_component)
          if (all_product_from_sorted_list.length > 0) {
            let CustomProductResult = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active'",
              [all_product_from_sorted_list]
            );

            let id_CustomProductResult = CustomProductResult.map(
              (value) => value.id
            );

            if (id_CustomProductResult.length == 0)
              id_CustomProductResult = [0];

            let searchURLImg = await query(
              "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
              [id_CustomProductResult]
            );

            if (searchURLImg.length > 0 && CustomProductResult.length > 0) {
              productIDImageURL = {};
              for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                  productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                  process.env.IMAGE_PATH + searchURLImg[j].URL
                );
              }

              for (let index = 0; index < CustomProductResult.length; index++) {
                CustomProductResult[index].images_URL =
                  productIDImageURL[CustomProductResult[index].id];
                product_list.push(CustomProductResult[index]);
              }
            }
            // ------------benz code---------------
            // for (let index = 0; index < all_product_from_sorted_list.length; index++) {
            //     let CustomProductResult = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?)", all_product_from_sorted_list[index])
            //     for (let index = 0; index < CustomProductResult.length; index++) {
            //         URL = []
            //         let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", CustomProductResult[index].id)
            //         if (searchURLImg.length > 0) {
            //             searchURLImg.forEach(element => {
            //                 URL.push(element.URL)
            //             });
            //         }
            //         CustomProductResult[index].URL = URL
            //     }
            //     product_list.push(CustomProductResult[0])
            // }
            // ------------benz code---------------
          }
          for (
            let index = 0;
            index < all_product_from_sorted_list.length;
            index++
          ) {
            for (let s = 0; s < all_product_from_component.length; s++) {
              if (
                all_product_from_component[s].ms_product_id ==
                all_product_from_sorted_list[index]
              ) {
                all_product_from_component.splice(s, 1);
              }
            }
          }

          all_product_from_sorted_list.forEach((element) => {
            search_result_product_list.push(element);
          });

          all_product_from_component.forEach((element) => {
            array_product.push(element.ms_product_id);
            search_result_product_list.push(element.ms_product_id);
          });

          // for sorted product
          if (original_all_product_from_sorted_list.length > 0) {
            mySortedList = "";
            //console.log(original_all_product_from_sorted_list)
            for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
              mySortedList += original_all_product_from_sorted_list[i];

              if (i < original_all_product_from_sorted_list.length - 1)
                mySortedList += ",";
            }

            const ProductResult = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id, " +
                mySortedList +
                " )",
              [original_all_product_from_sorted_list]
            );

            let id_ProductResult = ProductResult.map((value) => value.id);
            if (id_ProductResult.length == 0) {
              id_ProductResult = [0];
            }

            let searchURLImg = await query(
              "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
              [id_ProductResult]
            );

            if (ProductResult.length > 0) {
              productIDImageURL = {};
              for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                  productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                  process.env.IMAGE_PATH + searchURLImg[j].URL
                );
              }

              for (let index = 0; index < ProductResult.length; index++) {
                ProductResult[index].images_URL =
                  productIDImageURL[ProductResult[index].id];
              }
              /*ProductResult.forEach(element => {
                                product_list.push(element)
                            });*/

              for (i = 0; i < ProductResult.length; ++i) {
                product_list.push(ProductResult[i]);
              }
            }
          }

          if (array_product.length > 0) {
            let ProductResult = await query(
              "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY updated_at DESC",
              [array_product]
            );

            let id_ProductResult = ProductResult.map((value) => value.id);

            if (id_ProductResult.length == 0) {
              id_ProductResult = [0];
            }

            let searchURLImg = await query(
              "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
              [id_ProductResult]
            );

            if (searchURLImg.length > 0 && ProductResult.length > 0) {
              productIDImageURL = {};
              for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                  productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                  process.env.IMAGE_PATH + searchURLImg[j].URL
                );
              }

              for (let index = 0; index < ProductResult.length; index++) {
                ProductResult[index].images_URL =
                  productIDImageURL[ProductResult[index].id];
              }
            }

            // ------------benz code---------------
            // for (let index = 0; index < ProductResult.length; index++) {
            //     URL = []
            //     let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", ProductResult[index].id)
            //     if (searchURLImg.length > 0) {
            //         searchURLImg.forEach(element => {
            //             URL.push(element.URL)
            //         });
            //     }
            //     ProductResult[index].images_URL = URL
            // }
            // ------------benz code---------------
            ProductResult.forEach((element) => {
              product_list.push(element);
            });
          }
          finalResult.query_result = product_list;
        } else {
          finalResult.query_result = [];
        }
      } else {
        //console.log("category_product NOT")
        const searchProductResultSorted = await query(
          "SELECT id FROM `ms_product` WHERE " +
            mysql_seller_shop_id_cmd +
            " id IN (?)",
          [all_product_from_sorted_list]
        );
        if (searchProductResultSorted) {
          all_product_from_sorted_list = searchProductResultSorted;
          finalResult.ok = "y";
          all_product_from_sorted_list.forEach((element) => {
            all_product_from_sorted_list_tmp.push(element.id);
            search_result_product_list.push(element.id);
          });
          all_product_from_sorted_list = all_product_from_sorted_list_tmp;
        }
        if (begin_search_details.what_component == "industry_product") {
          const searchProductResult = await query(
            "SELECT pi.product_id FROM `ms_product_industry` pi LEFT JOIN `ms_product` p ON pi.product_id = p.id WHERE " +
              mysql_p_seller_shop_id_cmd +
              " pi.industry_id = ?",
            begin_search_details.component_id
          );
          if (searchProductResult) {
            all_product_from_component = searchProductResult;
            finalResult.ok = "y";
            for (
              let index = 0;
              index < all_product_from_sorted_list.length;
              index++
            ) {
              for (let s = 0; s < all_product_from_component.length; s++) {
                if (
                  all_product_from_component[s].product_id ==
                  all_product_from_sorted_list[index]
                ) {
                  all_product_from_component.splice(s, 1);
                }
              }
            }
            all_product_from_component.forEach((element) => {
              array_product.push(element.product_id);
              search_result_product_list.push(element.product_id);
            });
          }
        } else if (begin_search_details.what_component == "brand_product") {
          const searchProductResult = await query(
            "SELECT pb.ms_product_id FROM `ms_product_manufacturer` pb LEFT JOIN `ms_product` p ON pb.ms_product_id = p.id WHERE " +
              mysql_p_seller_shop_id_cmd +
              " pb.ms_manufacturer_id = ?",
            begin_search_details.component_id
          );
          if (searchProductResult) {
            all_product_from_component = searchProductResult;
            finalResult.ok = "y";
            for (
              let index = 0;
              index < all_product_from_sorted_list.length;
              index++
            ) {
              for (let s = 0; s < all_product_from_component.length; s++) {
                if (
                  all_product_from_component[s].ms_product_id ==
                  all_product_from_sorted_list[index]
                ) {
                  all_product_from_component.splice(s, 1);
                }
              }
            }

            for (i = 0; i < all_product_from_component.length; ++i) {
              array_product.push(all_product_from_component[i].ms_product_id);
              search_result_product_list.push(
                all_product_from_component[i].ms_product_id
              );
            }
            /*all_product_from_component.forEach(element => {
                            array_product.push(element.ms_product_id)
                            search_result_product_list.push(element.ms_product_id)
                        });*/
            //console.log( all_product_from_component )
            //console.log("brand")
            //console.log(array_product)
            //console.log(search_result_product_list)
          }
        } else if (
          begin_search_details.what_component == "new_product" ||
          begin_search_details.what_component == "recommended_product" ||
          begin_search_details.what_component == "best_seller"
        ) {
          // FOR NEW PRODUCT, RECOMMENDED PRODUCT, BEST SELLER

          const searchProductResult = await query(
            "SELECT id FROM ms_product WHERE 1 " +
              mysql_seller_shop_id_cmd +
              " ORDER BY updated_at DESC"
          );
          if (searchProductResult) {
            all_product_from_component = searchProductResult;
            finalResult.ok = "y";
            for (
              let index = 0;
              index < all_product_from_sorted_list.length;
              index++
            ) {
              for (let s = 0; s < all_product_from_component.length; s++) {
                if (
                  all_product_from_component[s].ms_product_id ==
                  all_product_from_sorted_list[index]
                ) {
                  all_product_from_component.splice(s, 1);
                }
              }
            }

            for (i = 0; i < all_product_from_component.length; ++i) {
              array_product.push(all_product_from_component[i].ms_product_id);
              search_result_product_list.push(
                all_product_from_component[i].ms_product_id
              );
            }
          }
        }

        /*if (all_product_from_sorted_list.length > 0) {
                    let CustomProductResult = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?)", [all_product_from_sorted_list])

                    let id_CustomProductResult = CustomProductResult.map(value => value.id);

                    if (id_CustomProductResult.length == 0){
                        id_CustomProductResult = [0]
                    }

                    let searchURLImg = await query("SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC", [id_CustomProductResult])

                    if (searchURLImg.length > 0 && CustomProductResult.length > 0) {
                        productIDImageURL = {}
                        for (let j = 0; j < searchURLImg.length; ++j) {
                            if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                                productIDImageURL[searchURLImg[j].ms_product_id] = []
                            }
                            productIDImageURL[searchURLImg[j].ms_product_id].push(process.env.IMAGE_PATH + searchURLImg[j].URL)
                        }

                        for (let index = 0; index < CustomProductResult.length; index++) {
                            CustomProductResult[index].images_URL = productIDImageURL[CustomProductResult[index].id]
                            product_list.push(CustomProductResult[index])
                        }
                    }
                    // ------------benz code------------
                    // for (let index = 0; index < all_product_from_sorted_list.length; index++) {
                    //     let CustomProductResult = await query("SELECT id, seller_shop_id, sku, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?)", all_product_from_sorted_list[index])
                    //     for (let index = 0; index < CustomProductResult.length; index++) {
                    //         URL = []
                    //         let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", CustomProductResult[index].id)
                    //         if (searchURLImg.length > 0) {
                    //             searchURLImg.forEach(element => {
                    //                 URL.push(element.URL)
                    //             });
                    //         }
                    //         CustomProductResult[index].images_URL = URL
                    //     }
                    //     product_list.push(CustomProductResult[0])
                    // }
                    // ------------benz code------------
                //}

                /*			for (i = 0; i < product_list.length ; ++i ){
                console.log("BBB" + product_list[i].id)

                if (i == 10)break;
            }*/
        //console.log("original_all_product_from_sorted_list")
        //console.log(original_all_product_from_sorted_list)
        // for sorted product
        if (original_all_product_from_sorted_list.length > 0) {
          mySortedList = "";
          //console.log(original_all_product_from_sorted_list)
          for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
            mySortedList += original_all_product_from_sorted_list[i];

            if (i < original_all_product_from_sorted_list.length - 1)
              mySortedList += ",";
          }

          const ProductResult = await query(
            "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id, " +
              mySortedList +
              " )",
            [original_all_product_from_sorted_list]
          );

          let id_ProductResult = ProductResult.map((value) => value.id);

          if (id_ProductResult.length == 0) id_ProductResult = [0];
          let searchURLImg = await query(
            "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
            [id_ProductResult]
          );

          if (ProductResult.length > 0) {
            productIDImageURL = {};
            for (let j = 0; j < searchURLImg.length; ++j) {
              if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                productIDImageURL[searchURLImg[j].ms_product_id] = [];
              }
              productIDImageURL[searchURLImg[j].ms_product_id].push(
                process.env.IMAGE_PATH + searchURLImg[j].URL
              );
            }

            for (let index = 0; index < ProductResult.length; index++) {
              ProductResult[index].images_URL =
                productIDImageURL[ProductResult[index].id];
            }
            /*ProductResult.forEach(element => {
                            product_list.push(element)
                        });*/

            for (i = 0; i < ProductResult.length; ++i) {
              product_list.push(ProductResult[i]);
            }
          }
        }

        /*for (i = 0 ; i < product_list.length ; ++i ){
                    console.log("IDID")
                    console.log( product_list[i].id )

                }*/

        new_search_result_product_list = [];
        dict_nogoin = {};
        for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
          new_search_result_product_list.push(
            original_all_product_from_sorted_list[i]
          );
          dict_nogoin[original_all_product_from_sorted_list[i]] = 0;
        }
        //console.log("dict_nogoin : ")
        //console.log(dict_nogoin)
        for (i = 0; i < search_result_product_list.length; ++i) {
          if (!(search_result_product_list[i] in dict_nogoin)) {
            //console.log("IN")
            //console.log( search_result_product_list[i])
            new_search_result_product_list.push(search_result_product_list[i]);
          } else {
            //console.log("OUT")
            //console.log( search_result_product_list[i])
          }
        }
        //console.log("new_search_result_product_list")
        //console.log( new_search_result_product_list )

        search_result_product_list = new_search_result_product_list;
        //console.log("search_result_product_list")
        //console.log(search_result_product_list)

        // for remaining products.
        if (search_result_product_list.length > 0) {
          const ProductResult = await query(
            "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY updated_at DESC",
            [search_result_product_list]
          );

          let id_ProductResult = ProductResult.map((value) => value.id);

          if (id_ProductResult.length == 0) {
            id_ProductResult = [0];
          }
          let searchURLImg = await query(
            "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) ORDER BY `index` ASC",
            [id_ProductResult]
          );

          if (ProductResult.length > 0) {
            productIDImageURL = {};
            for (let j = 0; j < searchURLImg.length; ++j) {
              if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                productIDImageURL[searchURLImg[j].ms_product_id] = [];
              }
              productIDImageURL[searchURLImg[j].ms_product_id].push(
                process.env.IMAGE_PATH + searchURLImg[j].URL
              );
            }

            for (let index = 0; index < ProductResult.length; index++) {
              ProductResult[index].images_URL =
                productIDImageURL[ProductResult[index].id];
            }
            /*ProductResult.forEach(element => {
                            product_list.push(element)
                        });*/
            for (i = 0; i < ProductResult.length; ++i) {
              product_list.push(ProductResult[i]);
            }
          }
          // for (let index = 0; index < ProductResult.length; index++) {
          //     URL = []
          //     let searchURLImg = await query("SELECT URL FROM ms_product_media WHERE ms_product_id = ? ORDER BY image_index ASC", ProductResult[index].id)
          //     if (searchURLImg.length > 0) {
          //         searchURLImg.forEach(element => {
          //             URL.push(element.URL)
          //         });
          //     }
          //     ProductResult[index].images_URL = URL
          // }
          // ProductResult.forEach(element => {
          //     product_list.push(element)
          // });
        }
        //console.log(product_list)

        finalResult.query_result = product_list;
      }

      /*for (i = 0; i < product_list.length ; ++i ){
                console.log(product_list[i].id)

                //if (i == 10)break;
            }*/
    } else {
      let logjson = {
        name: logfile,
        parameter: {
          begin_search_type: begin_search_type,
          begin_search_details: begin_search_details,
          extra_filters: extra_filters,
          search_category_from_result: search_category_from_result,
          search_industry_from_result: search_industry_from_result,
          search_brand_from_result: search_brand_from_result,
        },
        status: 400,
        return_data: "",
        message: "begin_search_type invalid.",
        execution_time: Date.now() - timeTaken,
      };
      err = {
        message: "begin_search_type invalid.",
      };
      logjson = JSON.stringify(logjson);
      ShF_log_to_file(logfile, logjson);
      result(err, null);
      return;
    }
    //console.log("extra_filters")
    if (extra_filters) {
      category_filter_hierachy = [];
      filter_category = [];
      result_category = [];
      filter_industry = [];
      result_industry = [];
      filter_brand = [];
      result_brand = [];

      for (let index = 0; index < extra_filters.length; index++) {
        if (extra_filters[index].filter == "category") {
          if (extra_filters[index].filter_value != "") {
            const UPS_category_hierachy = await query(
              "SELECT id, hierachy from ms_category WHERE " +
                mysql_seller_shop_id_cmd +
                " id IN (?)",
              [extra_filters[index].filter_value]
            );
            for (let index = 0; index < UPS_category_hierachy.length; index++) {
              let searchHierachy = UPS_category_hierachy[
                index
              ].hierachy.replace(/_/g, "\\_");
              const UPS_category_sub_hierachy = await query(
                "SELECT id, hierachy from ms_category WHERE hierachy LIKE ?",
                `%${searchHierachy}%`
              );
              category_filter_hierachy.push(UPS_category_sub_hierachy[0]);
            }
            for (
              let index = 0;
              index < category_filter_hierachy.length;
              index++
            ) {
              const result_filter_category = await query(
                "SELECT ms_product_id from ms_product_category WHERE ms_category_id IN (?)",
                category_filter_hierachy[index].id
              );
              result_filter_category.forEach((element) => {
                filter_category.push(element);
              });
            }
            for (
              let index = 0;
              index < finalResult.query_result.length;
              index++
            ) {
              for (let s = 0; s < filter_category.length; s++) {
                if (
                  finalResult.query_result[index].id ==
                  filter_category[s].ms_product_id
                ) {
                  result_category.push(finalResult.query_result[index]);
                  search_result_product_list_tmp.push(
                    filter_category[s].ms_product_id
                  );
                }
              }
            }
            finalResult.query_result = result_category;
          }
        } else if (extra_filters[index].filter == "industry") {
          if (extra_filters[index].filter_value != "") {
            const filter_product_industry = await query(
              "SELECT pi.product_id FROM ms_product_industry pi LEFT JOIN `ms_industry` i ON pi.industry_id = i.id WHERE " +
                mysql_i_seller_shop_id_cmd +
                " pi.industry_id IN (?)",
              [extra_filters[index].filter_value]
            );
            filter_industry = filter_product_industry;
            for (
              let index = 0;
              index < finalResult.query_result.length;
              index++
            ) {
              for (let s = 0; s < filter_industry.length; s++) {
                if (
                  finalResult.query_result[index].id ==
                  filter_industry[s].product_id
                ) {
                  result_industry.push(finalResult.query_result[index]);
                  search_result_product_list_industry_tmp.push(
                    filter_industry[s].product_id
                  );
                }
              }
            }
            finalResult.query_result = result_industry;
          }
        } else if (extra_filters[index].filter == "brand") {
          if (extra_filters[index].filter_value != "") {
            const filter_product_brand = await query(
              "SELECT pb.ms_product_id FROM ms_product_manufacturer pb LEFT JOIN ms_manufacturer b ON b.id = pb.ms_manufacturer_id WHERE " +
                mysql_b_seller_shop_id_cmd +
                " pb.ms_manufacturer_id IN (?)",
              [extra_filters[index].filter_value]
            );
            filter_brand = filter_product_brand;
            //console.log(filter_brand);
            for (
              let index = 0;
              index < finalResult.query_result.length;
              index++
            ) {
              for (let s = 0; s < filter_brand.length; s++) {
                if (
                  finalResult.query_result[index].id ==
                  filter_brand[s].ms_product_id
                ) {
                  result_brand.push(finalResult.query_result[index]);
                  search_result_product_list_brand_tmp.push(
                    filter_brand[s].ms_product_id
                  );
                }
              }
            }
            finalResult.query_result = result_brand;
          }
        }
      }
    }

    prod_array_list_for_search_further = [];
    for (i = 0; i < product_list.length; ++i) {
      prod_array_list_for_search_further.push(product_list[i].id);
    }
    //console.log()
    if (prod_array_list_for_search_further.length == 0) {
      prod_array_list_for_search_further = [0];
    }
    //console.log(prod_array_list_for_search_further)
    if (begin_search_type != "search_bar") {
      //console.log("NOT search bar")
      // Khon Kaen code
      if (search_category_from_result) {
        let category_result = [];
        if (search_result_product_list_tmp.length > 0) {
          //console.log("!")
          searchCate = search_result_product_list_tmp;
        } else {
          //console.log("E")
          searchCate = search_result_product_list;
        }

        if (searchCate.length == 0) searchCate.push(0);

        const result_categoryID = await query(
          "SELECT DISTINCT mc.id as category_id ,category_name from ms_category mc LEFT JOIN ms_product_category mpc ON mc.id = mpc.ms_category_id WHERE mpc.ms_product_id IN (?)",
          [prod_array_list_for_search_further]
        );
        finalResult.query_result_category = result_categoryID;
        // --------------old code-------------
        // const result_categoryID = await query("SELECT DISTINCT ms_category_id from `ms_product_category` WHERE ms_product_id IN (?)", [searchCate])
        // if (result_categoryID.length > 0) {
        //     for (let index = 0; index < result_categoryID.length; index++) {
        //         let result_categoryName = await query("SELECT id as category_id ,category_name from `ms_category` WHERE id = (?)", result_categoryID[index].ms_category_id)
        //         category_result.push(result_categoryName[0])
        //     }
        //     finalResult.query_result_category = category_result
        // }
        // --------------old code-------------
      }
      if (search_industry_from_result) {
        let industry_result = [];
        if (search_result_product_list_industry_tmp.length > 0) {
          searchIndustry = search_result_product_list_industry_tmp;
        } else {
          searchIndustry = search_result_product_list;
        }

        if (searchIndustry.length == 0) searchIndustry.push(0);

        const result_industryID = await query(
          "SELECT DISTINCT mi.id as industry_id ,industry_name_th from ms_industry mi LEFT JOIN ms_product_industry mpi ON mi.id = mpi.industry_id WHERE mpi.product_id IN (?)",
          [prod_array_list_for_search_further]
        );
        finalResult.query_result_industry = result_industryID;

        // --------------old code-------------
        // const result_industryID = await query("SELECT DISTINCT industry_id from `ms_product_industry` WHERE product_id IN (?)", [searchIndustry])
        // if (result_industryID.length > 0) {
        //     for (let index = 0; index < result_industryID.length; index++) {
        //         let result_industryName = await query("SELECT id as industry_id ,industry_name_th from `ms_industry` WHERE id = (?)", result_industryID[index].industry_id)
        //         industry_result.push(result_industryName[0])
        //     }
        //     finalResult.query_result_industry = industry_result
        // }
        // --------------old code-------------
      }
      if (search_brand_from_result) {
        let brand_result = [];
        if (search_result_product_list_brand_tmp.length > 0) {
          searchBrand = search_result_product_list_brand_tmp;
        } else {
          searchBrand = search_result_product_list;
        }

        if (searchBrand.length == 0) searchBrand.push(0);

        const result_brandID = await query(
          "SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
          [prod_array_list_for_search_further]
        );
        finalResult.query_result_brand = result_brandID;

        // --------------old code-------------
        // const result_brandID = await query("SELECT DISTINCT ms_manufacturer_id from `ms_product_manufacturer` WHERE ms_product_id IN (?)", [searchBrand])
        // if (result_brandID.length > 0) {
        //     for (let index = 0; index < result_brandID.length; index++) {
        //         let result_brandName = await query("SELECT id as brand_id ,manufacturer_name from `ms_manufacturer` WHERE id = (?)", result_brandID[index].ms_manufacturer_id)
        //         brand_result.push(result_brandName[0])
        //     }
        //     finalResult.query_result_brand = brand_result
        // }
        // --------------old code-------------
      }
    } else {
      //Jack code
      if (
        search_category_from_result ||
        search_industry_from_result ||
        search_brand_from_result
      ) {
        //finalResultParsed = JSON.parse(JSON.stringify( finalResult ))

        //console.log( finalResult )

        // create array of ID first.
        let finalResultIDList = [];
        for (let i = 0; i < finalResult["query_result"].length; ++i) {
          finalResultIDList.push(finalResult["query_result"][i].id);
        }

        //console.log( finalResultIDList )
        if (finalResultIDList.length == 0) {
          finalResultIDList.push(0);
        }

        if (search_category_from_result) {
          finalResult.query_result_category = await query(
            "SELECT DISTINCT pc.ms_category_id, c.category_name, c.category_logo_path from `ms_product_category` pc LEFT JOIN `ms_category` c ON c.id = pc.ms_category_id WHERE pc.ms_product_id IN (?);",
            [finalResultIDList]
          );
        }

        if (search_industry_from_result) {
          finalResult.query_result_industry = await query(
            "SELECT DISTINCT pi.industry_id, i.industry_name_th, i.industry_logo from `ms_product_industry` pi LEFT JOIN `ms_industry` i ON i.id = pi.industry_id WHERE pi.product_id IN (?);",
            [finalResultIDList]
          );
        }

        if (search_brand_from_result) {
          finalResult.query_result_brand = await query(
            "SELECT DISTINCT pb.ms_manufacturer_id, b.manufacturer_name, b.logo_path from `ms_product_manufacturer` pb LEFT JOIN `ms_manufacturer` b ON b.id = pb.ms_manufacturer_id WHERE pb.ms_product_id IN (?);",
            [finalResultIDList]
          );
        }
      }
    }

    let finalId = [];
    let finalSellerShopId = [];

    finalResult.query_result.forEach((r) => {
      finalId.push(r.id);
      finalSellerShopId.push(r.seller_shop_id);
      if (!r.images_URL) r.images_URL = [];
      if (!r.promotion_id) r.promotion_id = [];
    });

    // ใส่รายละเอียดต่างๆลงไปใน query_result Promotion ราคา order
    if (finalResult.query_result.length != 0) {
      // เรียงตาม tb_custom_rules
      let cIndex =
        begin_search_details.custom_user_ID +
        "+" +
        begin_search_details.what_component +
        "+" +
        begin_search_details.component_id;
      const prodArray = await query(
        "SELECT product_array FROM `tb_custom_rule_product_sorted_list` WHERE composite_index = ?",
        cIndex
      );
      let prod_array_to_sort = [];
      if (prodArray && prodArray.length != 0) {
        prod_array_to_sort = JSON.parse(prodArray[0].product_array);
      }
      customSort({
        data: finalResult.query_result,
        sortBy: prod_array_to_sort,
        sortField: "id",
      });
      // เรียงตาม tb_custom_rules

      if (finalId.length == 0) finalId = [0];

      // ใส่ค่า favorite ให้ทุก product
      let userForFav = await isLoginAndGetUser(token);
      let favProductByUser = await findFavByUser(userForFav.user_id, finalId);
      finalResult.query_result.forEach((pd) => {
        if (favProductByUser.includes(pd.id)) {
          pd.isFavorite = true;
        } else {
          pd.isFavorite = false;
        }
      });
      // ใส่ค่า favorite ให้ทุก product

      // ใส่ Promotion ให้ทุก product
      let productIDPromotionId = {};
      let productIDPromotionIdAndHidden = {};
      //console.log(finalId)
      let searchPromotion = await query(
        "SELECT pp.product_id, pp.promotion_id, p.hidden_type FROM ms_product_promotion pp LEFT JOIN ms_promotion p ON p.id = pp.promotion_id WHERE pp.product_id IN (?)",
        [finalId]
      );
      if (searchPromotion.length > 0 && finalResult.query_result.length > 0) {
        for (let j = 0; j < searchPromotion.length; ++j) {
          if (!(searchPromotion[j].product_id in productIDPromotionId)) {
            productIDPromotionId[searchPromotion[j].product_id] = [];
            productIDPromotionIdAndHidden[searchPromotion[j].product_id] = [];
          }
          productIDPromotionId[searchPromotion[j].product_id].push(
            searchPromotion[j].promotion_id
          );
          productIDPromotionIdAndHidden[searchPromotion[j].product_id].push({
            promotion_id: searchPromotion[j].promotion_id,
            hidden_type: searchPromotion[j].hidden_type,
          });
        }

        for (let index = 0; index < finalResult.query_result.length; index++) {
          finalResult.query_result[index].promotion_id =
            productIDPromotionId[finalResult.query_result[index].id];
          finalResult.query_result[index].promotion_id_with_hidden_type =
            productIDPromotionIdAndHidden[finalResult.query_result[index].id];
        }
      }

      // เพิ่มราคาเข้าไปใน product_list
      let user = await isLoginAndGetUser(token);
      let priceByTier = await findProductPriceByUser(
        user.user_id,
        finalId,
        role_user,
        finalSellerShopId
      );
      console.log("priceByTier",priceByTier)
      console.log("productIDPriceId",productIDPriceId)
      let productIDPriceId = {};
      for (let j = 0; j < priceByTier.length; ++j) {
        if (!(priceByTier[j].product_id in productIDPriceId)) {
          productIDPriceId[priceByTier[j].product_id] = [];
        }
        productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
      }

      for (let index = 0; index < finalResult.query_result.length; index++) {
        if (!finalResult.query_result[index].message_status) {
          finalResult.query_result[index].message_status = "no_status";
        }
        try {
          finalResult.query_result[index].real_price =
            productIDPriceId[finalResult.query_result[index].id][0].real_price;
          finalResult.query_result[index].fake_price =
            productIDPriceId[finalResult.query_result[index].id][0].fake_price;
          finalResult.query_result[index].special_price =
            productIDPriceId[finalResult.query_result[index].id][0].special_price;
          finalResult.query_result[index].discount_percent =
            productIDPriceId[finalResult.query_result[index].id][0].discount_percent;
        } catch (e) {
          //console.log(e)
        }
      }

      // kill all duplicates here.
      dup_cleaner_dict = {};
      for (i = 0; i < finalResult.query_result.length; ++i) {
        if (!(finalResult.query_result[i].id in dup_cleaner_dict)) {
          dup_cleaner_dict[finalResult.query_result[i].id] = 0;
          dup_cleaner_final_list.push(finalResult.query_result[i]);
        }
      }

      finalResult.query_result = dup_cleaner_final_list;

      // Order_by_price การเรียงสินค้า หรือ sku มากไปน้อย น้อยไปมาก
      if (order_by_price && order_by_price == "DESC") {
        finalResult.query_result.sort(function (a, b) {
          var A = a.real_price;
          var B = b.real_price;
          if (A > B) {
            return -1;
          }
          if (A < B) {
            return 1;
          }
          // price must be equal
          return 0;
        });
      } else if (order_by_price && order_by_price == "ASC") {
        finalResult.query_result.sort(function (a, b) {
          var A = a.real_price;
          var B = b.real_price;
          if (A < B) {
            return -1;
          }
          if (A > B) {
            return 1;
          }
          // price must be equal
          return 0;
        });
      } else if (order_by_sku && order_by_sku == "DESC") {
        finalResult.query_result.sort(function (a, b) {
          var A = a.sku;
          var B = b.sku;
          if (A > B) {
            return -1;
          }
          if (A < B) {
            return 1;
          }
          // price must be equal
          return 0;
        });
      } else if (order_by_sku && order_by_sku == "ASC") {
        finalResult.query_result.sort(function (a, b) {
          var A = a.sku;
          var B = b.sku;
          if (A < B) {
            return -1;
          }
          if (A > B) {
            return 1;
          }
          // price must be equal
          return 0;
        });
      }
      // Order_by_price การเรียงสินค้า  หรือ sku มากไปน้อย น้อยไปมาก
    }

    //จัดการเกี่ยวหน้า
    if (page_type == "grid") {
      limit = 30;
    } else if (page_type == "layout") {
      limit = 7;
    }

    finalResult.total_page = Math.ceil(finalResult.query_result.length / limit);

    if (finalResult.query_result.length > 0) {
      resultArr = [];
      for (let i = 0; i < finalResult.query_result.length; i++) {
        product_page = Math.ceil(i / limit);
        if (product_page == 0) {
          product_page = 1;
        }
        finalResult.query_result[i].product_page = product_page;
        if (page == product_page) {
          resultArr.push(finalResult.query_result[i]);
        }
      }
      finalResult.query_result = resultArr;
    }

    // ใส่รายละเอียดต่างๆลงไปใน query_result Promotion ราคา order

    timeTaken = Date.now() - timeTaken;
    let logjson = {
      name: logfile,
      parameter: {
        begin_search_type: begin_search_type,
        begin_search_details: begin_search_details,
        extra_filters: extra_filters,
        search_category_from_result: search_category_from_result,
        search_industry_from_result: search_industry_from_result,
        search_brand_from_result: search_brand_from_result,
      },
      status: 200,
      return_data: finalId,
      execution_time: timeTaken,
    };
    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(null, finalResult);
    return;
  } catch (err) {
    let finalId = [];
    if (finalResult && finalResult.query_result)
      finalResult.query_result.forEach((r) => finalId.push(r.id));
    let logjson = {
      name: logfile,
      parameter: {
        begin_search_type: begin_search_type,
        begin_search_details: begin_search_details,
        extra_filters: extra_filters,
        search_category_from_result: search_category_from_result,
        search_industry_from_result: search_industry_from_result,
        search_brand_from_result: search_brand_from_result,
      },
      status: 500,
      message: err.name + ": " + err.message,
      return_data: finalId,
      execution_time: Date.now() - timeTaken,
    };

    if (typeof err === "object" && err.stack) {
      logjson.errstack = err.stack;
    } else {
      logjson.errstack = "";
    }

    logjson = JSON.stringify(logjson);
    ShF_log_to_file(logfile, logjson);
    result(err, null);
    return;
    //return response(500,false,null,"server error")
  }
};

const findFavByUser = async (user_id, product_id_list) => {
  let resultFavArray = [];
  if (user_id && product_id_list) {
    let favorite_product_query = await query(
      "SELECT favorite_product_id FROM `ms_product_user_favorite` WHERE user_id = ?",
      user_id
    );
    if (favorite_product_query.length != 0) {
      resultFavArray = JSON.parse(
        favorite_product_query[0].favorite_product_id
      );
    }
  }
  return resultFavArray || null;
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

module.exports = Product;
