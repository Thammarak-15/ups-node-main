const sql = require("./db.js");
const util = require('util');
const { parse } = require("path");
const { json } = require("body-parser");
const { ShF_log_to_file } = require('../share_function/log_file');

const query = util.promisify(sql.query).bind(sql);

// constructor
const TaxInvoice = function (invoice) {
    this.id = invoice.id;
    this.name = invoice.name;
    this.address = invoice.address;
    this.postal_code = invoice.postal_code;
    this.province = invoice.province;
    this.district = invoice.district;
    this.sub_district = invoice.sub_district;
    this.tax_id = invoice.tax_id;
    this.invoice_id = invoice.invoice_id;
    this.sub_district = invoice.sub_district;
    this.buyer_id = invoice.buyer_id;
    this.buyer_one_id = invoice.buyer_one_id;
    this.seller_shop_id = invoice.seller_shop_id;
    this.seller_shop_id_data = invoice.seller_shop_id_data;
    this.role = invoice.role;
    this.user_type = user_type;
    this.created_at = invoice.created_at;
};

TaxInvoice.getAll = result => {
    let timeTaken = Date.now()
    let logfile = "getAll_invoice.log"
    let logjson = {
        name: logfile,
        parameter: "",
    }
    sql.query("SELECT * FROM invoice", (err, res) => {
        if (err) {
            logjson.status = 500
            logjson.return_data = ""
            logjson.execution_time = Date.now() - timeTaken
            logjson.message = err.name + ": " + err.message
            logjson = JSON.stringify(logjson)
            ShF_log_to_file(logfile, logjson)
            console.log("error: ", err);
            result(err, null);
            return;
        }
        logjson.status = 200
        logjson.return_data = res
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        console.log("invoice: ", res);
        result(null, res);
        return
    });
};

TaxInvoice.getTaxInvoice = async (role, token, result) => {
    let timeTaken = Date.now()
    let logfile = "get_tax_invoice.log"
    let logjson = {
        name: logfile,
        parameter: {
            role: role,
            token: token
        },
    }

	if ( role == undefined || token == undefined ){
		logjson.status = 400
		logjson.return_data = ""
		logjson.execution_time = Date.now() - timeTaken
		logjson = JSON.stringify(logjson)
		ShF_log_to_file(logfile, logjson)
		result(null, { ok: "n", result: null, error: "missing parameters" });
		return;
	}

    const isLoginAndGetUser = async (token) => {
        if (token) {
            let checkUserLogin = await query("SELECT user_id FROM token WHERE access_token = ?", token)
            if (checkUserLogin.length != 0) {
                return { 
                    checkUserLogin: true,
                    user_id: checkUserLogin[0].user_id 
                } 
            } else { 
                return { 
                    checkUserLogin: true,
                    user_id: '' 
                } 
            }
        } else {
            return { checkUserLogin: false, user_id: '' }
        }
    }
    let user = await isLoginAndGetUser(token)
    let finalRes = { ok: "" }

    let user_id = user.user_id

    const isPurchaser = async (user_id) => {
        if (user_id) {
            let checkPurchaser = await query("SELECT purchaser, company_id FROM user_has_permission WHERE user_id = ?", user_id )
            console.log("CheckPurchaser:", checkPurchaser)
            if (checkPurchaser.length != 0) {
                return { checkPurchaser: true, purchaser: checkPurchaser[0].purchaser, company_id: checkPurchaser[0].company_id } 
            } else { 
                return { checkPurchaser: true, purchaser: '' } }
        } else {
            return { checkPurchaser: false, purchaser: '' }
        }
    }

    const isPurchaserCaller = isPurchaser(user_id)
    var purchaserCompanyID = (await isPurchaserCaller).company_id
    var purchaserChecker = (await isPurchaserCaller).purchaser
    console.log("purchaserCompany:", purchaserCompanyID)
    console.log("purchaserChecker:", purchaserChecker)

    if(purchaserChecker == "1"){
        let companyInfo = await query("SELECT name_th, tax_id FROM company WHERE id = ?", purchaserCompanyID)
        console.log("CompanyInfo", companyInfo)
        if(companyInfo.length != 0){
            var company_name = companyInfo[0].name_th
            var tax_id = companyInfo[0].tax_id
        } else {
            var company_name = ''
            var tax_id = ''
        }
    } else {
        var company_name = ''
        var tax_id = ''
    }

    if (user.user_id == '') {
        finalRes.ok = "y"
        finalRes.message = "Unauthorized"
        logjson.status = 401
        logjson.return_data = ""
        logjson.message = "Unauthorized"
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, finalRes);
        return
    } else {
        const queryResult = sql.query("SELECT * FROM invoice WHERE created_at = (SELECT MAX(created_at) FROM invoice WHERE buyer_id = ?) && buyer_id = ? LIMIT 1", [user.user_id, user.user_id], (err, res) => {
            if (queryResult.length == 0){
                logjson.status = 200
                logjson.return_data = res
                logjson.execution_time = Date.now() - timeTaken
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                console.log("This User is an admin helper")
                console.log({invoice: res, company_name: company_name, tax_id: tax_id});
            } else {
                logjson.status = 200
                logjson.return_data = res
                logjson.execution_time = Date.now() - timeTaken
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                console.log("This User is an admin")
                console.log(null, {invoice: res, company_name: company_name, tax_id: tax_id});
            }
            if (err) {
                logjson.status = 500
                logjson.return_data = ""
                logjson.execution_time = Date.now() - timeTaken
                logjson.message = err.name + ": " + err.message
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                console.log("error: ", err);
                result(err, null);
                return;
            }
            
                logjson.status = 200
                logjson.return_data = res
                logjson.execution_time = Date.now() - timeTaken
                logjson = JSON.stringify(logjson)
                ShF_log_to_file(logfile, logjson)
                console.log("invoice: ", res);
                //result(null, {invoice: res, company_name: company_name, tax_id: tax_id});
                result(null, res);
                return;
        });
    }
    
};

