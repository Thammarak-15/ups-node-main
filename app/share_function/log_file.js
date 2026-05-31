const fs = require('fs');
var moment = require('moment');

// logs the incoming logToAppend to the file logFileName in ./logs directory, as well as adding a timestamp in front of logToAppend.

logDirectory = "./logs";

var ShF_log_to_file = (logFileName, logToAppend) => {
 var path = `${logDirectory}/${logFileName}`;
 fs.appendFileSync(path, moment().format() + " => " + logToAppend + "\r\n");
}

module.exports = {
 ShF_log_to_file
}