const sql = require("./db.js");
const util = require('util');
const { parse } = require("path");
const { json } = require("body-parser");
const { ShF_log_to_file } = require('../share_function/log_file');
const { ShF_validate_user_and_return_shop_id } = require('../share_function/ShF_validate_user_and_return_shop_id');
const { Console } = require("console");

const query = util.promisify(sql.query).bind(sql);

// constructor
const Product_Tag = function (Product_Tag) {
    this.id = Product_Tag.id;
    this.name = Product_Tag.name;
};

Product_Tag.listAllTags = (result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.listAllTags.log"
    let logjson = {
        name: logfile,
        parameter: "",
    }
	sql.query("SELECT id, name, seller_shop_id FROM tb_tag WHERE hidden = 0", (err, res) => {
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
        console.log("tag: ", res);
        result(null, res);
        return
	});
}

Product_Tag.getTagByID = (id, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.getTagByID.log"
    let logjson = {
        name: logfile,
        parameter: {
			id: id
		},
    }
	
	sql.query("SELECT id, name FROM tb_tag WHERE ID = ? AND hidden = 0", [ id ], (err, res) => {
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
        console.log("tag: ", res);
        result(null, res);
        return
	});
}

Product_Tag.getTagByName = (name, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.getTagByName.log"
    let logjson = {
        name: logfile,
        parameter: {
			name: name
		},
    }
	
	sql.query("SELECT id, name FROM tb_tag WHERE name = ? AND hidden = 0", [ name ], (err, res) => {
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
        console.log("tag: ", res);
        result(null, res);
        return
	});
}

Product_Tag.editTag = async (token, id, newName, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.editTag.log"
    let logjson = {
        name: logfile,
        parameter: {
			token: token,
			id: id,
			newName: newName
		},
    }
	
	retrievedShopID = await ShF_validate_user_and_return_shop_id(token)
	if ( retrievedShopID == 0 ){
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"n","err":"invalid token or not authorized"});
        return
	}
	
	sql.query("UPDATE tb_tag SET name = ? WHERE id = ? AND seller_shop_id = ?", [ newName, id, retrievedShopID ], (err, res) => {
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
		
		if (res.affectedRows == 0){
			logjson.status = 200
			logjson.execution_time = Date.now() - timeTaken
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, {"ok":"n", "err":"Tag not found or the user's shop is not authorized to modify this tag."});
			return
		}
		
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"y"});
        return
	});
}

Product_Tag.createNewTag = async (token, name, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.createNewTag.log"
    let logjson = {
        name: logfile,
        parameter: {
			token: token,
			name: name
		},
    }
	
	if (name == null || name == ""){
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"n"});
		return
	}
	
	retrievedShopID = await ShF_validate_user_and_return_shop_id(token)
	if ( retrievedShopID == 0 ){
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"n","err":"invalid token or not authorized"});
        return
	}
	
	sql.query("INSERT INTO tb_tag ( name, seller_shop_id ) VALUES (?, ?)", [ name, retrievedShopID ], (err, res) => {
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
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"y"});
        return
	});
}

Product_Tag.manageTagHidden = async (token, id, hidden, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.manageTagHidden.log"
    let logjson = {
        name: logfile,
        parameter: {
			id: id,
			hidden: hidden
		},
    }
	
	if (id == null || hidden == null){
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"n"});
		return
	}

	retrievedShopID = await ShF_validate_user_and_return_shop_id(token)
	if ( retrievedShopID == 0 ){
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"n","err":"invalid token or not authorized"});
        return
	}

	sql.query("UPDATE tb_tag SET hidden = ? WHERE id = ? AND seller_shop_id = ?", [ hidden, id, retrievedShopID ], (err, res) => {
		try{
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
		
		if (res.affectedRows == 0){
			logjson.status = 200
			logjson.execution_time = Date.now() - timeTaken
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, {"ok":"n", "err":"Tag not found or the user's shop is not authorized to modify this tag."});
			return
		}
		
		logjson.status = 200
        logjson.execution_time = Date.now() - timeTaken
        logjson = JSON.stringify(logjson)
        ShF_log_to_file(logfile, logjson)
        result(null, {"ok":"y"});
        return
		
		}catch(err){
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
			result(err, null)
			return
		}
	});
}

