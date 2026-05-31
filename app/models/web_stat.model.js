const sql = require("./db.js");
const util = require('util');
const { parse } = require("path");
const { json } = require("body-parser");
const { ShF_log_to_file } = require('../share_function/log_file');
const { Console } = require("console");

const query = util.promisify(sql.query).bind(sql);

// constructor
const WebStat = function (WebStat) {
    this.id = WebStat.id;
    this.URL = WebStat.id;
    this.counter = WebStat.counter;
};

WebStat.getStatisticsByUrl = async (URL, result) => {
    let resultQuery
    if (URL && typeof (URL) == 'string') {
        resultQuery = await query('SELECT id,URL,counter FROM tb_web_stat WHERE URL = ?', URL)
    } else {
        result({ message: "missing/invalid URL" }, null)
        return
    }
    result(null, resultQuery)
};

WebStat.collectStatistics = async (URL, token, result) => {
	let timeTaken = Date.now()
	let userid = -2
	try{
	
		let resultQuery
		let productQuery
		if (URL && typeof (URL) == 'string') {
			
			resultQuery = await query('INSERT INTO tb_web_stat (URL,counter) VALUES(?,1) ON DUPLICATE KEY UPDATE counter=counter+1', URL)
			
			// for product stat -------------------------------------------------
			if (URL.includes("DetailProductUPS") && URL.includes("-")){
				splittedURL = URL.split("-")
				product_id = splittedURL[ splittedURL.length - 1 ]
				
				if ( isNaN( product_id ) || product_id == ""){
					product_id = -1
				}
				
			}else{
				product_id = -1
			}
			
			if (product_id > 0){
				productQuery = await query('INSERT INTO tb_grafana_product_stat (product_ID,counter) VALUES(?,1) ON DUPLICATE KEY UPDATE counter=counter+1', product_id)
			}
			// END for product stat -------------------------------------------------
			

			// BEGIN view_stat_details ----------------------------------------------
			
			// token check
			userid = -1
			let user = await isLoginAndGetUser(token)

			if (user.user_id != '' ){
				userid = user.user_id
			}

			// date management
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var lastSunday = new Date(today.setDate(today.getDate()-today.getDay()));
			//var nextSaturday = new Date(today.setDate(today.getDate()+6-today.getDay()));
			previousSunday = formatDate(lastSunday)
			dayKey = formatDate(now)
			weekKey = previousSunday
			firstDayOfMonthKey = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
			yearKey = formatDate( new Date("Jan 01, " + now.getFullYear()) )
			
			
			if (URL.includes("DetailProductUPS") && URL.includes("-")){
				
				splittedURL = URL.split("-")
				product_id = splittedURL[ splittedURL.length - 1 ]
				
				if ( isNaN( product_id ) || product_id == "" ){
					product_id = -1
				}
				
				if (product_id != -1){
					viewStatDetailsParam = [
						"DetailProductUPS",
						product_id,
						userid,
						dayKey,
						weekKey,
						firstDayOfMonthKey,
						yearKey
					]
					
					viewStatDetailsQuery = await query('INSERT INTO tb_grafana_view_stat_details (what_component, component_ID, user_ID, created_day, created_week, created_month, created_year) VALUES (?)', [viewStatDetailsParam])
				}
				
			}else if (URL.includes("News&ActivityDetail")){
				
				splittedURL = URL.split("/")
				news_id = splittedURL[ splittedURL.length - 1 ]
				
				if ( isNaN( news_id ) || news_id == "" ){
					news_id = -1
				}
				
				if (news_id != -1){
					
					viewStatDetailsParam = [
						"News&ActivityDetail",
						news_id,
						userid,
						dayKey,
						weekKey,
						firstDayOfMonthKey,
						yearKey
					]
					
					viewStatDetailsQuery = await query('INSERT INTO tb_grafana_view_stat_details (what_component, component_ID, user_ID, created_day, created_week, created_month, created_year) VALUES (?)', [viewStatDetailsParam])
				
					
				}
			}
			
			// END view_stat_details ------------------------------------------------
			
		} else {
			result({ message: "missing/invalid URL" }, null)
			return
		}
		result(null, { updated: resultQuery })
		return
	}catch(err){
		let logfile = "web_stat_upsertStatistics.log"
        let logjson = {
            name: logfile,
            parameter: {
                URL: URL,
				userid: userid
            },
            status: 500,
            message: err.name + ": " + err.message,
            return_data: "",
            execution_time: Date.now() - timeTaken
        }

        if (typeof err === 'object' && err.stack) {
            logjson.errstack = err.stack
        } else {
            logjson.errstack = ""
        }

        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(err, null)
        return
	}
};

WebStat.getAllStatCount = async (seller_shop_id, result) => {
	
	// ในอนาคต, function ควรจะ query โดยใช้ seller_shop_id ได้ ตอนนี้ ไม่มี seller_shop_id ใน tb_web_stat

	let timeTaken = Date.now()
    let logfile = "WebStat_getAllStatCount.log"
    let logjson = {
        name: logfile,
        parameter: {
            seller_shop_id: seller_shop_id
        }
    }
	
	let resultQuery = await query("SELECT SUM(counter) as 'WebVisits' FROM `tb_web_stat`", seller_shop_id)
	
	if (resultQuery.length == 0 || resultQuery[0].WebVisits == null){
		logjson.status = 500
		logjson.return_data = ""
		logjson.execution_time = Date.now() - timeTaken
		logjson.message = "Error query sum from tb_web_stat"
		logjson = JSON.stringify(logjson)
		ShF_log_to_file(logfile, logjson)
		result(null, { WebVisits: -1})
		return
	}
	
	result(null, { WebVisits: resultQuery[0].WebVisits })
	return
};

const isLoginAndGetUser = async (token) => {
    if (token) {
        let checkUserLogin = await query("SELECT user_id FROM token WHERE access_token = ?", token)
        if (checkUserLogin.length != 0) { 
			return { checkUserLogin: true, user_id: checkUserLogin[0].user_id } 
		} else { 
			return { checkUserLogin: true, user_id: '' } 
		}
    } else {
        return { checkUserLogin: false, user_id: '' }
    }
}


function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = WebStat;
