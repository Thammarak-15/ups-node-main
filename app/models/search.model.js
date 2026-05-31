const sql = require("./db.js");
const util = require("util");
// const {parse} = require("path");
// const {json} = require("body-parser");
const {ShF_log_to_file} = require("../share_function/log_file");
// const {Console} = require("console");
// const productBySKU = require("../query/product_by_sku.query");
const he = require("he");
const {Console} = require("console");
const {off} = require("process");

const query = util.promisify(sql.query).bind(sql);

// constructor
const Search = function (Search) {
};

Search.searchBarProduct = async (
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
   limit,
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
   let page_ = parseInt(page);
   let limit_ = parseInt(limit);
   let offset_ = (page_ - 1) * limit_;
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
       if (begin_search_type == "search_bar") {
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

           const countProducts = await query(
               `SELECT COUNT(id) AS count_product FROM ms_product product WHERE product.id IN (?) LIMIT ? OFFSET ?`,
               [id_searchBarResult, limit_, offset_]
           );
           const totalPages = countProducts[0]["count_product"]
               ? Math.ceil(countProducts[0]["count_product"] / limit_)
               : 1;

           //const totalPages = countProducts.length/limit_ ? Math.ceil(countProducts.length/limit_) : 1;

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
               finalResult.totalPages = totalPages;
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
               result({message: "what_component invalid"}, null);
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
               [composite_index]
           );
           //const totalPages = countProducts.length/limit_ ? Math.ceil(countProducts.length/limit_) : 1;

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

               all_product_from_sorted_list = [0];
               original_all_product_from_sorted_list = all_product_from_sorted_list;
           } else {
               all_product_from_sorted_list = JSON.parse(
                   searchComponentResult[0].product_array
               );
               original_all_product_from_sorted_list = all_product_from_sorted_list;
           }
           cateId = begin_search_details.component_id;

           if (begin_search_details.what_component == "category_product") {
               let allProductIdSub = [];
               const searchProductResultSorted = await query(
                   "SELECT hierachy FROM `ms_category` WHERE " +
                   mysql_seller_shop_id_cmd +
                   " id = ?",
                   cateId
               );

               if (searchProductResultSorted.length > 0) {
                   const cateIdSubAll = await query(
                       "SELECT id FROM `ms_category` WHERE " +
                       mysql_seller_shop_id_cmd +
                       " hierachy = ?",
                       searchProductResultSorted[0].hierachy
                   );

                   cateIdSubAll.forEach((c) => {
                       allProductIdSub.push(c.id);
                   });

                   const all_product_from_component = await query(
                       "SELECT ms_product_id FROM `ms_product_category` WHERE ms_category_id IN (?) LIMIT ? OFFSET ?",
                       [allProductIdSub, limit_, offset_]
                   );

                   let countProducts = await query(
                       "SELECT ms_product_id FROM `ms_product_category` WHERE ms_category_id IN (?)",
                       [allProductIdSub]
                   );
                   const totalPages = countProducts
                       ? Math.ceil(countProducts.length / limit_)
                       : 1;

                   if (all_product_from_sorted_list.length > 0) {
                       let CustomProductResult = await query(
                           "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en,short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' LIMIT ? OFFSET ?",
                           [all_product_from_sorted_list, limit_, offset_]
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
                               "SELECT ms_product_id FROM ms_product_category WHERE ms_category_id = ? LIMIT ? OFFSET ?",
                               [begin_search_details.component_id, limit_, offset_]
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

                       for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
                           mySortedList += original_all_product_from_sorted_list[i];

                           if (i < original_all_product_from_sorted_list.length - 1)
                               mySortedList += ",";
                       }
                       try {
                           if (mySortedList != "") {
                               ProductResult = await query(
                                   "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name,name_en, inventory_ratio, stock_count, inventory_stock, description,description_en, short_description, short_description_en, unit,unit_en,stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id, " +
                                   mySortedList +
                                   " ) LIMIT ? OFFSET ?",
                                   [original_all_product_from_sorted_list, limit_, offset_]
                               );
                           } else {
                               ProductResult = await query(
                                   "SELECT m.id, m.seller_shop_id, m.sku,m.message_status, m.have_attribute, m.product_owner, m.unique_custom_product, m.inventory_code, m.name, m.name_en, m.inventory_ratio, m.stock_count, m.inventory_stock, m.description, m.description_en, m.short_description, m.short_description_en, m.stock_status, m.weight, m.volumn, m.product_size, m.shipping_rate, m.created_at, m.updated_at, m.unit, m.unit_en FROM `ms_product` m JOIN `ms_product_category` c ON c.ms_product_id = m.id WHERE m.status = 'active' AND c.ms_category_id = ? ORDER BY m.created_at ASC LIMIT ? OFFSET ?",
                                   [begin_search_details.component_id, limit_, offset_]
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

                           for (i = 0; i < ProductResult.length; ++i) {
                               product_list.push(ProductResult[i]);
                           }
                       }
                   }

                   if (array_product.length > 0) {
                       let ProductResult = await query(
                           "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en, short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at, unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY updated_at ASC",
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

                       ProductResult.forEach((element) => {
                           product_list.push(element);
                       });
                   }
                   finalResult.ok = "y";
                   finalResult.totalPages = totalPages;
                   finalResult.query_result = product_list;
               } else {
                   finalResult.ok = "y";
                   finalResult.totalPages = 1;
                   finalResult.query_result = [];
               }
           } else {
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
                   }
               }
               //else if (
               //  begin_search_details.what_component == "new_product" ||
               //  begin_search_details.what_component == "recommended_product" ||
               //  begin_search_details.what_component == "best_seller"
               //) {
               //  // FOR NEW PRODUCT, RECOMMENDED PRODUCT, BEST SELLER
               //  const searchProductResult = await query(
               //    "SELECT id FROM ms_product WHERE 1 " +
               //      mysql_seller_shop_id_cmd +
               //      " ORDER BY updated_at DESC"
               //  );
               //  if (searchProductResult) {
               //    all_product_from_component = searchProductResult;
               //    finalResult.ok = "y";
               //    for (
               //      let index = 0;
               //      index < all_product_from_sorted_list.length;
               //      index++
               //    ) {
               //      for (let s = 0; s < all_product_from_component.length; s++) {
               //        if (
               //          all_product_from_component[s].ms_product_id ==
               //          all_product_from_sorted_list[index]
               //        ) {
               //          all_product_from_component.splice(s, 1);
               //        }
               //      }
               //    }

               //    for (i = 0; i < all_product_from_component.length; ++i) {
               //      array_product.push(all_product_from_component[i].ms_product_id);
               //      search_result_product_list.push(
               //        all_product_from_component[i].ms_product_id
               //      );
               //    }
               //  }
               //}

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
                           "SELECT m.id, m.seller_shop_id, m.sku,m.message_status, m.have_attribute, m.product_owner, m.unique_custom_product, m.inventory_code, m.name, m.name_en, m.inventory_ratio, m.stock_count, m.inventory_stock, m.description, m.description_en, m.short_description, m.short_description_en, m.stock_status, m.weight, m.volumn, m.product_size, m.shipping_rate, m.created_at, m.updated_at, m.unit, m.unit_en FROM `ms_product` m JOIN `ms_product_industry` i ON i.product_id = m.id WHERE m.status = 'active' AND i.industry_id = ? ORDER BY m.created_at ASC",
                           begin_search_details.component_id
                       );
                   } else if (
                       begin_search_details.what_component == "brand_product" &&
                       mySortedList == ""
                   ) {
                       ProductResult = await query(
                           "SELECT m.id, m.seller_shop_id, m.sku,m.message_status, m.have_attribute, m.product_owner, m.unique_custom_product, m.inventory_code, m.name,m.name_en, m.inventory_ratio, m.stock_count, m.inventory_stock, m.description,m.description_en, m.short_description,m.short_description_en, m.stock_status, m.weight, m.volumn, m.product_size, m.shipping_rate, m.created_at, m.updated_at, m.unit, m.unit_en FROM `ms_product` m JOIN `ms_product_manufacturer` b ON b.ms_product_id = m.id WHERE m.status = 'active' AND b.ms_manufacturer_id = ? ORDER BY m.created_at ASC",
                           begin_search_details.component_id
                       );
                   } else {
                       ProductResult = await query(
                           "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name,name_en, inventory_ratio, stock_count, inventory_stock, description, description_en,short_description,short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id, " +
                           mySortedList +
                           " )",
                           [original_all_product_from_sorted_list]
                       );
                   }

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

                       for (i = 0; i < ProductResult.length; ++i) {
                           product_list.push(ProductResult[i]);
                       }
                   }
               }

               new_search_result_product_list = [];
               dict_nogoin = {};
               for (i = 0; i < original_all_product_from_sorted_list.length; ++i) {
                   new_search_result_product_list.push(
                       original_all_product_from_sorted_list[i]
                   );
                   dict_nogoin[original_all_product_from_sorted_list[i]] = 0;
               }
               if (begin_search_details.what_component === "brand_product") {
                   var getProductBrand = await query(
                       `SELECT ms_product.id FROM ms_product JOIN ms_product_manufacturer ON ms_product_manufacturer.ms_product_id = ms_product.id WHERE ms_product_manufacturer.ms_manufacturer_id = ? AND ms_product.status = 'active'`,
                       begin_search_details.component_id
                   );
                   original_all_product_from_sorted_list = [];
                   for (i = 0; i < getProductBrand.length; i++) {
                       original_all_product_from_sorted_list.push(getProductBrand[i].id);
                   }
               }
               for (i = 0; i < search_result_product_list.length; ++i) {
                   if (
                       !(search_result_product_list[i] in dict_nogoin) &&
                       original_all_product_from_sorted_list.includes(
                           search_result_product_list[i]
                       )
                   ) {
                       new_search_result_product_list.push(search_result_product_list[i]);
                   }
               }

               search_result_product_list = new_search_result_product_list;
               // for remaining products.
               if (search_result_product_list.length > 0) {
                   const ProductResult = await query(
                       "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, description, description_en,short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at, unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY updated_at ASC",
                       [search_result_product_list]
                   );

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

                       for (i = 0; i < ProductResult.length; ++i) {
                           product_list.push(ProductResult[i]);
                       }
                   }
               }
               finalResult.query_result = product_list;
           }
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
               let xx = [];
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
                       let result_allBrand_category = await query(
                           "SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
                           [finalResultIDList_category_product]
                       );
                       finalResult.query_all_brand = result_allBrand_category;
                   }
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
                           "SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
                           [finalResultIDListIndustry]
                       );
                       finalResult.query_all_brand = result_allBrand_Industry;
                   }
                   //----------------- New code ----------------- //
               }
           }
       }
       prod_array_list_for_search_further = [];
       for (i = 0; i < product_list.length; ++i) {
           prod_array_list_for_search_further.push(product_list[i].id);
       }

       if (prod_array_list_for_search_further.length == 0) {
           prod_array_list_for_search_further = [0];
       }

       if (begin_search_type != "search_bar") {
           if (search_category_from_result) {
               let finalResultIDList = [];
               for (let i = 0; i < finalResult["query_result"].length; ++i) {
                   finalResultIDList.push(finalResult["query_result"][i].id);
               }
               if (finalResultIDList.length == 0) {
                   finalResultIDList.push(0);
               }

               const result_categoryID = await query(
                   "SELECT DISTINCT mc.id as category_id ,category_name from ms_category mc LEFT JOIN ms_product_category mpc ON mc.id = mpc.ms_category_id WHERE mpc.ms_product_id IN (?) AND mc.hierachy NOT LIKE '%\\_%' ",
                   [finalResultIDList]
               );
               finalResult.query_result_category = result_categoryID;
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
                   [searchIndustry]
               );
               finalResult.query_result_industry = result_industryID;
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
                   "SELECT DISTINCT mm.id as brand_id ,manufacturer_name from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
                   [finalResultIDList]
               );
               finalResult.query_result_brand = result_brandID;
           }
       } else {
           //Jack code
           if (
               search_category_from_result ||
               search_industry_from_result ||
               search_brand_from_result
           ) {
               let finalResultIDList = [];
               for (let i = 0; i < finalResult["query_result"].length; ++i) {
                   finalResultIDList.push(finalResult["query_result"][i].id);
               }
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
                       "SELECT p.ms_product_id, p.ms_category_id, c.category_name FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id = ? AND p.ms_category_id = ?",
                       [id, begin_search_details.component_id]
                   );
               } else {
                   category = await query(
                       "SELECT p.ms_product_id, p.ms_category_id, c.category_name FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id = ?",
                       id
                   );
               }
               finalResult.query_result[index].category_name =
                   category[0]?.category_name;
               let brand = await query(
                   "SELECT p.ms_product_id, p.ms_manufacturer_id, m.manufacturer_name FROM `ms_product_manufacturer` p JOIN `ms_manufacturer` m ON p.ms_manufacturer_id = m.id WHERE p.ms_product_id = ?",
                   id
               );
               finalResult.query_result[index].brand_name =
                   brand[0]?.manufacturer_name;
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
                  finalResult.query_result[index].max_discount =
                       productIDPriceId[finalResult.query_result[index].id][0].max_discount;
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

