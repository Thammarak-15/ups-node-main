const mongoose = require('mongoose')

const mongoose_model_company_and_staff = new mongoose.Schema({
	
	_id: { type: mongoose.Schema.Types.ObjectId },
	ownerID: { type: String }, 
	update_at: { type : Date },
	created_at: { type : Date },
	account_code: { type : String },
	account_name: { type : String },
	contacts : { type : Array, default: [] },
	address : { type : Array, default: [] }	
})

module.exports = mongoose.model('C_company_and_staff', mongoose_model_company_and_staff, 'C_company_and_staff')