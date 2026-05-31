var express = require('express');
var router = express.Router();
const { ShF_log_to_file } = require('../share_function/log_file');

const callback = function () {

};

callback.callbacklazada = async (req, result) => {
    try {
        let logfile = "callbacklazada.log";
        let logjson = JSON.stringify(req.body);
        ShF_log_to_file(logfile, logjson);
        //console.log(req);
    } catch (error) {
        console.log(error);
    }
    result(null, req.body);
    return;
};

module.exports = callback;