Search.searchProduct = async (req, result) => {
   let timeTaken = Date.now();
   let logfile = "searchallproducthomepage.log";
   let logjson = {};
   let all_product_from_sorted_list;
   let finalResult = {};
   let finalId = [];
   let finalSellerShopId = [];
   const page = parseInt(req.page);
   const limit = parseInt(req.limit);
   const offset = (page - 1) * limit;
   try {
       if (req.begin_search_type === "component") {
           if (
               req.begin_search_details.what_component !== "best_seller" &&
               req.begin_search_details.what_component !== "new_product" &&
               req.begin_search_details.what_component !== "recommended_product" &&
               req.begin_search_details.what_component !== "category_product"
           ) {
               logjson = {
                   name: logfile,
                   parameter: {
                       begin_search_type: req.begin_search_type,
                       begin_search_details: req.begin_search_details,
                       role_user: req.role_user,
                   },
               };
               logjson.status = 400;
               logjson.return_data = "";
               logjson.execution_time = Date.now() - timeTaken;
               logjson = JSON.stringify(logjson);
               ShF_log_to_file(logfile, logjson);
               result({message: "what_component invalid"}, null);
               return;
           }
       } else {
           logjson = {
               name: logfile,
               parameter: {
                   begin_search_type: req.begin_search_type,
                   begin_search_details: req.begin_search_details,
                   role_user: req.role_user,
               },
           };
           logjson.status = 400;
           logjson.return_data = "";
           logjson.execution_time = Date.now() - timeTaken;
           logjson = JSON.stringify(logjson);
           ShF_log_to_file(logfile, logjson);
           result({message: "begin_search_type invalid"}, null);
           return;
       }
       let composite_index =
           req.begin_search_details.custom_user_ID +
           "+" +
           req.begin_search_details.what_component +
           "+" +
           req.begin_search_details.component_id;

       const searchComponentResult = await query(
           "SELECT product_array,component_ID FROM `tb_custom_rule_product_sorted_list` WHERE composite_index = ?",
           composite_index
       );
       if (searchComponentResult.length == 0) {
           all_product_from_sorted_list = [0];
       } else {
           all_product_from_sorted_list = JSON.parse(
               searchComponentResult[0].product_array
           );
       }
       let products = await query(
           `SELECT product.id, product.seller_shop_id, product.sku, product.message_status, product.have_attribute
   ,product.product_owner, product.unique_custom_product, product.inventory_code, product.name, product.name_en, product.inventory_ratio
   ,product.stock_count, product.inventory_stock, IF(product.description, null, null) as description,IF(product.description_en, null, null) as description_en, product.short_description, product.short_description_en, product.stock_status
   ,product.weight, product.volumn, product.product_size, product.shipping_rate
   ,GROUP_CONCAT(image.media_path) AS images_URL,product.status
   FROM ms_product product
   JOIN ms_product_image_vdo image ON image.product_id = product.id AND image.seller_shop_id = product.seller_shop_id AND image.media_type = 'image' AND image.index = 0
   WHERE product.id IN (?) and product.status = 'active'
   GROUP BY product.id
   ORDER BY FIELD(product.id, ?)
   LIMIT ? OFFSET ?`,
           [
               all_product_from_sorted_list,
               all_product_from_sorted_list,
               limit,
               offset,
           ]
       );
       const countProducts = await query(
           `SELECT COUNT(id) AS count_product FROM ms_product product WHERE product.id IN (?)`,
           [all_product_from_sorted_list]
       );
       const totalPages = countProducts[0]["count_product"]
           ? Math.ceil(countProducts[0]["count_product"] / limit)
           : 1;
       const star = await query(
           "SELECT total_rating,product_id FROM tb_product_rating_average WHERE product_id in (?)",
           [all_product_from_sorted_list]
       );
       const category = await query(
           "SELECT p.ms_product_id, p.ms_category_id, c.category_name,c.category_name_en FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id IN (?)",
           [all_product_from_sorted_list]
       );
       const brand = await query(
           "SELECT p.ms_product_id, p.ms_manufacturer_id, m.manufacturer_name FROM `ms_product_manufacturer` p JOIN `ms_manufacturer` m ON p.ms_manufacturer_id = m.id WHERE p.ms_product_id IN (?)",
           [all_product_from_sorted_list]
       );
       for (let i = 0; i < products.length; i++) {
           const filterStars = await star.filter(
               (s) => s.product_id == products[i].id
           );
           const filterCategory = await category.filter(
               (cat) => cat.ms_product_id == products[i].id
           );
           const filterBrand = await brand.filter(
               (b) => b.ms_product_id == products[i].id
           );
           let elementProduct = products[i];
           let images = elementProduct["images_URL"]
               ? elementProduct["images_URL"]
               : "";
           let imagesArray = images.split(",");
           for (let j = 0; j < imagesArray.length; j++) {
               imagesArray[j] = process.env.IMAGE_PATH + imagesArray[j];
           }
           elementProduct["images_URL"] = imagesArray;
           finalId.push(products[i].id);
           finalSellerShopId.push(products[i].seller_shop_id);
           if (!products[i].images_URL) products[i].images_URL = [];
           //start เพิ่ม promotion_id //
           if (!products[i].promotion_id) products[i].promotion_id = [];
           //end เพิ่ม promotion_id //
           //start เพิ่ม star //
           if (filterStars[0] === undefined || filterStars[0].total_rating < 1) {
               products[i].stars = 0;
           } else {
               products[i].stars = filterStars[0].total_rating;
           }
           //end เพิ่ม star //
           //start เพิ่ม category //
           products[i].category_name = filterCategory[0].category_name;
           //end เพิ่ม category //
           //start เพิ่ม brand_name //
           products[i].brand_name = filterBrand[0].manufacturer_name;
           //end เพิ่ม brand_name //
       }

       //start ใส่ค่า favorite ให้ทุก product
       let userForFav = await isLoginAndGetUser(req.token);
       let favProductByUser = await findFavByUser(userForFav.user_id, finalId);
       products.forEach((fav) => {
           if (favProductByUser.includes(fav.id)) {
               fav.isFavorite = true;
           } else {
               fav.isFavorite = false;
           }
       });
       // end ใส่ค่า favorite ให้ทุก product
       //start ใส่ค่า promotion//
       let productIDPromotionId = {};
       let productIDPromotionIdAndHidden = {};
       let searchPromotion = await query(
           "SELECT pp.product_id, pp.promotion_id, p.hidden_type FROM ms_product_promotion pp LEFT JOIN ms_promotion p ON p.id = pp.promotion_id WHERE pp.product_id IN (?)",
           [finalId]
       );
       if (searchPromotion.length > 0 && products.length > 0) {
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
           for (let index = 0; index < products.length; index++) {
               products[index].promotion_id = productIDPromotionId[products[index].id];
               products[index].promotion_id_with_hidden_type =
                   productIDPromotionIdAndHidden[products[index].id];
           }
       }
       //end ใส่ค่า promotion//

       // start เพิ่มราคาเข้าไปใน product_list //
       let user = await isLoginAndGetUser(req.token);
       let priceByTier = await findProductPriceByUser(
           user.user_id,
           finalId,
           req.role_user,
           finalSellerShopId
       );
       let productIDPriceId = {};
       for (let j = 0; j < priceByTier.length; ++j) {
           if (!(priceByTier[j].product_id in productIDPriceId)) {
               productIDPriceId[priceByTier[j].product_id] = [];
           }
           productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
       }

       for (let index = 0; index < products.length; index++) {
           if (!products[index].message_status) {
               products[index].message_status = "no_status";
           }
           products[index].real_price =
               productIDPriceId[products[index].id][0].real_price;
           products[index].fake_price =
               productIDPriceId[products[index].id][0].fake_price;
           products[index].special_price =
               productIDPriceId[products[index].id][0].special_price;
           products[index].discount_percent =
               productIDPriceId[products[index].id][0].discount_percent;
            products[index].max_discount =
               productIDPriceId[products[index].id][0].max_discount;
       }
       //end เพิ่มราคาเข้าไปใน product_list
       finalResult.ok = "y";
       finalResult.totalPages = totalPages;
       finalResult.query_result = products;
       logjson.status = 200;
       logjson.return_data = "";
       logjson.execution_time = Date.now() - timeTaken;
       logjson.message = "success";
       logjson = JSON.stringify(logjson);
       ShF_log_to_file(logfile, logjson);
       return result(null, finalResult);
   } catch (err) {
       logjson.status = 500;
       logjson.return_data = "";
       logjson.execution_time = Date.now() - timeTaken;
       logjson.message = err.name + ": " + err.message;
       logjson = JSON.stringify(logjson);
       ShF_log_to_file(logfile, logjson);
       result(err, null);
       return;
   }
};

