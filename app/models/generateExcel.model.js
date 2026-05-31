const sql = require("./db.js")
const util = require("util")
const fs = require('fs')
const archiver = require('archiver')

const {ShF_log_to_file} = require("../share_function/log_file")
const {ShF_validate_user_and_return_shop_id} = require("../share_function/ShF_validate_user_and_return_shop_id")
const {
    reportPayment,
    export_to_excel,
    export_to_excel_by_sku,
    export_to_excel_by_buyer,
    export_order_not_sent,
    export_excel_order_detail
} = require("../share_function/generateExcel")

const query = util.promisify(sql.query).bind(sql)

const generateExcel = function (generateExcel) {

}

generateExcel.generateExcel = async (token, start_date, end_date, result) => {
    var timestamp = Date.now()
    log_file_name = "genExcelFromUPS.log"
    zip_name = './xlsx/report_(' + start_date + ')-(' + end_date + ')_' + timestamp + '.zip'
    output = fs.createWriteStream(zip_name);
    archive = archiver('zip');
    if (token) {
        shop_id = await ShF_validate_user_and_return_shop_id(token)
        if (shop_id != 0) {
            try {
                await reportPayment()
                await export_to_excel(shop_id, start_date, end_date, timestamp)
                await export_to_excel_by_sku(shop_id, start_date, end_date, timestamp)
                await export_to_excel_by_buyer(shop_id, start_date, end_date, timestamp)

                output.on('close', function () {
                    //console.log(archive.pointer() + ' total bytes');
                    //console.log('archiver has been finalized and the output file descriptor has closed.');
                    return_data = {
                        'status': true,
                        'message': zip_name
                    }
                    log_data = JSON.parse(JSON.stringify(return_data))
                    log_data.execution_time = Date.now() - timestamp
                    log_data = JSON.stringify(log_data)
                    ShF_log_to_file(log_file_name, log_data)
                    result(null, return_data)
                    return
                });

                archive.on('error', function (err) {
                    console.log(err);
                    throw err;
                    //result(err)
                });
                archive.pipe(output);
                archive.file('./xlsx/reportAll(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx', {name: 'reportAll(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx'});
                archive.file('./xlsx/reportByCustomer(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx', {name: 'reportByCustomer(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx'});
                archive.file('./xlsx/reportBySKU(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx', {name: 'reportBySKU(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx'});
                archive.finalize();
            } catch (error) {
                console.log(error);
                return_data = {
                    status: false,
                    message_error: error
                }
                log_data = JSON.parse(JSON.stringify(return_data))
                log_data.execution_time = Date.now() - timestamp
                log_data = JSON.stringify(log_data)
                ShF_log_to_file(log_file_name, log_data)
                result(null, return_data)
                return
            }
        } else {
            return_data = {
                'status': false,
                'message': 'can not find your shop id'
            }
            log_data = JSON.parse(JSON.stringify(return_data))
            log_data.execution_time = Date.now() - timestamp
            log_data = JSON.stringify(log_data)
            ShF_log_to_file(log_file_name, log_data)
            result(null, return_data)
            return
        }
    }
}

generateExcel.generateExcelForOrder = async (result) => {
    const timestamp = Date.now()
    const log_file_name = "gen_excel_order_not_sent.log"
    const zipName = `./xlsx/order_not_sent.zip`
    try {
        // if (token) {
        //     let userToken = await query("SELECT user_id FROM token WHERE access_token = ?", [token])
        //     if (userToken.length === 0) {
        //         const userError = {
        //             'result': 'Error',
        //             'code': 401,
        //             'message': 'This user has unauthorized'
        //         }
        //         result(userError, null)
        //     }
        // }
        const orderNotSent = await query(`SELECT * 
        FROM \`order\`
        JOIN flash_order_webhook_status
        ON flash_order_webhook_status.order_number = \`order\`.order_number
        WHERE \`order\`.seller_sent_status = 'not_sent' AND flash_order_webhook_status.state = 0 AND \`order\`.status = "Y" AND \`order\`.seller_sent_status != "cancel"
        ORDER BY \`order\`.created_at DESC`)
        const exportExcel = await export_order_not_sent(orderNotSent)
        console.log(exportExcel)
        const return_data = {
            'status': true,
            'message': exportExcel
        }
        let log_data = JSON.parse(JSON.stringify(return_data))
        log_data.execution_time = Date.now() - timestamp
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(log_file_name, log_data)
        result(null, return_data)
        return
        // const output = fs.createWriteStream(zipName)
        // const archive = archiver('zip');
        // output.on('close', function () {
        //     //console.log(archive.pointer() + ' total bytes');
        //     //console.log('archiver has been finalized and the output file descriptor has closed.');
        //     const return_data = {
        //         'status' : true ,
        //         'message' : zipName
        //     }
        //     let log_data = JSON.parse(JSON.stringify(return_data))
        //     log_data.execution_time = Date.now() - timestamp
        //     log_data = JSON.stringify(log_data)
        //     ShF_log_to_file(log_file_name, log_data)
        //     result(null, return_data)
        //     return
        // })
        // archive.on('error', function(err){
        //     console.log(err)
        //     throw err
        //     //result(err)
        // })
        // archive.pipe(output)
        // archive.file(exportExcel, {name: 'order_not_sent.xlsx'})
        // await archive.finalize()
    } catch (err) {
        console.log(err)
        const return_data = {
            status: false,
            message_error: err
        }
        let log_data = JSON.parse(JSON.stringify(return_data))
        log_data.execution_time = Date.now() - timestamp
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(log_file_name, log_data)
        result(null, return_data)
        return
    }
}
generateExcel.exportExcelOrderDetail = async (token, seller_shop_id,start_date, end_date, result) => {
    const timestamp = Date.now()
    const log_file_name = "gen_excel_order_detail.log"
    if (token) {
        try {
                shop_id = await ShF_validate_user_and_return_shop_id(token)
                if (shop_id != 0) {
                    const exportExcel = await export_excel_order_detail(seller_shop_id,start_date,end_date)
                    const return_data = {
                        'status': true,
                        'message' : `./xlsx/${exportExcel}`
                    }
                    let log_data = JSON.parse(JSON.stringify(return_data))
                    log_data.execution_time = Date.now() - timestamp
                    log_data = JSON.stringify(log_data)
                    ShF_log_to_file(log_file_name, log_data)
                    result(null, return_data)
                    return
            }
            else{
                const return_data = {
                    'status': false,
                    'message' : 'token invalid'
                }
                let log_data = JSON.parse(JSON.stringify(return_data))
                log_data.execution_time = Date.now() - timestamp
                log_data = JSON.stringify(log_data)
                ShF_log_to_file(log_file_name, log_data)
                result(null, return_data)
                return
            }
        } catch (err) {
            const return_data = {
                status: false,
                message: err
            }
            let log_data = JSON.parse(JSON.stringify(return_data))
            log_data.execution_time = Date.now() - timestamp
            log_data = JSON.stringify(log_data)
            ShF_log_to_file(log_file_name, log_data)
            result(err, null)
            return
        }
    }
}

module.exports = generateExcel
