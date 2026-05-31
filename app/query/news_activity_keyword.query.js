const sql = require("../models/db");
const util = require("util");
const query = util.promisify(sql.query).bind(sql);

const create = async (id, keyword) => {
    return await query("INSERT INTO `news_activity_keyword` (`news_activity_id`, `keyword`) VALUES (?, ?)", [id, keyword])
}

const edit = async (id, keyword) => {
    return await query("UPDATE `news_activity_keyword` SET `keyword` = ? WHERE `id` = ?", [keyword, id])
}

module.exports = {
    create,
    edit
};