const isLoginAndGetUser = async (token) => {
    if (token) {
        let checkUserLogin = await query(
            "SELECT user_id FROM token WHERE access_token = ?",
            token
        );
        if (checkUserLogin.length != 0) {
            return {checkUserLogin: true, user_id: checkUserLogin[0].user_id};
        } else {
            return {checkUserLogin: true, user_id: ""};
        }
    } else {
        return {checkUserLogin: false, user_id: ""};
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

            let seller_id_array = [];
            let tier_shop_array = [];
            getTier.forEach((gt) => {
                seller_id_array.push(gt.seller_com_id);
                tier_shop_array.push({shop: gt.seller_com_id, tier: gt.f_price_tier});
            });

            if (getTier.length != 0) {
                let searchSpecialPrice = [];
                let searchRealPrice = [];
                let allProductPriceArray = [];
                searchRealPrice = await query(
                    `SELECT DISTINCT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price`,
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
                    `SELECT a.ms_product_id,a.real_price,a.fake_price,a.discount_percent,b.max_discount
                    FROM (SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent
                    FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price) AS a
                    JOIN (SELECT ms_product_id,MAX(discount_percent) AS max_discount FROM ms_product_price
                    WHERE ms_product_id IN (?) GROUP BY ms_product_id) AS b
                    ON a.ms_product_id=b.ms_product_id order by real_price`,
                    [product_id_list,product_id_list]
                );
            }
        } else {
            searchProductPriceByUser = await query(
                `SELECT a.ms_product_id,a.real_price,a.fake_price,a.discount_percent,b.max_discount
                FROM (SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent
                FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price) AS a
                JOIN (SELECT ms_product_id,MAX(discount_percent) AS max_discount FROM ms_product_price
                WHERE ms_product_id IN (?) GROUP BY ms_product_id) AS b
                ON a.ms_product_id=b.ms_product_id order by real_price`,
                [product_id_list,product_id_list]
            );
        }
    } else {
        searchProductPriceByUser = await query(
            `SELECT a.ms_product_id,a.real_price,a.fake_price,a.discount_percent,b.max_discount
            FROM (SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent
            FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price) AS a
            JOIN (SELECT ms_product_id,MAX(discount_percent) AS max_discount FROM ms_product_price
            WHERE ms_product_id IN (?) GROUP BY ms_product_id) AS b
            ON a.ms_product_id=b.ms_product_id order by real_price`,
            [product_id_list,product_id_list]
        );
    }
    //`SELECT ms_product_id,price_fix_0 as real_price,fake_price as fake_price,discount_percent FROM ms_product_price WHERE ms_product_id IN (?) ORDER BY real_price`
    searchProductPriceByUser.forEach((p) => {
        ResultProductPriceByUser.push({
            product_id: p.ms_product_id,
            real_price: p.real_price,
            fake_price: p.fake_price,
            special_price: p.special_price ? p.special_price : "",
            discount_percent: p.discount_percent,
            max_discount: p.max_discount
        });
        //start ลด code errorค่อยเปิดกลับมา//
        // if (p.special_price) {
        //   ResultProductPriceByUser.push({
        //     product_id: p.ms_product_id,
        //     real_price: p.real_price,
        //     fake_price: p.fake_price,
        //     special_price: p.special_price,
        //     discount_percent: p.discount_percent,
        //   });
        // } else {
        //   ResultProductPriceByUser.push({
        //     product_id: p.ms_product_id,
        //     real_price: p.real_price,
        //     fake_price: p.fake_price,
        //     special_price: "",
        //     discount_percent: p.discount_percent,
        //   });
        // }
        //end ลด code errorค่อยเปิดกลับมา//
    });
    return ResultProductPriceByUser || null;
};
const customSort = ({data, sortBy, sortField}) => {
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

function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
}

