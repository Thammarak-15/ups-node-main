const sql = require("../models/db");
const util = require("util");
const e = require("cors");
const query = util.promisify(sql.query).bind(sql);

// Query ของ function frontendLocalStorageDetailCart and frontendLocalStorageGetCart
async function checkStock(product_id, quantity) {
  const res = await query("SELECT * FROM ms_product  WHERE id = ?", product_id);
  if (quantity > res[0].stock_count) {
    return {res:res ,status:true};
  } else {
    return {res:res ,status:false};
  }
}

async function checkStockAtti(product_id, quantity,option1,option2) {
  const res = await query("SELECT * FROM ms_product_attribute  WHERE product_id = ? and attribute_priority_1 = ? and attribute_priority_2= ?", [product_id,option1,option2]);
  if (quantity > res[0].actual_stock) {
    return {res:res ,status:true};
  } else {
    return {res:res ,status:false};
  }
}

async function checkStockAtti2(product_id, quantity,option1) {
  const res = await query("SELECT * FROM ms_product_attribute  WHERE product_id = ? and attribute_priority_1 = ? ", [product_id,option1]);
  if (quantity > res[0].actual_stock) {
    return {res:res ,status:true};
  } else {
    return {res:res ,status:false};
  }
}

async function checkProductStatusNoAtti(sku, quantity) {
  const res = await query("SELECT * FROM ms_inventory  WHERE inventory_code = ? ", [sku]);
  if (quantity > res[0].actual_stock && quantity < res[0].effective_stock) {
    return {res:res ,status:"pre_order"};
  } else {
    return {res:res ,status:"normal"};
  }
}

async function checkWeightforNoAttri(product_id) {
  const res = await query("SELECT weight FROM ms_product  WHERE id = ?", product_id);
    return res[0].weight;
}

async function checkSKUforNoAttri(product_id) {
  const res = await query("SELECT sku FROM ms_product  WHERE id = ?", product_id);
    return res[0].sku;
}

async function checkSKUforAttri(product_id, option1) {
  const res = await query("SELECT new_sku FROM ms_product_attribute WHERE product_id = ? and attribute_priority_1 = ?" , [product_id,option1]);
    return res[0].new_sku;
}

async function checkSKUforAttri2(product_id, option1, option2) {
  const res = await query("SELECT new_sku FROM ms_product_attribute WHERE product_id = ? and attribute_priority_1 = ? and attribute_priority_2 = ?" , [product_id,option1,option2]);
    return res[0].new_sku;
}

async function checkProductStatusAtti1(product_id, quantity,option1) {
  const res = await query("SELECT * FROM ms_product_attribute  WHERE product_id = ? and attribute_priority_1 =?", [product_id,option1]);
  if (quantity > res[0].actual_stock && quantity < res[0].effective_stock) {
    return {res:res ,status:"pre_order"};
  } else {
    return {res:res ,status:"normal"};
  }
}
async function checkProductStatusAtti2(product_id, quantity,option1,option2) {
  const res = await query("SELECT * FROM ms_product_attribute  WHERE product_id = ? and attribute_priority_1 =? and attribute_priority_2 =?", [product_id,option1,option2]);
  if (quantity > res[0].actual_stock && quantity < res[0].effective_stock) {
    return {res:res ,status:"pre_order"};
  } else {
    return {res:res ,status:"normal"};
  }
}

async function findInventory(sku) {
  const res = await query("SELECT * FROM ms_inventory  WHERE inventory_code = ?", sku);
    return res;
}

async function findInventoryHaveAttribute(sku) {
  const res = await query("SELECT * FROM ms_product_attribute  WHERE new_sku = ?", sku);
    return res;
}

async function getImg(product_id) {
  const res = await query(
    "SELECT media_path,product_id FROM ms_product_image_vdo WHERE product_id = ?",product_id
  );
  if(res.length == 0){
    return ""
  }else{
    return process.env.IMAGE_PATH + res[0].media_path
  }
}
// }
// async function getImg(product_id) {
//   const res = await query(
//     "SELECT URL,ms_product_id FROM ms_product_media WHERE ms_product_id = ?",product_id
//   );
//   if (res[0] == undefined) {
//     return [];
//   } else {
//     var url = []
//     for(let i = 0 ; i< res.length; i++ ){
//       url.push(process.env.IMAGE_PATH + res[i].URL)
//     }
//     return url;
//   }
// }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Query ของ function frontendLocalStorageCreateOrder

async function insertData(total_amount,transaction_status,user_id,user_name,user_address) {
  const res = await query(
    "INSERT INTO payment_transaction (total_amount,transaction_status,user_id,user_name,user_address) VALUES (?,?,?,?,?)",[total_amount,transaction_status,user_id,user_name,user_address]
  );
  return res
  // return true
}

