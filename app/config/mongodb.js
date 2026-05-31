const mongoose = require('mongoose')
const mongoose_model_API_key = require('../mongooseSchema/C_API_key');
// const {ShF_generate_ID} = require('../share_function/ShF_generate_ID');

const {DB_MONGOHOST, DB_MONGOPORT, DB_MONGODBNAME, DB_MONGODBUSERNAME, DB_MOGODBPASSWORD, DB_FIRSTUSERNAME} = process.env
//mongoose.set('useFindAndModify', false); //required for removing deprecation warning.
mongoose.connect(`mongodb://${DB_MONGOHOST}:${DB_MONGOPORT}/${DB_MONGODBNAME}`, {
    user: DB_MONGODBUSERNAME,
    pass: DB_MOGODBPASSWORD,
    useUnifiedTopology: true, //required for removing deprecation warning.
    useNewUrlParser: true, //required for removing deprecation warning.
}).then(() => {
    console.log('MongoDB connected.')
    // mongoose.connection.db.collection('C_API_key').count(async function (err, count) {

    //     if (err) {
    //         console.log("Stopping. Detected an error:")
    //         console.log(err)
    //         return
    //     }

    //     if (count == 0) {
    //         console.log("No single API Key existed. Creating one...")
    //         username = DB_FIRSTUSERNAME
    //         writeKey = ShF_generate_ID(40)
    //         readKey = ShF_generate_ID(40)
    //         await mongoose_model_API_key.create({
    //             _id: mongoose.Types.ObjectId(),
    //             user: "firstUser",
    //             writeKey: writeKey,
    //             readKey: readKey
    //         })
    //         console.log("username : " + username)
    //         console.log("writeKey : " + writeKey)
    //         console.log("readKey : " + readKey)
    //     }

    // });
}).catch(err => {
    console.log(err)
})

module.exports = mongoose