// <==============================================================>
Search.searchBarProductnew = async (
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
    limit,
    result
) => {
    let timeTaken = Date.now();
    let finalResult = {};
    let original_all_product_from_sorted_list = {};
    let search_result_product_list = [];
    let search_result_product_list_tmp = [];
    let search_result_product_list_industry_tmp = [];
    let search_result_product_list_brand_tmp = [];
    let all_product_from_sorted_list_tmp = [];
    let all_product_list = [];
    let product_list = [];
    let dup_cleaner_final_list = [];
    let all_product_from_sorted_list;
    let logfile = "searchFunc.log";
    let mysql_seller_shop_id_cmd = "";
    let mysql_p_seller_shop_id_cmd = "";
    let mysql_i_seller_shop_id_cmd = "";
    let mysql_b_seller_shop_id_cmd = "";
    let page_ = parseInt(page);
    let limit_ = parseInt(limit);
    let endIndex = page * limit
    // let offset = (page_ - 1) * limit_;
    let startIndex = (page_ - 1) * limit_;
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
        if (begin_search_type == "search_bar") {
            try {
                let searchBarResult = await query(
                    "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, IF(description, null, null) as description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at ,short_description_en,name_en,unit,unit_en FROM `ms_product` WHERE (status = 'active' AND name LIKE ?) OR (status = 'active' AND sku LIKE ?) OR (status = 'active' AND description LIKE ?) OR (status = 'active' AND description_en LIKE ?) OR (status = 'active' AND short_description LIKE ?) OR (status = 'active' AND name_en LIKE ?) OR (status = 'active' AND short_description_en LIKE ?) OR id IN (SELECT mp.id FROM `ms_product` mp JOIN tb_tag_product_join ttpj ON ttpj.product_ID = mp.id JOIN tb_tag tt ON ttpj.tag_ID = tt.id WHERE mp.status = 'active' AND tt.name LIKE ?) OR id IN (SELECT mp.id FROM `ms_product` mp JOIN ms_product_attribute mpa ON mpa.product_id = mp.id WHERE mp.status = 'active' AND mpa.new_sku LIKE ?)  ORDER BY updated_at DESC",
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
                let check_product = await query(`SELECT ms_product.id as id FROM ms_product
      INNER JOIN ms_product_category on ms_product.id = ms_product_category.ms_product_id
      LEFT JOIN ms_product_industry on ms_product.id = ms_product_industry.product_id
      INNER JOIN ms_product_price on ms_product.id = ms_product_price.ms_product_id
      INNER JOIN ms_product_manufacturer on ms_product.id = ms_product_manufacturer.ms_product_id
      where ms_product.id IN (?)
      GROUP BY id`, [id_searchBarResult])
                let Check_product_array = []
                check_product.map((val) => Check_product_array.push(val.id))
                let findproductNotPrice =
                    searchBarResult.filter(
                        (el) => {
                            return Check_product_array.includes(el.id)
                        })
                let check_product_haveAttribute = await query(`SELECT ms_product.id FROM ms_product INNER JOIN ms_product_attribute on ms_product.id = ms_product_attribute.product_id`)
                let Check_product_haveAttribute_array = []
                check_product_haveAttribute.map((val) => Check_product_haveAttribute_array.push(val.id))
                let findproductnoAttribute =
                    findproductNotPrice.filter(
                        (el) => {
                            if (el.have_attribute === 'yes') {
                                return Check_product_haveAttribute_array.includes(el.id)
                            } else {
                                return !Check_product_haveAttribute_array.includes(el.id)
                            }
                        })
                findproductNotPrice = findproductnoAttribute
                // console.log(Product_price_array.length)
                // console.log(findproductNotPrice)
                // console.log(id_searchBarResult.length)
                // // let id_searchBarResultAllId = searchBarResultAllId.map((value) => value.id);
                // if (id_searchBarResult.length == 0) {
                //   id_searchBarResult = [0];
                // }
                // const countProducts = await query(
                //   `SELECT COUNT(id) AS count_product FROM ms_product product WHERE product.id IN (?)`,
                //   [id_searchBarResultAll]
                // );
                // const totalPages = searchBarResultAllId
                //   ? Math.ceil(searchBarResultAllId.length / limit_)
                //   : 1;

                // let searchURLImg = await query(
                //   "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND `media_type` = 'image' ORDER BY `index` ASC",
                //   [id_searchBarResult]
                // );
                // // URL = [];
                // productIDImageURL = {};
                // if (searchURLImg.length > 0 && searchBarResult.length > 0) {
                //   for (let j = 0; j < searchURLImg.length; ++j) {
                //     if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                //       productIDImageURL[searchURLImg[j].ms_product_id] = [];
                //     }
                //     productIDImageURL[searchURLImg[j].ms_product_id].push(
                //       process.env.IMAGE_PATH + searchURLImg[j].URL
                //     );
                //   }
                //   for (let index = 0; index < searchBarResult.length; index++) {
                //     searchBarResult[index].images_URL =
                //       productIDImageURL[searchBarResult[index].id];
                //   }
                // }
                var query_result_remove_html = [];
                newskudict = {};
                var result_by_new_sku = await query(
                    "SELECT mp.id FROM `ms_product` mp JOIN ms_product_attribute mpa ON mpa.product_id = mp.id WHERE mp.status = 'active' AND mpa.new_sku LIKE ?",
                    `%${begin_search_details.keyword}%`
                );
                for (let index = 0; index < result_by_new_sku.length; index++) {
                    newskudict[result_by_new_sku[index].id] = 0;
                }
                for (let index = 0; index < findproductNotPrice.length; index++) {
                    // let html =
                    //     findproductNotPrice[index].description == null
                    //         ? ""
                    //         : findproductNotPrice[index].description;
                    // let stripedHtml = html.replace(/<[^>]+>/g, "");
                    // var decodedStripedHtml = he.decode(stripedHtml);
                    if (
                        // decodedStripedHtml
                        //     .toLowerCase()
                        //     .includes(begin_search_details.keyword.toLowerCase()) ||
                        (findproductNotPrice[index].name === null
                            ? 0
                            : findproductNotPrice[index].name
                                .toLowerCase()
                                .includes(begin_search_details.keyword.toLowerCase())) ||
                        (findproductNotPrice[index].name_en === null
                          ? 0
                          : findproductNotPrice[index].name_en
                              .toLowerCase()
                              .includes(begin_search_details.keyword.toLowerCase())) ||
                        (findproductNotPrice[index].sku === null
                            ? 0
                            : findproductNotPrice[index].sku
                                .toLowerCase()
                                .includes(begin_search_details.keyword.toLowerCase())) ||
                        (findproductNotPrice[index].short_description === null
                            ? 0
                            : findproductNotPrice[index].short_description
                                .toLowerCase()
                                .includes(begin_search_details.keyword.toLowerCase())) ||
                        (findproductNotPrice[index].short_description_en === null
                          ? 0
                          : findproductNotPrice[index].short_description_en
                              .toLowerCase()
                              .includes(begin_search_details.keyword.toLowerCase())) ||
                        typeof newskudict[findproductNotPrice[index].id] !== "undefined"
                    ) {
                        query_result_remove_html.push(findproductNotPrice[index]);
                    }
                }
                finalResult.ok = "y";
                finalResult.query_result = query_result_remove_html
            } catch (err) {
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
                    execution_time: Date.now() - timeTaken,
                };
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
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
                result({message: "what_component invalid"}, null);
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
                original_all_product_from_sorted_list = [0];
            } else {
                original_all_product_from_sorted_list = JSON.parse(
                    searchComponentResult[0].product_array
                );
            }
            cateId = begin_search_details.component_id;

            if (begin_search_details.what_component == "category_product") {
                try {
                    if (original_all_product_from_sorted_list.length > 0) {
                        var product_in_cate = await query(
                            `SELECT p.id,p.updated_at,p.status FROM ms_product p LEFT JOIN ms_product_category c on p.id = c.ms_product_id  WHERE ms_category_id = ?
                   AND p.status = 'active' AND p.seller_shop_id = ? ORDER BY p.updated_at ASC , p.id `,
                            [begin_search_details.component_id, seller_shop_id]
                        );
                        // console.log(product_in_cate)
                        let data = product_in_cate.filter(
                            (val) => !original_all_product_from_sorted_list.includes(val.id)
                        );
                        data.map((val) => original_all_product_from_sorted_list.push(val.id));
                        let ProductResult = await query(
                            "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name,name_en, inventory_ratio, stock_count, inventory_stock, IF(description, null, null) as description,IF(description_en, null, null) as description_en, short_description, short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                            [
                                original_all_product_from_sorted_list,
                                original_all_product_from_sorted_list,
                            ]
                        );
                        let id_ProductResult = ProductResult.map((val) => val.id)
                        if (id_ProductResult.length == 0)
                            id_ProductResult = [0];
                        let check_product = await query(`SELECT ms_product.id as id FROM ms_product
        INNER JOIN ms_product_category on ms_product.id = ms_product_category.ms_product_id
        LEFT JOIN ms_product_industry on ms_product.id = ms_product_industry.product_id
        INNER JOIN ms_product_price on ms_product.id = ms_product_price.ms_product_id
        INNER JOIN ms_product_manufacturer on ms_product.id = ms_product_manufacturer.ms_product_id
        where ms_product.id IN (?)
        GROUP BY id`, [id_ProductResult])
                        let Check_product_array = []
                        check_product.map((val) => Check_product_array.push(val.id))
                        ProductResult = ProductResult.filter((el) => {
                            return Check_product_array.includes(el.id)
                        })
                        let check_product_haveAttribute = await query(`SELECT ms_product.id FROM ms_product INNER JOIN ms_product_attribute on ms_product.id = ms_product_attribute.product_id`)
                        let Check_product_haveAttribute_array = []
                        check_product_haveAttribute.map((val) => Check_product_haveAttribute_array.push(val.id))
                        ProductResult = ProductResult.filter(
                            (el) => {
                                if (el.have_attribute === 'yes') {
                                    return Check_product_haveAttribute_array.includes(el.id)
                                } else {
                                    return !Check_product_haveAttribute_array.includes(el.id)
                                }
                            })
                        // customSort({
                        //   data: ProductResult,
                        //   sortBy: original_all_product_from_sorted_list,
                        //   sortField: "id",
                        // });
                        //   console.log(ProductResult)
                        // all_product_list = await query(
                        //   "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                        //   [
                        //     original_all_product_from_sorted_list,
                        //     original_all_product_from_sorted_list,
                        //   ]
                        // );
                        // totalPages = original_all_product_from_sorted_list
                        //   ? Math.ceil(original_all_product_from_sorted_list.length / limit_)
                        //   : 1;
                        // product_list = ProductResult;
                        // finalResult.totalPages = totalPages;
                        finalResult.ok = "y";
                        finalResult.query_result = ProductResult; //category//
                    }
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            } else if (begin_search_details.what_component === "promotion") {
                try {
                    var product_in_promotion = await query(
                        `SELECT p.id,p.updated_at,p.status FROM ms_product p LEFT JOIN ms_product_promotion pm on p.id = pm.product_id  WHERE promotion_id = ?
                   AND p.status = 'active' AND  p.seller_shop_id = ? ORDER BY p.updated_at ASC , p.id`,
                        [begin_search_details.component_id, seller_shop_id]
                    );
                    let data = product_in_promotion.filter(
                        (val) => !original_all_product_from_sorted_list.includes(val.id)
                    );
                    data.map((val) => original_all_product_from_sorted_list.push(val.id));
                    let ProductResult = await query(
                        "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, name_en, inventory_ratio, stock_count, inventory_stock, IF(description, null, null) as description,IF(description_en, null, null) as description_en, short_description,short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                        [
                            original_all_product_from_sorted_list,
                            original_all_product_from_sorted_list,
                        ]
                    );
                    let id_ProductResult = ProductResult.map((val) => val.id)
                    if (id_ProductResult.length == 0)
                        id_ProductResult = [0];
                    let check_product = await query(`SELECT ms_product.id as id FROM ms_product
          INNER JOIN ms_product_category on ms_product.id = ms_product_category.ms_product_id
          LEFT JOIN ms_product_industry on ms_product.id = ms_product_industry.product_id
          INNER JOIN ms_product_price on ms_product.id = ms_product_price.ms_product_id
          INNER JOIN ms_product_manufacturer on ms_product.id = ms_product_manufacturer.ms_product_id
          where ms_product.id IN (?)
          GROUP BY id`, [id_ProductResult])
                    let Check_product_array = []
                    check_product.map((val) => Check_product_array.push(val.id))
                    ProductResult = ProductResult.filter((el) => {
                        return Check_product_array.includes(el.id)
                    })
                    let check_product_haveAttribute = await query(`SELECT ms_product.id FROM ms_product INNER JOIN ms_product_attribute on ms_product.id = ms_product_attribute.product_id`)
                    let Check_product_haveAttribute_array = []
                    check_product_haveAttribute.map((val) => Check_product_haveAttribute_array.push(val.id))
                    ProductResult = ProductResult.filter(
                        (el) => {
                            if (el.have_attribute === 'yes') {
                                return Check_product_haveAttribute_array.includes(el.id)
                            } else {
                                return !Check_product_haveAttribute_array.includes(el.id)
                            }
                        })
                    //   all_product_list = await query(
                    //   "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                    //   [
                    //     original_all_product_from_sorted_list,
                    //     original_all_product_from_sorted_list,
                    //   ]
                    // );
                    // totalPages = original_all_product_from_sorted_list
                    //   ? Math.ceil(original_all_product_from_sorted_list.length / limit_)
                    //   : 1;
                    // product_list = ProductResult;
                    finalResult.ok = "y";
                    finalResult.query_result = ProductResult;
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            } else if (begin_search_details.what_component === "industry_product") {
                try {
                    var product_in_industry = await query(
                        `SELECT p.id,p.updated_at,p.status FROM ms_product p LEFT JOIN ms_product_industry i on p.id = i.product_id  WHERE industry_id = ?
                   AND p.status = 'active' AND  p.seller_shop_id = ? ORDER BY p.updated_at ASC , p.id`,
                        [begin_search_details.component_id, seller_shop_id]
                    );
                    let data = product_in_industry.filter(
                        (val) => !original_all_product_from_sorted_list.includes(val.id)
                    );
                    data.map((val) => original_all_product_from_sorted_list.push(val.id));
                    let ProductResult = await query(
                        "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name,name_en, inventory_ratio, stock_count, inventory_stock, IF(description, null, null) as description,IF(description_en, null, null) as description_en, short_description,short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                        [
                            original_all_product_from_sorted_list,
                            original_all_product_from_sorted_list,
                        ]
                    );
                    let id_ProductResult = ProductResult.map((val) => val.id)
                    if (id_ProductResult.length == 0)
                        id_ProductResult = [0];
                    let check_product = await query(`SELECT ms_product.id as id FROM ms_product
          INNER JOIN ms_product_category on ms_product.id = ms_product_category.ms_product_id
          LEFT JOIN ms_product_industry on ms_product.id = ms_product_industry.product_id
          INNER JOIN ms_product_price on ms_product.id = ms_product_price.ms_product_id
          INNER JOIN ms_product_manufacturer on ms_product.id = ms_product_manufacturer.ms_product_id
          where ms_product.id IN (?)
          GROUP BY id`, [id_ProductResult])
                    let Check_product_array = []
                    check_product.map((val) => Check_product_array.push(val.id))
                    ProductResult = ProductResult.filter((el) => {
                        return Check_product_array.includes(el.id)
                    })
                    let check_product_haveAttribute = await query(`SELECT ms_product.id FROM ms_product INNER JOIN ms_product_attribute on ms_product.id = ms_product_attribute.product_id`)
                    let Check_product_haveAttribute_array = []
                    check_product_haveAttribute.map((val) => Check_product_haveAttribute_array.push(val.id))
                    ProductResult = ProductResult.filter(
                        (el) => {
                            if (el.have_attribute === 'yes') {
                                return Check_product_haveAttribute_array.includes(el.id)
                            } else {
                                return !Check_product_haveAttribute_array.includes(el.id)
                            }
                        })
                    //  all_product_list = await query(
                    //   "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                    //   [
                    //     original_all_product_from_sorted_list,
                    //     original_all_product_from_sorted_list,
                    //   ]
                    // );
                    // totalPages = original_all_product_from_sorted_list
                    //   ? Math.ceil(original_all_product_from_sorted_list.length / limit_)
                    //   : 1;
                    // product_list = ProductResult;
                    // finalResult.ok = "y";
                    // finalResult.totalPages = totalPages;
                    finalResult.ok = "y";
                    finalResult.query_result = ProductResult;
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            } else if (begin_search_details.what_component == "brand_product") {
                try {
                    var product_brand = await query(
                        `SELECT p.id,p.updated_at,p.status FROM ms_product p LEFT JOIN ms_product_manufacturer b on p.id = b.ms_product_id  WHERE ms_manufacturer_id = ?
                  AND p.status = 'active' AND p.seller_shop_id = ? ORDER BY p.updated_at ASC , p.id`,
                        [begin_search_details.component_id, seller_shop_id]
                    );
                    let data = product_brand.filter(
                        (val) => !original_all_product_from_sorted_list.includes(val.id)
                    );
                    data.map((val) => original_all_product_from_sorted_list.push(val.id));
                    let ProductResult = await query(
                        "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name,name_en, inventory_ratio, stock_count, inventory_stock, IF(description, null, null) as description,IF(description_en, null, null) as description_en, short_description,short_description_en, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at,unit,unit_en FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                        [
                            original_all_product_from_sorted_list,
                            original_all_product_from_sorted_list,
                        ]
                    );
                    let id_ProductResult = ProductResult.map((val) => val.id)
                    if (id_ProductResult.length == 0)
                        id_ProductResult = [0];
                    let check_product = await query(`SELECT ms_product.id as id FROM ms_product
          INNER JOIN ms_product_category on ms_product.id = ms_product_category.ms_product_id
          LEFT JOIN ms_product_industry on ms_product.id = ms_product_industry.product_id
          INNER JOIN ms_product_price on ms_product.id = ms_product_price.ms_product_id
          INNER JOIN ms_product_manufacturer on ms_product.id = ms_product_manufacturer.ms_product_id
          where ms_product.id IN (?)
          GROUP BY id`, [id_ProductResult])
                    let Check_product_array = []
                    check_product.map((val) => Check_product_array.push(val.id))
                    ProductResult = ProductResult.filter((el) => {
                        return Check_product_array.includes(el.id)
                    })
                    let check_product_haveAttribute = await query(`SELECT ms_product.id FROM ms_product INNER JOIN ms_product_attribute on ms_product.id = ms_product_attribute.product_id`)
                    let Check_product_haveAttribute_array = []
                    check_product_haveAttribute.map((val) => Check_product_haveAttribute_array.push(val.id))
                    ProductResult = ProductResult.filter(
                        (el) => {
                            if (el.have_attribute === 'yes') {
                                return Check_product_haveAttribute_array.includes(el.id)
                            } else {
                                return !Check_product_haveAttribute_array.includes(el.id)
                            }
                        })
                    //  all_product_list = await query(
                    //   "SELECT id, seller_shop_id, sku,message_status, have_attribute, product_owner, unique_custom_product, inventory_code, name, inventory_ratio, stock_count, inventory_stock, description, short_description, stock_status, weight, volumn, product_size, shipping_rate, created_at, updated_at FROM `ms_product` WHERE id IN (?) AND status = 'active' ORDER BY FIELD(id,?)",
                    //   [
                    //     original_all_product_from_sorted_list,
                    //     original_all_product_from_sorted_list,
                    //   ]
                    // );
                    // totalPages = original_all_product_from_sorted_list
                    //   ? Math.ceil(original_all_product_from_sorted_list.length / limit_)
                    //   : 1;
                    // product_list = ProductResult;
                    // finalResult.ok = "y";
                    // finalResult.totalPages = totalPages;
                    finalResult.ok = "y";
                    finalResult.query_result = ProductResult;
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            }
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
        if (!finalResult.query_result) {
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
                message: "finalResult = 0",
                execution_time: Date.now() - timeTaken,
            };
            finalResult = {
                query_result: [],
                query_result_category: [],
                query_result_brand: [],
            };
            logjson.status = 400;
            logjson.return_data = "";
            logjson.execution_time = Date.now() - timeTaken;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, finalResult);
            return;
        }
        if (extra_filters) {
            category_filter_hierachy = [];
            filter_category = [];
            result_category = [];
            filter_industry = [];
            result_industry = [];
            filter_brand = [];
            result_brand = [];
            var copy_finalResult = finalResult.query_result;
            try {
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
                            // console.log(filter_category.length,'2122')
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
                            // console.log(filter_brand,'2189')
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
                        let finalResultIDList_allBrand = [];
                        for (let i = 0; i < copy_finalResult.length; ++i) {
                            finalResultIDList_allBrand.push(copy_finalResult[i].id);
                        }
                        if (finalResultIDList_allBrand.length == 0) {
                            finalResultIDList_allBrand.push(0);
                        }
                        if (begin_search_details.what_component == "category_product") {

                            let result_allBrand_category = await query(
                                "SELECT DISTINCT mm.id as brand_id ,manufacturer_name,manufacturer_name_en from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
                                [finalResultIDList_allBrand]
                            );
                            finalResult.query_all_brand = result_allBrand_category;
                        }
                        //----------------- New code ----------------- //
                        //----------------- New code ----------------- //
                        if (begin_search_details.what_component == "industry_product") {
                            // let finalResultIDListIndustry = [];
                            // for (let i = 0; i < copy_finalResult.length; ++i) {
                            //   finalResultIDListIndustry.push(copy_finalResult[i].id);
                            // }
                            // if (finalResultIDListIndustry.length == 0) {
                            //   finalResultIDListIndustry.push(0);
                            // }
                            let result_allBrand_Industry = await query(
                                "SELECT DISTINCT mm.id as brand_id ,manufacturer_name,manufacturer_name_en from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
                                [finalResultIDList_allBrand]
                            );
                            finalResult.query_all_brand = result_allBrand_Industry;
                        }
                        //----------------- New code ----------------- //
                    }
                }
            } catch (err) {
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
                    execution_time: Date.now() - timeTaken,
                };
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
            }
        }
        //
        let finalResultIDList = [];
        for (let i = 0; i < finalResult["query_result"].length; ++i) {
            finalResultIDList.push(finalResult["query_result"][i].id);
        }
        if (finalResultIDList.length == 0) {
            finalResultIDList.push(0);
        }
        if (begin_search_type != "search_bar") {
            // let finalResultIDList = [];
            //   for (let i = 0; i < product_list.length; ++i) {
            //     finalResultIDList.push(product_list[i].id);
            //   }
            //   if (finalResultIDList.length == 0) {
            //     finalResultIDList.push(0);
            //   }
            if (search_category_from_result) {
                // if (search_result_product_list_tmp.length > 0) {
                //   searchCategory = search_result_product_list_tmp;
                // } else {
                //   searchCategory = original_all_product_from_sorted_list;
                // }

                // if (searchIndustry.length == 0) searchIndustry.push(0);
                try {
                    const result_categoryID = await query(
                        "SELECT DISTINCT mc.id as category_id ,category_name,category_name_en from ms_category mc LEFT JOIN ms_product_category mpc ON mc.id = mpc.ms_category_id WHERE mpc.ms_product_id IN (?) AND mc.hierachy NOT LIKE '%\\_%' ",
                        [finalResultIDList]
                    );
                    finalResult.query_result_category = result_categoryID;
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            }
            if (search_industry_from_result) {
                try {
                    if (search_result_product_list_industry_tmp.length > 0) {
                        searchIndustry = search_result_product_list_industry_tmp;
                    } else {
                        searchIndustry = original_all_product_from_sorted_list;
                    }

                    if (searchIndustry.length == 0) searchIndustry.push(0);

                    const result_industryID = await query(
                        "SELECT DISTINCT mi.id as industry_id ,industry_name_th,industry_name_en from ms_industry mi LEFT JOIN ms_product_industry mpi ON mi.id = mpi.industry_id WHERE mpi.product_id IN (?)",
                        [searchIndustry]
                    );
                    finalResult.query_result_industry = result_industryID;
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            }
            if (search_brand_from_result) {
                // if (search_result_product_list_brand_tmp.length > 0) {
                //   searchBrand = search_result_product_list_brand_tmp;
                // } else {
                //   searchBrand = original_all_product_from_sorted_list;
                // }
                try {
                    const result_brandID = await query(
                        "SELECT DISTINCT mm.id as brand_id ,manufacturer_name,manufacturer_name_en from ms_manufacturer mm LEFT JOIN ms_product_manufacturer mpm ON mm.id = mpm.ms_manufacturer_id WHERE mpm.ms_product_id IN (?)",
                        [finalResultIDList]
                    );
                    finalResult.query_result_brand = result_brandID;
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            }
        } else {
            //Jack code
            if (
                search_category_from_result ||
                search_industry_from_result ||
                search_brand_from_result
            ) {
                try {
                    let finalResultIDList = finalResult.query_result.map((val) => val.id);
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
                } catch (err) {
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
                        execution_time: Date.now() - timeTaken,
                    };
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            }
        }
        if (!finalResult.query_result.length) {
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
                message: "finalResult is null.",
                execution_time: Date.now() - timeTaken,
            };
            finalResult = {
                query_result: [],
                query_result_category: [],
                query_result_brand: [],
            };
            logjson.status = 400;
            logjson.return_data = "";
            logjson.execution_time = Date.now() - timeTaken;
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
            result(null, finalResult);
            return;
        }
        let finalId = [];
        let finalSellerShopId = [];
        finalResult.query_result.map((value) => {
            finalId.push(value.id);
            finalSellerShopId.push(value.seller_shop_id);
            return;
        });
        let productIDImageURL = {};
        let productIDPromotionId = {};
        let productIDPromotionIdAndHidden = {};
        // เพิ่มimage_url
        try {
            let searchURLImg = await query(
                "SELECT product_id AS ms_product_id,media_path AS URL,thumbnail_media_path AS URL_thumbnail,media_type FROM ms_product_image_vdo WHERE product_id IN (?) AND media_type = 'image' ORDER BY `index` ASC",
                [finalId]
            );
            for (let j = 0; j < searchURLImg.length; ++j) {
                if (!(searchURLImg[j].ms_product_id in productIDImageURL)) {
                    productIDImageURL[searchURLImg[j].ms_product_id] = [];
                }
                productIDImageURL[searchURLImg[j].ms_product_id].push(
                    process.env.IMAGE_PATH + searchURLImg[j].URL
                );
            }
        } catch (err) {
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
                execution_time: Date.now() - timeTaken,
            };
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
        }
        // เพิ่มimage_url
        // เพิ่มPromotion
        try {

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
            }
        } catch (err) {
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
                execution_time: Date.now() - timeTaken,
            };
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
        }
        // เพิ่มPromotion
        // เพิ่มค่าFav
        try {
            let userForFav = await isLoginAndGetUser(token);
            let favProductByUser = await findFavByUser(userForFav.user_id, finalId);
            // เพิ่มค่าFav
            if (begin_search_details.what_component == "category_product") {
                var category = await query(
                    "SELECT p.ms_product_id, p.ms_category_id, c.category_name,category_name_en FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id IN (?) AND p.ms_category_id = ?",
                    [finalId, begin_search_details.component_id]
                );
            } else {
                var category = await query(
                    "SELECT p.ms_product_id, p.ms_category_id, c.category_name,category_name_en FROM `ms_product_category` p JOIN `ms_category` c ON p.ms_category_id = c.id WHERE p.ms_product_id IN (?)",
                    [finalId]
                );
            }
            const brand = await query(
                "SELECT p.ms_product_id, p.ms_manufacturer_id, m.manufacturer_name,manufacturer_name_en FROM `ms_product_manufacturer` p JOIN `ms_manufacturer` m ON p.ms_manufacturer_id = m.id WHERE p.ms_product_id IN (?)",
                [finalId]
            );
            const star = await query(
                "SELECT total_rating,product_id FROM tb_product_rating_average WHERE product_id IN (?)",
                [finalId]
            );
            let user = await isLoginAndGetUser(token);
            let priceByTier = await findProductPriceByUser(
                user.user_id,
                finalId,
                role_user,
                finalSellerShopId
            );
            let productIDPriceId = {};
            try {
                for (let j = 0; j < priceByTier.length; ++j) {
                    if (!(priceByTier[j].product_id in productIDPriceId)) {
                        productIDPriceId[priceByTier[j].product_id] = []
                    }
                    productIDPriceId[priceByTier[j].product_id].push(priceByTier[j]);
                }
            } catch (err) {
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
                logjson = JSON.stringify(logjson);
                ShF_log_to_file(logfile, logjson);
            }
            // ใส่รายละเอียดต่างๆลงไปใน query_result Promotion ราคา order รูป star category brand
            for (let index = 0; index < finalResult.query_result.length; index++) {
                try {

                    finalResult.query_result[index].images_URL = !productIDImageURL[
                        finalResult.query_result[index].id
                        ]
                        ? []
                        : productIDImageURL[finalResult.query_result[index].id];
                    if (favProductByUser.includes(finalResult.query_result[index].id)) {
                        finalResult.query_result[index].isFavorite = true;
                    } else {
                        finalResult.query_result[index].isFavorite = false;
                    }
                    finalResult.query_result[index].promotion_id =
                        productIDPromotionId[finalResult.query_result[index].id];
                    finalResult.query_result[index].promotion_id_with_hidden_type =
                        productIDPromotionIdAndHidden[finalResult.query_result[index].id];
                    const filterStars = await star.filter(
                        (s) => s.product_id == finalResult.query_result[index].id
                    );
                    const filterCategory = await category.filter(
                        (cat) => cat.ms_product_id == finalResult.query_result[index].id
                    );
                    const filterBrand = await brand.filter(
                        (b) => b.ms_product_id == finalResult.query_result[index].id
                    );
                    finalResult.query_result[index].category_name = filterCategory[0]?.category_name;
                    finalResult.query_result[index].category_name_en = filterCategory[0]?.category_name_en;
                    finalResult.query_result[index].brand_name = filterBrand[0]?.manufacturer_name;
                    finalResult.query_result[index].brand_name_en = filterBrand[0]?.manufacturer_name_en;
                    //start เพิ่ม star //
                    if (filterStars[0] === undefined || filterStars[0].total_rating < 1) {
                        finalResult.query_result[index].stars = 0;
                    } else {
                        finalResult.query_result[index].stars = filterStars[0]?.total_rating;
                    }
                    // console.log(finalResult.query_result[index])
                    if (!finalResult.query_result[index].message_status) {
                        finalResult.query_result[index].message_status = "no_status";
                    }
                    finalResult.query_result[index].real_price =
                        productIDPriceId[finalResult.query_result[index]?.id] === undefined ? undefined : productIDPriceId[finalResult.query_result[index]?.id][0]?.real_price;
                    finalResult.query_result[index].fake_price =
                        productIDPriceId[finalResult.query_result[index]?.id] === undefined ? undefined : productIDPriceId[finalResult.query_result[index]?.id][0]?.fake_price;
                    finalResult.query_result[index].special_price =
                        productIDPriceId[finalResult.query_result[index]?.id] === undefined ? undefined : productIDPriceId[finalResult.query_result[index]?.id][0]?.special_price;
                    finalResult.query_result[index].discount_percent =
                        productIDPriceId[finalResult.query_result[index]?.id] === undefined ? undefined : productIDPriceId[finalResult.query_result[index]?.id][0]?.discount_percent;
                    finalResult.query_result[index].max_discount =
                        productIDPriceId[finalResult.query_result[index]?.id] === undefined ? undefined : productIDPriceId[finalResult.query_result[index]?.id][0]?.max_discount;
                } catch (err) {
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
                    logjson = JSON.stringify(logjson);
                    ShF_log_to_file(logfile, logjson);
                }
            }
        } catch (err) {
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
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
        }
        // เพิ่มราคาเข้าไปใน product_list
        // // Order_by_price การเรียงสินค้า หรือ sku มากไปน้อย น้อยไปมาก
        try {

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
        } catch (err) {
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
            logjson = JSON.stringify(logjson);
            ShF_log_to_file(logfile, logjson);
        }
        // Order_by_price การเรียงสินค้า  หรือ sku มากไปน้อย น้อยไปมาก
        totalPages = finalResult.query_result
            ? Math.ceil(finalResult.query_result.length / limit_)
            : 1;
        finalResult.totalPages = totalPages
        finalResult.query_result = finalResult.query_result.slice(startIndex, endIndex);
        //จบการทำงาน//
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
        // return response(500,false,null,"server error")
    }
};

module.exports = Search;
