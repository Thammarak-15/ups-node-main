const c_order_paperless = require('../models/c_paperless_order.model')
const { exportToExcelFromQuatation, exportToExcelBySkuFromQuatation, exportToExcelByCustomerFromQuatation } = require("../share_function/generateExcel")
const { ShF_validate_user_and_return_shop_id } = require("../share_function/ShF_validate_user_and_return_shop_id")
const { ShF_log_to_file } = require("../share_function/log_file")

const fs = require('fs')
const archiver = require('archiver')

exports.getAll = async function (req, res, next) {
    try {
        data = await c_order_paperless.find({})
        console.log(data);
    } catch (error) {
        console.log("error :",error);
    }
}

exports.getDataAndGenExcel = async function (req, res, next) {
    console.log("start gen data excel from paperless");
    timestamp = Date.now()
    log_file_name = "genExcelFromPaperless.log"
    if(!(req.body.token)){
        return_data = {
            message : "Please verify token"
        }
        log_data = JSON.parse(JSON.stringify(return_data))
        log_data.execution_time = Date.now() - timestamp
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(log_file_name, log_data)
        res.status(400).send(return_data)
        return
    }
    if(!(req.body.start_date)){
        return_data = {
            message : "Please verify start_date"
        }
        log_data = JSON.parse(JSON.stringify(return_data))
        log_data.execution_time = Date.now() - timestamp
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(log_file_name, log_data)
        res.status(400).send(return_data)
        return
    }
    if(!(req.body.end_date)){
        return_data = {
            message : "Please verify end_date"
        }
        log_data = JSON.parse(JSON.stringify(return_data))
        log_data.execution_time = Date.now() - timestamp
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(log_file_name, log_data)
        res.status(400).send(return_data)
        return
    }
    if(req.body.token){
        shop_id = await ShF_validate_user_and_return_shop_id(req.body.token)
        if(shop_id == 16){
            start_date = req.body.start_date
            end_date = req.body.end_date
            zip_name = './xlsx/report_quatation('+start_date+')-('+end_date+')_'+timestamp+'.zip'
            output = fs.createWriteStream(zip_name);
            archive = archiver('zip');
            data_dict = []
            try {
                data_query = await c_order_paperless.find({})
                console.log(`data_query: ${data_query}`);
                selected_data = data_query.filter(function(item){
                    if(Date.parse(item.data[0]["DATE"]) >= Date.parse(start_date) && Date.parse(item.data[0]["DATE"]) <= Date.parse(end_date))
                        return true
                    return false
                })
                selected_data.forEach(element => {
                    x = 1
                    is_continue = true
                    this_data = element.data[0]
                    while(is_continue){
                        pre_data = {}
                        if(this_data.hasOwnProperty('No_'+x)){
                            pre_data.quatation_number = this_data.quatation_number
                            pre_data.sku = this_data['sku_'+x]
                            pre_data.name = this_data['product_name_'+x]
                            pre_data.buyer_name = this_data.fullname
                            pre_data.company_name = this_data.companyName
                            pre_data.phone = this_data.phone
                            pre_data.quantity = parseInt(this_data['quantity_'+x])
                            pre_data.price = parseFloat(this_data['price_'+x])
                            pre_data.total = parseFloat(this_data['TOTAL_'+x])
                            pre_data.date = this_data.DATE
                            data_dict.push(pre_data)
                            x++
                        } else {
                            is_continue = false
                            break;
                        }
                    }
                });
                console.log(data_dict);
                await exportToExcelFromQuatation(data_dict, start_date, end_date,timestamp)
                await exportToExcelBySkuFromQuatation(data_dict, start_date, end_date,timestamp)
                await exportToExcelByCustomerFromQuatation(data_dict, start_date, end_date, timestamp)
                console.log("gen success");
                output.on('close', function () {
                    //console.log(archive.pointer() + ' total bytes');
                    //console.log('archiver has been finalized and the output file descriptor has closed.');
                    return_data = {
                        message : 'generate success!',
                        execution_time : Date.now() - timestamp
                    }
                    log_data = JSON.stringify(return_data)
                    ShF_log_to_file(log_file_name, log_data)
                    res.status(200).download(zip_name)
                    return
                });

                archive.on('error', function(err){
                    console.log(err);
                    throw err;
                });
                archive.pipe(output);
                archive.file('./xlsx/reportQuatationAll('+start_date+'-'+end_date+')_'+timestamp+'.xlsx', { name: 'reportQuatationAll('+start_date+'-'+end_date+')_'+timestamp+'.xlsx' });
                archive.file('./xlsx/reportQuatationByCustomer('+start_date+'-'+end_date+')_'+timestamp+'.xlsx', { name: 'reportQuatationByCustomer('+start_date+'-'+end_date+')_'+timestamp+'.xlsx' });
                archive.file('./xlsx/reportQuatationBySKU('+start_date+'-'+end_date+')_'+timestamp+'.xlsx', { name: 'reportQuatationBySKU('+start_date+'-'+end_date+')_'+timestamp+'.xlsx' });
                archive.finalize();
            } catch (error) {
                console.log(error);
                return_data = {
                    message : 'error',
                    error_message : error
                }
                log_data = JSON.stringify(return_data)
                ShF_log_to_file(log_file_name, log_data)
                res.status(500).send(error)
                return
            }
        } else {
            res.status(404).send({
                    'status' : false ,
                    'message' : 'can not find your shop id'
            })
        }
    }
}