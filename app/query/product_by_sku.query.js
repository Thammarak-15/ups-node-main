const sql = require("../models/db");
const util = require("util");
const e = require("cors");
const { checkSKUforAttri } = require("./cart.query");
const query = util.promisify(sql.query).bind(sql);

async function getProductBySKU(sku) {
    const res = await query("SELECT MPA.id as 'product_id', MPA.new_sku as 'sku', MP.name as 'product_name', MPP.real_price as 'price' FROM ms_product AS MP, ms_product_attribute AS MPA, ms_product_price AS MPP WHERE MPA.new_sku = ? AND MP.id = MPP.ms_product_id LIMIT 1;", sku);
  return res[0];
}

async function getProductBySKUForGetKeyword(sku) {
  let res = await query("SELECT DISTINCT `ms_product_attribute`.`product_id`, `ms_product_attribute`.`new_sku` AS sku, `ms_product`.`name` AS product_name, `ms_product_price`.`real_price` AS price, `product_color_image`.`color_image_path` AS product_image,`ms_product`.`short_description` As description,`ms_product`.`unit` FROM `ms_product_attribute` JOIN `ms_product` ON `ms_product_attribute`.`product_id` = `ms_product`.`id` JOIN `product_color_image` ON `product_color_image`.`product_id` = `ms_product`.`id` JOIN `ms_product_price` ON `ms_product_price`.`ms_product_id` = `ms_product`.`id` where `ms_product_attribute`.`new_sku` = ? AND `ms_product_attribute`.`attribute_priority_1` = `product_color_image`.`color` AND `product_color_image`.`color_image_path` != '';" , sku);
  if(res[0] === undefined || res[0].product_image === '' || res[0].sku == null){
    res = await query("SELECT `ms_product_attribute`.`product_id`, `ms_product_attribute`.`new_sku` AS sku, `ms_product`.`name` AS product_name, `ms_product_price`.`real_price` AS price, `ms_product_image_vdo`.`media_path` AS product_image,`ms_product`.`short_description` As description,`ms_product`.`unit` FROM `ms_product_attribute` JOIN `ms_product` ON `ms_product_attribute`.`product_id` = `ms_product`.`id` JOIN `ms_product_image_vdo` ON `ms_product_image_vdo`.`product_id` = `ms_product`.`id` JOIN `ms_product_price` ON `ms_product_price`.`ms_product_id` = `ms_product`.`id` WHERE `ms_product_attribute`.`new_sku` = ? AND `ms_product_image_vdo`.`media_type` = 'image' order by `index` ASC;", sku);
    if(res.length === 0){
      res = await query("SELECT `ms_product_attribute`.`product_id`, `ms_product_attribute`.`new_sku` AS sku, `ms_product`.`name` AS product_name, `ms_product_price`.`real_price` AS price, `ms_product`.`short_description` As description,`ms_product`.`unit` FROM `ms_product_attribute` JOIN `ms_product` ON `ms_product_attribute`.`product_id` = `ms_product`.`id`  JOIN `ms_product_price` ON `ms_product_price`.`ms_product_id` = `ms_product`.`id` WHERE `ms_product_attribute`.`new_sku` = ? ", sku);
    }
    return res[0]
  }
return res[0];
}

module.exports = {
  getProductBySKU,
  getProductBySKUForGetKeyword
};