async function updateData(payment_transaction_number,insert_id) {
  const res = await query(
    "UPDATE payment_transaction SET payment_transaction_number= ? WHERE id= ?",[payment_transaction_number,insert_id]
  );
  return res
}

async function productAttribute(product_id,attribute_option_1,attribute_option_2) {
  var result = []
  if(attribute_option_2.length == 0 && attribute_option_1.length != 0){
    const res = await query(
      "select * from ms_product_attribute WHERE product_id= ? and attribute_priority_1= ?",[product_id,attribute_option_1]
    );
    res[0]["volumn"] = res[0].volumn_json
    result = res
  }else if (attribute_option_1.length != 0 && attribute_option_2.length != 0){
    const res = await query(
      "select * from ms_product_attribute WHERE product_id= ? and attribute_priority_1= ? and attribute_priority_2 =?",[product_id,attribute_option_1,attribute_option_2]
    );
    res[0]["volumn"] = res[0].volumn_json
    result = res
  }
  return result
}

async function findPriceNoAttibute(product_id) {
    const res = await query(
      "select price_fix_0 from ms_product_price WHERE ms_product_id= ? ",product_id
    );
    return res
}

async function findPriceHaveAttibute(product_attribute_id) {
  const res = await query(
    "select price_fix_0 from ms_product_price WHERE product_attribute_id= ? ",product_attribute_id
  );
  return res
}

async function findByDateAndSellerShopID(date,shop_id) {
  const res = await query(
    "select * from seller_shop_buy_count_today WHERE last_order_date= ? and seller_shop_id=?",[date,shop_id]
  );
  return res
}

async function insertCheckBuyCountToday(date,shop_id,count_order_today) {
  const res = await query(
    "INSERT INTO seller_shop_buy_count_today (last_order_date,seller_shop_id,count_order_today	) VALUES (?,?,?)",[date,shop_id,count_order_today]
  );
  return res
  // return true
}

async function updateCheckBuyCountToday(new_count,id) {
  const res = await query(
    "UPDATE seller_shop_buy_count_today SET count_order_today= ? WHERE id= ?",[new_count,id]
  );
  return res
}

async function findProduct(sku) {
  var result = {}
  var res = await query(
    "select * from ms_product WHERE sku= ? ",sku
  );
  if(Object.keys(res).length !== 0){
    result = res
  } else {
    var res = await query(
      "select * from ms_product_attribute WHERE new_sku= ? ",sku
    );
    res[0]["volumn"] = res[0].volumn_json
    result = res
  }
  return result;
}

async function findProductAndAttributeById (product_id, product_attribute_id) {
  var res
  if(product_attribute_id == -1){
    res = await query(
      "select * from ms_product WHERE id= ? ",product_id
    );
  } else {
    res = await query(
      "SELECT m.id, mp.new_sku AS sku, m.name, mp.effective_stock AS stock_count, mp.actual_stock, mp.effective_stock, mp.volumn_json,m.have_attribute FROM ms_product m LEFT JOIN ms_product_attribute mp ON m.id = mp.product_id WHERE mp.id = ?", product_attribute_id
    )
  }
  return res
}

async function findProductById(id) {
  const res = await query(
    "select * from ms_product WHERE id= ? ",id
  );
  return res
}

async function updateProduct(update_stock_count,inventory_stock,id) {
  const res = await query(
    "UPDATE ms_product SET stock_count= ? ,inventory_stock= ? WHERE id= ?",[update_stock_count,inventory_stock,id]
  );
  return res
}
async function updateProductAtti(update_actual_stock,update_effective_stock,id,option1,option2) {
  if(option1 == ""){
    const res = await query(
      "UPDATE ms_product_attribute SET actual_stock= ? ,effective_stock= ? WHERE product_id= ? AND attribute_priority_2= ?",[update_actual_stock,update_effective_stock,id,option2]
    );
    return res
  }else if(option2 == ""){
    const res = await query(
      "UPDATE ms_product_attribute SET actual_stock= ? ,effective_stock= ? WHERE product_id= ? AND attribute_priority_1= ?",[update_actual_stock,update_effective_stock,id,option1]
    );
    return res
  }else{
    const res = await query(
      "UPDATE ms_product_attribute SET actual_stock= ? ,effective_stock= ? WHERE product_id= ? AND attribute_priority_1= ? AND attribute_priority_2 = ?",[update_actual_stock,update_effective_stock,id,option1,option2]
    );
    return res

  }

}
async function updateStatusProduct(stock_status,id) {
  const res = await query(
    "UPDATE ms_product SET stock_status= ? WHERE id= ?",[stock_status,id]
  );
  return res
}
async function updateInventory(update_effective_actual_stock,update_effective_stock_invent,id) {
  const res = await query(
    "UPDATE ms_inventory SET actual_stock= ? ,effective_stock= ? WHERE inventory_code= ?",[update_effective_actual_stock,update_effective_stock_invent,id]
  );
  return res
}
// tb_best_sold_products
async function bestSoldProduct(product_id) {
  const res = await query(
    "select * from tb_best_sold_products WHERE product_id= ? ",product_id
  );
  return res
}

