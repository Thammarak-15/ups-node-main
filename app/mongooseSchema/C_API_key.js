const mongoose = require('mongoose')

const mongoose_model_API_key = new mongoose.Schema({
	
	_id: { type: mongoose.Schema.Types.ObjectId },
	user: { type: String }, 
	readKey: { type: String },
	writeKey : { type: String }
})

module.exports = mongoose.model('C_API_key', mongoose_model_API_key, 'C_API_key')