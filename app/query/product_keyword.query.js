const sql = require("../models/db");
const util = require("util");
const query = util.promisify(sql.query).bind(sql);

const create = async (id, keyword) => {
    return await query("INSERT INTO `ms_product_keyword` (`product_id`, `keyword`) VALUES (?, ?)", [id, keyword])
}

const edit = async (id, keyword) => {
    return await query("UPDATE `ms_product_keyword` SET `keyword` = ? WHERE `id` = ?", [keyword, id])
}

module.exports = {
    create,
    edit
};