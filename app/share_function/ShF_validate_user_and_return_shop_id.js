const fs = require('fs');
const sql = require("../models/db.js");
const util = require('util');
const { ShF_log_to_file } = require('./log_file');

const query = util.promisify(sql.query).bind(sql);

var ShF_validate_user_and_return_shop_id = async (token) => {	
	let logfile = "validate_user.log"
    let logjson = {
        name: logfile,
        parameter: {
			token: token
		},
    }
	
	if (token == null){
		return 0
	}
	
	query_result = await query("SELECT t.user_id, s.seller_shop_id, s.business_id, s.assistant_shop_id, s.admin_shop, s.admin_shop_assistant, s.admin_level FROM token t LEFT JOIN tb_user_shop s ON s.user_id = t.user_id WHERE t.access_token = ?", token)

	if (query_result.length != 1){
		return 0
	}else{
		//console.log(query_result[0])
		
		// is admin/owner or admin assistant?
		if (query_result[0]["seller_shop_id"] != null && query_result[0]["seller_shop_id"] != -1){
			return query_result[0]["seller_shop_id"]
		}
		
		if (query_result[0]["assistant_shop_id"] != null && query_result[0]["assistant_shop_id"] != -1){
			return query_result[0]["assistant_shop_id"]
		}
		
		logjson.message = "User has invalid admin condition: " + query_result[0]["user_id"]
		ShF_log_to_file(logfile, logjson)
		return 0
	}
}

module.exports = {
 ShF_validate_user_and_return_shop_id
}