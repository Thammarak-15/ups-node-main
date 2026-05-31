const sql = require('./db')
const util = require('util')
const {ShF_log_to_file} = require("../share_function/log_file");
const query = util.promisify(sql.query).bind(sql)
const order = function (order) {
}
order.listOrderNotSent = async (token, limit, page, search_keyword, filter, result) => {
    const timestamp = Date.now()
    const log_file_name = "list_order_not_sent.log"
    const finalLimit = parseInt(limit)
    const finalPage = parseInt(page)
    const offset = (finalPage - 1) * finalLimit
    try {
        if (token) {
            let userToken = await query("SELECT user_id FROM token WHERE access_token = ?", [token])
            if (userToken.length === 0) {
                const userError = {
                    'result': 'Error',
                    'code': 401,
                    'message': 'This user has unauthorized'
                }
                return result(userError, null)
            }
        }
        let filterOption = ''
        let keywordOption = ''
        //old
        //if (filter === 'sent') filterOption = 'AND (\`order\`.seller_sent_status = "sent")'
        //if (filter === 'not_sent') filterOption = 'AND \`order\`.seller_sent_status = "not_sent" AND flash_order_webhook_status.state = "0"'
        //new
        if (filter === 'sent') filterOption = 'AND \`order\`.seller_sent_status = "sent" OR flash_order_webhook_status.state != "0" AND \`order\`.status = "Y"'
        if (filter === 'not_sent') filterOption = 'AND \`order\`.seller_sent_status = "not_sent" OR flash_order_webhook_status.state = "0" AND \`order\`.status = "N"'

        if (search_keyword) keywordOption = `AND \`order\`.order_number LIKE "%${search_keyword}%"`
        let orders = await query(`SELECT \`order\`.order_number, \`order\`.buyer_name, IFNULL(flash_order_webhook_status.pno,'-') AS pno, \`order\`.product_list, \`order\`.seller_sent_status, \`order\`.created_at, \`order\`.status,\`order\`.shipping_by,IFNULL(ups_order.tracking_number,'-') AS tracking_no
        FROM \`order\`
        LEFT JOIN flash_order_webhook_status
        ON flash_order_webhook_status.order_number = \`order\`.order_number
        LEFT JOIN ups_order
        ON \`order\`.order_number = ups_order.order_number
        WHERE \`order\`.order_number IS NOT NULL AND \`order\`.seller_sent_status != "cancel" ${filterOption} ${keywordOption}
        ORDER BY \`order\`.created_at DESC
        LIMIT ${finalLimit}
        OFFSET ${offset}`)
        //old
        //const countOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        //FROM \`order\`
        //JOIN flash_order_webhook_status
        //ON flash_order_webhook_status.order_number = \`order\`.order_number
        //WHERE \`order\`.order_number IS NOT NULL AND \`order\`.status = "Y" AND \`order\`.seller_sent_status != "cancel" ${filterOption} ${keywordOption}`)
        //const countAllOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        //FROM \`order\`
        //JOIN flash_order_webhook_status
        //ON flash_order_webhook_status.order_number = \`order\`.order_number
        //WHERE (\`order\`.seller_sent_status = "sent" OR flash_order_webhook_status.state != "0") OR
        //\`order\`.seller_sent_status = "not_sent" AND flash_order_webhook_status.state = "0" AND \`order\`.status = "Y" AND \`order\`.seller_sent_status != "cancel"`)
        //const countSentOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        //FROM \`order\`
        //JOIN flash_order_webhook_status
        //ON flash_order_webhook_status.order_number = \`order\`.order_number
        //WHERE \`order\`.seller_sent_status = "sent" OR flash_order_webhook_status.state != "0" AND \`order\`.status = "Y" AND \`order\`.seller_sent_status != "cancel"`)
        //const countNotSentOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        //FROM \`order\`
        //JOIN flash_order_webhook_status
        //ON flash_order_webhook_status.order_number = \`order\`.order_number
        //WHERE \`order\`.seller_sent_status = "not_sent" AND flash_order_webhook_status.state = "0" AND \`order\`.status = "Y" AND \`order\`.seller_sent_status != "cancel"`)

        //new
        const countOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        FROM \`order\`
        LEFT JOIN flash_order_webhook_status
        ON flash_order_webhook_status.order_number = \`order\`.order_number
        LEFT JOIN ups_order
        ON \`order\`.order_number = ups_order.order_number
        WHERE \`order\`.order_number IS NOT NULL AND \`order\`.seller_sent_status != "cancel" ${filterOption} ${keywordOption}`)
        const countAllOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        FROM \`order\`
        LEFT JOIN flash_order_webhook_status
        ON flash_order_webhook_status.order_number = \`order\`.order_number
        LEFT JOIN ups_order
        ON \`order\`.order_number = ups_order.order_number
        WHERE (\`order\`.seller_sent_status = "sent" OR \`order\`.seller_sent_status = "not_sent")
        AND \`order\`.seller_sent_status != "cancel"`)
        const countSentOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        FROM \`order\`
        LEFT JOIN flash_order_webhook_status
        ON flash_order_webhook_status.order_number = \`order\`.order_number
        LEFT JOIN ups_order
        ON \`order\`.order_number = ups_order.order_number
        WHERE \`order\`.seller_sent_status = "sent" OR flash_order_webhook_status.state != "0"
        AND \`order\`.status = "Y" AND \`order\`.seller_sent_status != "cancel"`)
        const countNotSentOrders = await query(`SELECT COUNT(\`order\`.\`id\`) AS count_orders
        FROM \`order\`
        LEFT JOIN flash_order_webhook_status
        ON flash_order_webhook_status.order_number = \`order\`.order_number
        LEFT JOIN ups_order
        ON \`order\`.order_number = ups_order.order_number
        WHERE \`order\`.seller_sent_status = "not_sent" OR flash_order_webhook_status.state = "0"
        AND \`order\`.status = "N" AND \`order\`.seller_sent_status != "cancel"`)

        for (let i = 0; i < orders.length; i++) {
            let order = orders[i]
            order.product_list = JSON.parse(order.product_list)
        }
        const response = {
            'result': 'Success',
            'code': 200,
            'message': 'Get list order not sent successful.',
            'data': {
                'orders': orders,
                'total_orders': countOrders[0].count_orders,
                'current_page': finalPage,
                'total_pages':Math.ceil(countOrders[0].count_orders / finalLimit),
                'filter': [
                    {
                        'key': 'all',
                        'total_orders': countAllOrders
                    },
                    {
                        'key': 'sent',
                        'total_orders': countSentOrders
                    },
                    {
                        'key': 'not_sent',
                        'total_orders': countNotSentOrders
                    }
                ]
            }
        }
        return result(null, response)
    } catch (err) {
        console.log(err)
        const return_data = {
            'result': 'Error',
            'code': 500,
            'message': 'Server error',
            'err_message': err.message
        }
        let log_data = JSON.parse(JSON.stringify(return_data))
        log_data.execution_time = Date.now() - timestamp
        log_data = JSON.stringify(log_data)
        ShF_log_to_file(log_file_name, log_data)
        return result(null, return_data)
    }
}
module.exports = order
