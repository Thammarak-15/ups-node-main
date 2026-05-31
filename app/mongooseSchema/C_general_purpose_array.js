const mongoose = require('mongoose')

const mongoose_model_general_purpose_array = new mongoose.Schema({
	
	_id: { type: mongoose.Schema.Types.ObjectId },
	ownerID: { type: mongoose.Schema.Types.ObjectId }, 
	whichArray: { type: String },
	data: { type : Array, default: [] }
})

module.exports = mongoose.model('C_general_purpose_array', mongoose_model_general_purpose_array, 'C_general_purpose_array')