Product_Tag.searchTagsByString = async ( partialSearchStr, result ) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.searchTagsByString.log"
    let logjson = {
        name: logfile,
        parameter: {
			partialSearchStr: partialSearchStr
		},
    }
	
	try{
		
		sql.query("SELECT id, name, seller_shop_id FROM tb_tag WHERE hidden = 0 AND name LIKE ?", [ '%' + partialSearchStr + '%' ], (err, res) => {
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
			console.log("tag: ", res);
			result(null, res);
			return
		})
		
	}catch(err){
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
		result(err, null)
		return
	}
	
}

Product_Tag.upsertTagsOfProductByString = async (token, product_id, tag_string_array, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.upsertTagsOfProductByString.log"
    let logjson = {
        name: logfile,
        parameter: {
			token: token,
			product_id: product_id,
			tag_string_array: tag_string_array
		},
    }
	
	try{
			
		if (!(Number.isInteger(product_id)) || tag_string_array.constructor != Array){
			logjson.status = 200
			logjson.execution_time = Date.now() - timeTaken
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, {"ok":"n", "err":"invalid product ID or tag_string_array is not array"});
			return
		}
		
		if (tag_string_array.length == 0){
			if (!(Number.isInteger(tag_string_array[i]))){
				logjson.status = 200
				logjson.execution_time = Date.now() - timeTaken
				logjson = JSON.stringify(logjson)
				ShF_log_to_file(logfile, logjson)
				result(null, {"ok":"n", "err": "tag_string_array is empty"});
				return
			}		
		}
		
		retrievedShopID = await ShF_validate_user_and_return_shop_id(token)
		if ( retrievedShopID == 0 ){
			logjson.status = 200
			logjson.execution_time = Date.now() - timeTaken
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, {"ok":"n","err":"invalid token or not authorized"});
			return
		}
		
		sql.query("SELECT id FROM ms_product WHERE id = ? AND seller_shop_id = ?", [ product_id , retrievedShopID ] , (err, res) => {
			try{
				if (err) {
					logjson.status = 500
					logjson.return_data = ""
					logjson.execution_time = Date.now() - timeTaken
					logjson.message = err.name + ": " + err.message
					logjson = JSON.stringify(logjson)
					ShF_log_to_file(logfile, logjson)
					console.log("sel error: ", err);
					result(err, null);
					return;
				}
				
				if ( res.length != 1 ){
					logjson.status = 200
					logjson.execution_time = Date.now() - timeTaken
					logjson = JSON.stringify(logjson)
					ShF_log_to_file(logfile, logjson)
					result(null, {"ok":"n","err":"This product does not belong to that seller shop or it does not exist."});
					return
				}		
		
				sql.query("SELECT name FROM tb_tag WHERE name IN (?)", [tag_string_array], (err, res) =>{
					if (err){
						logjson.status = 500
						logjson.return_data = ""
						logjson.execution_time = Date.now() - timeTaken
						logjson.message = err.name + ": " + err.message
						logjson = JSON.stringify(logjson)
						ShF_log_to_file(logfile, logjson)
						console.log("ins error: ", err);
						result(err, null);
						return;
					}
					
					fromdb = []
						
					for (i= 0 ; i < res.length; i++){
						fromdb.push(res[i]["name"])
						//console.log(res[i]["name"])
					}
					
					tag_strings_with_seller_shop_id = []
					for (i = 0; i < tag_string_array.length; ++i){
						if (!( fromdb.includes(tag_string_array[i]) )){
							tag_strings_with_seller_shop_id.push( [tag_string_array[i], retrievedShopID ] )
						}
					}
					
					if ( tag_strings_with_seller_shop_id.length > 0 ){
						
						sql.query("INSERT INTO tb_tag ( name, seller_shop_id ) VALUES ? ON DUPLICATE KEY UPDATE name=name", [ tag_strings_with_seller_shop_id ], (err, res) => {
							if (err){
								logjson.status = 500
								logjson.return_data = ""
								logjson.execution_time = Date.now() - timeTaken
								logjson.message = err.name + ": " + err.message
								logjson = JSON.stringify(logjson)
								ShF_log_to_file(logfile, logjson)
								console.log("ins error: ", err);
								result(err, null);
								return;
							}
							
							//find all IDs of the given strings.
							sql.query("SELECT id FROM tb_tag WHERE name IN (?)", [tag_string_array], (err, res) =>{
								if (err){
									logjson.status = 500
									logjson.return_data = ""
									logjson.execution_time = Date.now() - timeTaken
									logjson.message = err.name + ": " + err.message
									logjson = JSON.stringify(logjson)
									ShF_log_to_file(logfile, logjson)
									console.log("sel error: ", err);
									result(err, null);
									return;
								}
								
								tag_ids = []
								for (i = 0; i < res.length; ++i){
									tag_ids.push( [ res[i]["id"], product_id ] )
								}
								
								//delete all current tags
								sql.query("DELETE FROM tb_tag_product_join WHERE product_ID = ?", product_id , (err, res) => {
									try{
										
										if (err) {
											logjson.status = 500
											logjson.return_data = ""
											logjson.execution_time = Date.now() - timeTaken
											logjson.message = err.name + ": " + err.message
											logjson = JSON.stringify(logjson)
											ShF_log_to_file(logfile, logjson)
											console.log("del error: ", err);
											result(err, null);
											return;
										}
										
										sql.query("INSERT INTO tb_tag_product_join ( tag_ID, product_ID ) VALUES ?",  [tag_ids] , (err, res) => {
											try{
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
												logjson.execution_time = Date.now() - timeTaken
												logjson = JSON.stringify(logjson)
												ShF_log_to_file(logfile, logjson)
												result(null, {"ok":"y"});
												return
											}catch(err) {
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
												result(err, null)
												return
											}
										});
									}catch(err) {
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
										result(err, null)
										return
									}
								});
							})
							
						});
					}else{
							//find all IDs of the given strings.
							sql.query("SELECT id FROM tb_tag WHERE name IN (?)", [tag_string_array], (err, res) =>{
								if (err){
									logjson.status = 500
									logjson.return_data = ""
									logjson.execution_time = Date.now() - timeTaken
									logjson.message = err.name + ": " + err.message
									logjson = JSON.stringify(logjson)
									ShF_log_to_file(logfile, logjson)
									console.log("sel error: ", err);
									result(err, null);
									return;
								}
								
								tag_ids = []
								for (i = 0; i < res.length; ++i){
									tag_ids.push( [ res[i]["id"], product_id ] )
								}
								
								//delete all current tags
								sql.query("DELETE FROM tb_tag_product_join WHERE product_ID = ?", product_id , (err, res) => {
									try{
										
										if (err) {
											logjson.status = 500
											logjson.return_data = ""
											logjson.execution_time = Date.now() - timeTaken
											logjson.message = err.name + ": " + err.message
											logjson = JSON.stringify(logjson)
											ShF_log_to_file(logfile, logjson)
											console.log("del error: ", err);
											result(err, null);
											return;
										}
										
										sql.query("INSERT INTO tb_tag_product_join ( tag_ID, product_ID ) VALUES ?",  [tag_ids] , (err, res) => {
											try{
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
												logjson.execution_time = Date.now() - timeTaken
												logjson = JSON.stringify(logjson)
												ShF_log_to_file(logfile, logjson)
												result(null, {"ok":"y"});
												return
											}catch(err) {
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
												result(err, null)
												return
											}
										});
									}catch(err) {
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
										result(err, null)
										return
									}
								});
							})				
						
					}
				});
			}catch(err){
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
				result(err, null)
				return
			}
		});
	}catch(err) {
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
        result(err, null)
        return
    }
}