async function insertBestSoldProduct(product_id,shop_id,quan,po_count) {
  const res = await query(
    "INSERT INTO tb_best_sold_products (product_id,seller_shop_id,total_sold_prize,po_count	) VALUES (?,?,?,?)",[product_id,shop_id,quan,po_count]
  );
  return res
  // return true
}

async function updateBestSoldProduct(total_sold_prize,po_count,product_id) {
  const res = await query(
    "UPDATE tb_best_sold_products SET total_sold_prize= ? ,po_count= ? WHERE product_id= ?",[total_sold_prize,po_count,product_id]
  );
  return res
}

async function insertOrder(buyer_name,order_number,shop_id,product_list,promotion_discount,total_quantity,total_price_no_vat,total_discount,total_price_discount,total_price_vat,total_vat,total_shipping,net_price,shipping_by,status,required_invoice,invoice_id,created_by,updated_by) {
  const res = await query(
    "INSERT INTO `order` (company_id,department_id,buyer_name,order_number,seller_shop_id,product_list,approver_list,promotion_discount,total_quantity,total_price_no_vat,total_discount,total_price_discount,total_price_vat,total_vat,total_shipping,net_price,shipping_by,status,required_invoice,invoice_id,created_by,updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",["-1","-1",buyer_name,order_number,shop_id,product_list,"[]",promotion_discount,total_quantity,total_price_no_vat,total_discount,total_price_discount,total_price_vat,total_vat,total_shipping,net_price,shipping_by,status,required_invoice,invoice_id,created_by,updated_by]
  );
  return res
}

async function insertOrderTransactionJoin(order_number,payment_transaction_number) {
  const res = await query(
    "INSERT INTO order_transaction_join (order_number,payment_transaction_number	) VALUES (?,?)",[order_number,payment_transaction_number]
  );
  return res
}

async function findShop(shop_id) {
  const res = await query(
    "select * from seller_shop WHERE id= ? ",shop_id
  );
  return res
}

async function findUserShopid(shop_id) {
  const res = await query(
    "select user_id from tb_user_shop WHERE seller_shop_id= ? ",shop_id
  );
  return res
}

async function findOneIdShop(user_id) {
  const res = await query(
    "select one_id from user_has_permission WHERE user_id= ? ",user_id
  );
  return res[0].one_id
}

async function findShopAddress() {
  const res = await query(
    "select address from business_manage "
  );
  return res
}

async function findProductByID(id) {
  return await query("SELECT * FROM ms_product WHERE id = ?", id)
}

async function insertUserAddressNew(order_number,email,first_name,last_name,address_detail,sub_district,district,province,phone,zipcode,date_now) {
  const res = await query(
    "INSERT INTO user_address_new (user_id,order_number,email,first_name,last_name,detail,sub_district,district,province,phone,zip_code,status,created_by,updated_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",["-1",order_number,email,first_name,last_name,address_detail,sub_district,district,province,phone,zipcode,"N","-1","-1",date_now]
  );
  return res
}

async function isShippingActive() {
  const res = await query(
    "select id from shipping_service WHERE status='active' AND service_name = 'Flash'");
  return res
}

module.exports = {
  checkStock,
  checkStockAtti,
  checkStockAtti2,
  checkProductStatusNoAtti,
  checkWeightforNoAttri,
  checkSKUforNoAttri,
  checkSKUforAttri,
  checkSKUforAttri2,
  checkProductStatusAtti1,
  checkProductStatusAtti2,
  findInventory,
  getImg,
  insertData,
  updateData,
  productAttribute,
  findPriceNoAttibute,
  findPriceHaveAttibute,
  findByDateAndSellerShopID,
  insertCheckBuyCountToday,
  updateCheckBuyCountToday,
  findProduct,
  updateProduct,
  updateProductAtti,
  updateStatusProduct,
  updateInventory,
  bestSoldProduct,
  insertBestSoldProduct,
  updateBestSoldProduct,
  insertOrder,
  insertOrderTransactionJoin,
  findShop,
  findUserShopid,
  findOneIdShop,
  findShopAddress,
  insertUserAddressNew,
  findProductById,
  findProductAndAttributeById,
  findProductByID,
  isShippingActive
};