TaxInvoice.insertTaxInvoice = (name, address, postal_code, province, district, sub_district, tax_id, token, role, seller_shop_id, seller_shop_id_data, user_type, result) => {
    var date = new Date();
    var thisYear = date.getFullYear().toString();
    var thisYear = thisYear.slice(2,3);
    var thisMonth = date.getMonth();
    var thisDay = date.getDate();
    var runningNumber = date.valueOf();
    var invoice_id = thisYear + thisMonth + thisDay + runningNumber;
    let timeTaken = Date.now()
    let logfile = "insert_invoice.log"
    let logjson = {
        name: logfile,
        parameter: {
            name: name,
            address: address,
            postal_code: postal_code,
            province: province,
            district: district,
            sub_district: sub_district,
            tax_id: tax_id,
            invoice_id: invoice_id,
			//token: token, 
			role: role,
            //buyer_id: buyer_id,
            //buyer_one_id: buyer_one_id,
            seller_shop_id: seller_shop_id,
            seller_shop_id_data: seller_shop_id_data,
            user_type: user_type
        }
    }
    
	try {
	
		if (!(role == "non-login" || role == "ext_buyer" || role == "purchaser")){
			logjson.status = 400
			logjson.return_data = ""
			logjson.execution_time = Date.now() - timeTaken
			logjson.message = "invalid role " + role
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, { ok: "n", result: null, error: "invalid role" });
			return;
		}

        if (!(user_type == "GENERAL" || user_type == "INDIVIDUAL")){
			logjson.status = 400
			logjson.return_data = ""
			logjson.execution_time = Date.now() - timeTaken
			logjson.message = "invalid user_type " + role
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, { ok: "n", result: null, error: "invalid user_type" });
			return;
		}
	
		if ( role == "non-login" ){
			
			buyer_id = ""
			buyer_one_id = ""
			
			insertInvoice(name, address, postal_code, province, district, sub_district, tax_id, invoice_id, buyer_id, buyer_one_id, seller_shop_id, seller_shop_id_data, role, user_type, logjson, timeTaken, logfile, result)
			return
		}

        if ( role == "ext_buyer" ){
			sql.query("SELECT u.id, u.username_oneid FROM users u LEFT JOIN token t ON u.id = t.user_id WHERE t.access_token = ?", [ token ], (err, res) => {
			
                if (err) {
                    logjson.status = 500
                    logjson.return_data = ""
                    logjson.execution_time = Date.now() - timeTaken
                    logjson.message = err.name + ": " + err.message + " AT fetching user details"
                    logjson = JSON.stringify(logjson)
                    ShF_log_to_file(logfile, logjson)
                    result(err, null);
                    return;
                }
                if (res.length == 0){
                    logjson.status = 400
                    logjson.return_data = ""
                    logjson.execution_time = Date.now() - timeTaken
                    logjson.message = "invalid token " + token
                    logjson = JSON.stringify(logjson)
                    ShF_log_to_file(logfile, logjson)
                    result(null, { ok: "n", result: null, error: "invalid token" });
                    return;
                }
                
                buyer_id = res[0].id
                buyer_one_id = res[0].username_oneid
                
                    insertInvoice(name, address, postal_code, province, district, sub_district, tax_id, invoice_id, buyer_id, buyer_one_id, seller_shop_id, seller_shop_id_data, role, user_type, logjson, timeTaken, logfile, result)
                
            });    
			return
		}
	
	
		sql.query("SELECT u.id, u.username_oneid FROM users u LEFT JOIN token t ON u.id = t.user_id WHERE t.access_token = ?", [ token ], (err, res) => {
			
			if (err) {
				logjson.status = 500
				logjson.return_data = ""
				logjson.execution_time = Date.now() - timeTaken
				logjson.message = err.name + ": " + err.message + " AT fetching user details"
				logjson = JSON.stringify(logjson)
				ShF_log_to_file(logfile, logjson)
				result(err, null);
				return;
			}
			if (res.length == 0){
				logjson.status = 400
				logjson.return_data = ""
				logjson.execution_time = Date.now() - timeTaken
				logjson.message = "invalid token " + token
				logjson = JSON.stringify(logjson)
				ShF_log_to_file(logfile, logjson)
				result(null, { ok: "n", result: null, error: "invalid token" });
				return;
			}
			
			buyer_id = res[0].id
			buyer_one_id = res[0].username_oneid
			
			    insertInvoice(name, address, postal_code, province, district, sub_district, tax_id, invoice_id, buyer_id, buyer_one_id, seller_shop_id, seller_shop_id_data, role, user_type, logjson, timeTaken, logfile, result)
            
		});
    }
    catch (err) {
        logjson.status = 500
        logjson.return_data = ""
        logjson.message = err.name + ": " + err.message

        if (typeof err === 'object' && err.stack) {
            logjson.errstack = err.stack
        } else {
            logjson.errstack = ""
        }

        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        console.log("error: ", err);
        result(err, null)
        return
    }
};
TaxInvoice.deleteInvoiceRrelateCart =(cart_id,invoice_id,result)=>{
    let timeTaken = Date.now()
    let logfile = "deleteInvoiceCart.log"
    let logjson = {}
    try {
        if(!cart_id){
            logjson.status = 400
            logjson.return_data = ""
            logjson.execution_time = Date.now() - timeTaken
            logjson.message = "cart_id is null"
            logjson = JSON.stringify(logjson)
            ShF_log_to_file(logfile, logjson)
            result(null, { ok: "n", result: null, error: "cart_id is null" });
            return;
        }
        if(!invoice_id){
            logjson.status = 400
            logjson.return_data = ""
            logjson.execution_time = Date.now() - timeTaken
            logjson.message = "invoice_id is null"
            logjson = JSON.stringify(logjson)
            ShF_log_to_file(logfile, logjson)
            result(null, { ok: "n", result: null, error: "invoice_id is null" });
            return;
        }
        sql.query("DELETE FROM invoice_relate_cart where invoice_id = ?", [ invoice_id ])
        logjson.status = 200
        logjson.return_data = {cart_id:cart_id,invoice_id:invoice_id}
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, { ok: "y", result: "Success", message:"Delete Success"});
        return
    } catch (err) {
        logjson.status = 500
        logjson.return_data = ""
        logjson.message = err.name + ": " + err.message
        if (typeof err === 'object' && err.stack) {
            logjson.errstack = err.stack
        } else {
            logjson.errstack = ""
        }
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        console.log("error: ", err);
        result(err, null)
        return
    }

}

function insertInvoice(name, address, postal_code, province, district, sub_district, tax_id, invoice_id, buyer_id, buyer_one_id, seller_shop_id, seller_shop_id_data, role, user_type, logjson, timeTaken, logfile, result){

	sql.query("INSERT INTO invoice(name, address, postal_code, province, district, sub_district, tax_id, invoice_id, buyer_id, buyer_one_id, seller_shop_id, seller_shop_id_data, role, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [name, address, postal_code, province, district, sub_district, tax_id, invoice_id, buyer_id, buyer_one_id, seller_shop_id, seller_shop_id_data, role, user_type], (err, res) => {
		if (err) {
			logjson.status = 500
			logjson.return_data = ""
			logjson.execution_time = Date.now() - timeTaken
			logjson.message = err.name + ": " + err.message + " AT inserting invoice"
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			console.log("error: ", err);
			result(err, null);
			return;
		} else {
            logjson.status = 200
            logjson.return_data = res
            logjson.execution_time = Date.now() - timeTaken
            logjson = JSON.stringify(logjson)
            ShF_log_to_file(logfile, logjson)
            result(null, { ok: "y", result: res, invoice_id: invoice_id});
            return
        }
		
	});
}

module.exports = TaxInvoice;