Product_Tag.upsertTagsOfProduct = async (token, product_id, tag_id_array, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.upsertTagsOfProduct.log"
    let logjson = {
        name: logfile,
        parameter: {
			token: token,
			product_id: product_id,
			tag_id_array: tag_id_array
		},
    }
	
	try{
			
		if (!(Number.isInteger(product_id)) || tag_id_array.constructor != Array){
			logjson.status = 200
			logjson.execution_time = Date.now() - timeTaken
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, {"ok":"n", "err":"invalid product ID or tag_id_array is not array"});
			return
		}
		
		for (i = 0 ; i < tag_id_array.length ; ++i){
			if (!(Number.isInteger(tag_id_array[i]))){
				logjson.status = 200
				logjson.execution_time = Date.now() - timeTaken
				logjson = JSON.stringify(logjson)
				ShF_log_to_file(logfile, logjson)
				result(null, {"ok":"n", "err": "some values in tag_id_array are not integer"});
				return
			}
		}
		
		if (tag_id_array.length == 0){
			if (!(Number.isInteger(tag_id_array[i]))){
				logjson.status = 200
				logjson.execution_time = Date.now() - timeTaken
				logjson = JSON.stringify(logjson)
				ShF_log_to_file(logfile, logjson)
				result(null, {"ok":"n", "err": "tag_id_array is empty"});
				return
			}		
		}
		
		retrievedShopID = await ShF_validate_user_and_return_shop_id(token)
		if ( retrievedShopID == 0 ){
			logjson.status = 200
			logjson.execution_time = Date.now() - timeTaken
			logjson = JSON.stringify(logjson)
			ShF_log_to_file(logfile, logjson)
			result(null, {"ok":"n","err":"invalid token or not authorized"});
			return
		}
		
		sql.query("SELECT id FROM ms_product WHERE id = ? AND seller_shop_id = ?", [ product_id , retrievedShopID ] , (err, res) => {
			try{
				if (err) {
					logjson.status = 500
					logjson.return_data = ""
					logjson.execution_time = Date.now() - timeTaken
					logjson.message = err.name + ": " + err.message
					logjson = JSON.stringify(logjson)
					ShF_log_to_file(logfile, logjson)
					console.log("sel error: ", err);
					result(err, null);
					return;
				}
				
				if ( res.length != 1 ){
					logjson.status = 200
					logjson.execution_time = Date.now() - timeTaken
					logjson = JSON.stringify(logjson)
					ShF_log_to_file(logfile, logjson)
					result(null, {"ok":"n","err":"This product does not belong to that seller shop or it does not exist."});
					return
				}
				
				sql.query("DELETE FROM tb_tag_product_join WHERE product_ID = ?", product_id , (err, res) => {
					try{
						
						if (err) {
							logjson.status = 500
							logjson.return_data = ""
							logjson.execution_time = Date.now() - timeTaken
							logjson.message = err.name + ": " + err.message
							logjson = JSON.stringify(logjson)
							ShF_log_to_file(logfile, logjson)
							console.log("del error: ", err);
							result(err, null);
							return;
						}
						
						joins = []
							
						for (i = 0; i < tag_id_array.length ; ++i ){
							joins.push( [ tag_id_array[i], product_id ] )
						}
						
						sql.query("INSERT INTO tb_tag_product_join ( tag_ID, product_ID ) VALUES ?",  [joins] , (err, res) => {
							try{
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
								logjson.execution_time = Date.now() - timeTaken
								logjson = JSON.stringify(logjson)
								ShF_log_to_file(logfile, logjson)
								result(null, {"ok":"y"});
								return
							}catch(err) {
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
								result(err, null)
								return
							}
						});
					}catch(err) {
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
						result(err, null)
						return
					}
				});
			}catch(err) {
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
				result(err, null)
				return
			}
		});
	}catch(err) {
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
        result(err, null)
        return
    }
}

Product_Tag.getAllTagsOfProduct = (product_id, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.getAllTagsOfProduct.log"
    let logjson = {
        name: logfile,
        parameter: {
			product_id: product_id
		},
    }
	
	sql.query("SELECT tt.id, tt.name FROM tb_tag_product_join tpj RIGHT JOIN tb_tag tt ON tpj.tag_ID = tt.id WHERE tpj.product_id = ? AND tt.hidden = 0", product_id, (err, res) => {
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
        console.log("tag: ", res);
        result(null, res);
        return
	});
}

Product_Tag.getAllProductsOfTag = (tag_id, result) => {
	let timeTaken = Date.now()
    let logfile = "Product_Tag.getAllProductsOfTag.log"
    let logjson = {
        name: logfile,
        parameter: {
			tag_id: tag_id
		},
    }
	
	sql.query("SELECT p.id, p.name FROM ms_product p LEFT JOIN tb_tag_product_join tpj ON tpj.product_ID = p.id WHERE tpj.tag_id = ? AND p.deleted_at IS NULL", tag_id, (err, res) => {
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
        console.log("tag: ", res);
        result(null, res);
        return
	});
}

module.exports = Product_Tag;