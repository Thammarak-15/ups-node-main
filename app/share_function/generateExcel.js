const {months} = require('moment')
const mysql = require('mysql')
// const mongoose = require('mongoose')
const util = require('util')
const reader = require('xlsx')
// const nodemailer = require('nodemailer');
require('dotenv').config()

const connection = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
    charset: 'utf8',
    timezone: 'gmt'
});

// const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     auth: {
//         user: process.env.MAIL_USERNAME,
//         pass: process.env.MAIL_PASSWORD,
//     },
// });

// mongoose.connect(`mongodb://${process.env.DB_MONGOHOST}:${process.env.DB_MONGOPORT}/${process.env.DB_MONGODBNAME}`, {
//     user: process.env.DB_MONGOUSERNAME,
//     pass: process.env.DB_MONGOPASSWORD,
//     useUnifiedTopology: true,
//     useNewUrlParser: true
// }).then(() => {
//     console.log('MongoDB connected.')
// }).catch(err => {
//     console.log(err);
// })

// const mongoose_model_order_paperless = new mongoose.Schema({
//     _id: { type: mongoose.Schema.Types.ObjectId },
//     ownerID: { type: mongoose.Schema.Types.ObjectId }, 
//     data: { type : Array, default: [] }
// })

const query = util.promisify(connection.query).bind(connection);

async function reportPayment() {
    try {
        orders = await query("SELECT `company_id`, `buyer_name`, `order`.`order_number`, `product_list`, `total_quantity`, `company`.`name_th`, `users`.`phone`, `payment_transaction`.`total_amount`, `order`.`created_at` FROM `order` LEFT JOIN `company` ON `order`.`company_id` = `company`.`id` LEFT JOIN `users` ON `users`.`id` = `order`.`created_by` JOIN `order_transaction_join` ON `order`.`order_number` = `order_transaction_join`.`order_number` JOIN `payment_transaction` ON `payment_transaction`.`payment_transaction_number` = `order_transaction_join`.`payment_transaction_number` WHERE `order`.`order_number` IN (SELECT `order_transaction_join`.`order_number` FROM `order_transaction_join` WHERE `order_transaction_join`.`payment_transaction_number` IN (SELECT `payment_transaction`.`payment_transaction_number` FROM `payment_transaction` WHERE `payment_transaction`.`transaction_status` = 'Success'))")
        data = []
        for (let index = 0; index < orders.length; index++) {
            product = JSON.parse(orders[index].product_list)
            for (let x = 0; x < product.length; x++) {
                pre_data = []
                pre_data.push(orders[index].order_number)
                pre_data.push(product[x].sku)
                pre_data.push(orders[index].order_number + "_" + product[x].sku)
                pre_data.push(orders[index].name_th)
                pre_data.push(orders[index].buyer_name)
                pre_data.push(orders[index].phone)
                pre_data.push(parseInt(product[x].quantity))
                pre_data.push("ชิ้น")
                pre_data.push(parseFloat(product[x].price))
                pre_data.push(parseFloat(product[x].net_price))
                pre_data.push(orders[index].created_at)
                data.push(pre_data)
            }
        }
        await query("INSERT INTO `report_payment` (`order_id`, `product_sku`, `order_product_id`, `company_name`, `customer_name`, `customer_tel`, `product_amount`, `unit`, `product_price`, `price_amount`, `order_create_at`) VALUES ? ON DUPLICATE KEY UPDATE company_name=VALUES(company_name), customer_name=VALUES(customer_name), customer_tel=VALUES(customer_tel), product_amount=VALUES(product_amount), unit=VALUES(unit), product_price=VALUES(product_price), price_amount=VALUES(price_amount), order_create_at=VALUES(order_create_at)", [data])
        console.log("Insert or update from MySQL success!")
    } catch (error) {
        console.log(error)
    }
}

// async function getDataFromMongo() {
//     try {
//         const C_order_paperless = mongoose.model('C_order_paperless', mongoose_model_order_paperless)
//         data = await C_order_paperless.find({})
//         all_data = []
//         data.forEach(element => {
//             element.data.forEach(x => {
//                 pre_data = []
//                 //pre_data.push(element.________) order_number
//                 //pre_data.push(element._______) sku
//                 //pre_data.push(element._______) order_number + sku
//                 pre_data.push(x.companyName)
//                 pre_data.push(x.fullname)
//                 pre_data.push(x.phone)
//                 //pre_data.push(element._______) จำนวน
//                 pre_data.push("ชิ้น")
//                 //pre_data.push(element._______)ราคาต่อชิ้น
//                 //pre_data.push(element._______)ราคาทั้งหม
//                 //pre_data.push(element._______)วันที่สร้าง order
//                 all_data.push(pre_data)
//             });
//         })
//         console.log(all_data);
//         //await query("INSERT INTO `report_payment` (`order_id`, `product_sku`, `order_product_id`, `company_name`, `customer_name`, `customer_tel`, `product_amount`, `unit`, `product_price`, `price_amount`, `order_create_at`) VALUES ? ON DUPLICATE KEY UPDATE company_name=VALUES(company_name), customer_name=VALUES(customer_name), customer_tel=VALUES(customer_tel), product_amount=VALUES(product_amount), unit=VALUES(unit), product_price=VALUES(product_price), price_amount=VALUES(price_amount), order_create_at=VALUES(order_create_at)",[data])
//         //console.log("Insert or update from MongoDB success!")
//     } catch (error) {
//         console.log(error)
//     }
// }

async function export_to_excel(shop_id, start_date, end_date, timestamp) {
    data = await query("SELECT DISTINCT order_number,order_id,order_create_at,product_list,company_name,customer_name,customer_tel,unit FROM `order`  JOIN report_payment ON `order`.`order_number` = `report_payment`.`order_id` WHERE `report_payment`.`order_create_at` BETWEEN ? AND ? ORDER BY `report_payment`.`order_create_at` ASC", [start_date + " " + "00:00:00", end_date + " " + "23:59:59"])
    year = []
    for (let index = 0; index < data.length; index++) {
        thisYear = data[index].order_create_at
        year.push(thisYear.getFullYear())
    }
    years = [...new Set(year)]
    file = reader.readFile('./xlsx/report.xlsx')
    form = file.Sheets["ฟอร์ม"]
    let rowindex = 10
    for (let index = 0; index < years.length; index++) {
        for (let x = 1; x < 13; x++) {
            m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
            sheetName = m[x - 1] + ' ' + years[index]
            searchName = years[index] + '-' + x + '%'
            var picked = data.filter(function (item) {
                if (item.order_create_at.getFullYear() === years[index] && item.order_create_at.getMonth() === x - 1)
                    return true
                return false
            })
            ws = JSON.parse(JSON.stringify(form))
            ws["A6"] = {
                t: 's',
                v: 'ประจำเดือน' + sheetName
            }
            for (let y = 0; y < picked.length; y++) {
                const product = JSON.parse(picked[y].product_list)
                for (let i = 0,row = 10 ;i < product.length; i++,row++) {
                    ws["A" + rowindex] = {
                        t: 's',
                        v: picked[y].order_create_at.toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    }
                    ws["B" + rowindex] = {
                        t: 's',
                        v: picked[y].order_id
                    }
                    ws["C" + rowindex] = {
                        t: 's',
                        v: (picked[y].company_name == null) ? '' : picked[y].company_name
                    }
                    ws["D" + rowindex] = {
                        t: 's',
                        v: (picked[y].customer_name == null) ? '' : picked[y].customer_name
                    }
                    ws["E" + rowindex] = {
                        t: 's',
                        v: (picked[y].customer_tel == null) ? '' : picked[y].customer_tel
                    }
                    ws["F" + rowindex] = {
                        t: 's',
                        v: product[i].sku
                    }
                    ws["G" + rowindex] = {
                        t: 's',
                        v: product[i].quantity
                    }
                    ws["H" + rowindex] = {
                        t: 's',
                        v: picked[y].unit
                    }
                    ws["I" + rowindex] = {
                        t: 'n',
                        v: product[i].price
                    }
                    ws["J" + rowindex] = {
                        t: 's',
                        v: product[i].net_price
                    }
                    rowindex += 1
                }
                if (y == picked.length - 1) {
                    reader.utils.book_append_sheet(file, ws, sheetName)
                    reader.writeFile(file, './xlsx/reportAll(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx');
                }
            }
            // console.log(ws);
            // reader.utils.book_append_sheet(file,ws,sheetName)
            // reader.writeFile(file,'./report.xlsx');
        }
    }
    console.log('created report success!')
}

async function export_to_excel_by_sku(token, start_date, end_date, timestamp) {
    workbook = reader.utils.book_new()
    data = await query("SELECT * FROM report_payment WHERE order_create_at BETWEEN ? AND ? ORDER BY `order_create_at`", [start_date + " " + "00:00:00", end_date + " " + "23:59:59"])
    year = []
    for (let index = 0; index < data.length; index++) {
        thisYear = data[index].order_create_at
        year.push(thisYear.getFullYear())
    }
    years = [...new Set(year)]
    for (let index = 0; index < years.length; index++) {
        for (let x = 0; x < 12; x++) {
            m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
            sheetName = m[x] + ' ' + years[index]
            searchName = years[index] + '-' + x + '%'
            picked = data.filter(function (item) {
                if (item.order_create_at.getFullYear() === years[index] && item.order_create_at.getMonth() === x)
                    return true
                return false
            })
            pickedBySKU = []
            for (let y = 0; y < picked.length; y++) {
                found = pickedBySKU.some(el => el.product_sku == picked[y].product_sku)
                if (!found) {
                    pickedBySKU.push(picked[y])
                } else {
                    found = pickedBySKU.find(element => element.product_sku == picked[y].product_sku)
                    found.product_amount += picked[y].product_amount
                    found.price_amount += picked[y].price_amount
                }
            }
            pickedBySKU.sort((a, b) => (a.price_amount > b.price_amount) ? -1 : (a.price_amount === b.price_amount) ? ((a.customer_name > b.customer_name) ? -1 : 1) : 1)
            array_to_sheet = [["SKU", "จำนวน", "ราคา"]]
            sum = 0
            for (let y = 0; y < pickedBySKU.length; y++) {
                sum += pickedBySKU[y].price_amount
                array_to_arrayToSheet = []
                array_to_arrayToSheet.push(pickedBySKU[y].product_sku)
                array_to_arrayToSheet.push(pickedBySKU[y].product_amount)
                array_to_arrayToSheet.push(pickedBySKU[y].price_amount)
                array_to_sheet.push(array_to_arrayToSheet)
                if (y === pickedBySKU.length - 1) {
                    array_to_sheet.push(["", "", ""])
                    array_to_sheet.push(["", "", sum])
                    worksheet = reader.utils.aoa_to_sheet(array_to_sheet)
                    reader.utils.book_append_sheet(workbook, worksheet, sheetName)
                    reader.writeFile(workbook, './xlsx/reportBySKU(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx')
                }
            }

        }
    }
    console.log('created report by sku success!');
}

async function export_to_excel_by_buyer(token, start_date, end_date, timestamp) {
    workbook = reader.utils.book_new()
    data = await query("SELECT * FROM report_payment WHERE order_create_at BETWEEN ? AND ? ORDER BY `order_create_at`", [start_date + " " + "00:00:00", end_date + " " + "23:59:59"])
    year = []
    for (let index = 0; index < data.length; index++) {
        thisYear = data[index].order_create_at
        year.push(thisYear.getFullYear())
    }
    years = [...new Set(year)]
    for (let index = 0; index < years.length; index++) {
        for (let x = 0; x < 12; x++) {
            m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
            sheetName = m[x] + ' ' + years[index]
            searchName = years[index] + '-' + x + '%'
            picked = data.filter(function (item) {
                if (item.order_create_at.getFullYear() === years[index] && item.order_create_at.getMonth() === x)
                    return true
                return false
            })
            pickedBySKU = []
            for (let y = 0; y < picked.length; y++) {
                found = pickedBySKU.some(el => el.customer_name == picked[y].customer_name)
                if (!found) {
                    pickedBySKU.push(picked[y])
                } else {
                    found = pickedBySKU.find(element => element.customer_name == picked[y].customer_name)
                    found.product_amount += picked[y].product_amount
                    found.price_amount += picked[y].price_amount
                }
            }
            pickedBySKU.sort((a, b) => (a.price_amount > b.price_amount) ? -1 : (a.price_amount === b.price_amount) ? ((a.customer_name > b.customer_name) ? -1 : 1) : 1)
            array_to_sheet = [["ผู้ติดต่อ", "รวมเงิน"]]
            sum = 0
            for (let y = 0; y < pickedBySKU.length; y++) {
                array_to_arrayToSheet = []
                sum += pickedBySKU[y].price_amount
                array_to_arrayToSheet.push(pickedBySKU[y].customer_name)
                array_to_arrayToSheet.push(pickedBySKU[y].price_amount)
                array_to_sheet.push(array_to_arrayToSheet)
                if (y === pickedBySKU.length - 1) {
                    array_to_sheet.push(["", ""])
                    array_to_sheet.push(["", sum])
                    worksheet = reader.utils.aoa_to_sheet(array_to_sheet)
                    reader.utils.book_append_sheet(workbook, worksheet, sheetName)
                    reader.writeFile(workbook, './xlsx/reportByCustomer(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx')
                }
            }

        }
    }
    console.log('created report by buyer success!');
}

async function exportToExcelFromQuatation(data, start_date, end_date, timestamp) {
    year = []
    data.forEach(element => {
        this_date = new Date(element.date)
        year.push(this_date.getFullYear())
    });
    years = [...new Set(year)]
    file = reader.readFile('./xlsx/report.xlsx')
    form = file.Sheets["ฟอร์ม"]
    for (let index = 0; index < years.length; index++) {
        for (let x = 1; x < 13; x++) {
            m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
            sheetName = m[x - 1] + ' ' + years[index]
            picked = data.filter(function (item) {
                if (new Date(item.date).getFullYear() === years[index] && new Date(item.date).getMonth() === x - 1)
                    return true
                return false
            })
            ws = JSON.parse(JSON.stringify(form))
            ws["A6"] = {
                t: 's',
                v: 'ประจำเดือน' + sheetName
            }
            for (let y = 0, row = 10; y < picked.length; y++, row++) {
                ws["A" + row] = {
                    t: 's',
                    v: picked[y].date
                }
                ws["B" + row] = {
                    t: 's',
                    v: picked[y].quatation_number
                }
                ws["C" + row] = {
                    t: 's',
                    v: picked[y].company_name
                }
                ws["D" + row] = {
                    t: 's',
                    v: picked[y].buyer_name
                }
                ws["E" + row] = {
                    t: 's',
                    v: picked[y].phone
                }
                ws["F" + row] = {
                    t: 's',
                    v: picked[y].sku
                }
                ws["G" + row] = {
                    t: 's',
                    v: picked[y].quantity
                }
                ws["H" + row] = {
                    t: 's',
                    v: "ชิ้น"
                }
                ws["I" + row] = {
                    t: 'n',
                    v: picked[y].price
                }
                ws["J" + row] = {
                    t: 's',
                    v: picked[y].total
                }
                if (y == picked.length - 1) {
                    reader.utils.book_append_sheet(file, ws, sheetName)
                    reader.writeFile(file, './xlsx/reportQuatationAll(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx');
                }
            }
        }
    }
    console.log('created report quatation all success!')
}

async function exportToExcelBySkuFromQuatation(data, start_date, end_date, timestamp) {
    workbook = reader.utils.book_new()
    year = []
    data.forEach(element => {
        this_date = new Date(element.date)
        year.push(this_date.getFullYear())
    });
    years = [...new Set(year)]
    for (let index = 0; index < years.length; index++) {
        for (let x = 0; x < 12; x++) {
            m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
            sheetName = m[x] + ' ' + years[index]
            searchName = years[index] + '-' + x + '%'
            picked = data.filter(function (item) {
                if (new Date(item.date).getFullYear() === years[index] && new Date(item.date).getMonth() === x)
                    return true
                return false
            })
            pickedBySKU = []
            for (let y = 0; y < picked.length; y++) {
                found = pickedBySKU.some(el => el.sku == picked[y].sku)
                if (!found) {
                    pickedBySKU.push(picked[y])
                } else {
                    found = pickedBySKU.find(element => element.sku == picked[y].sku)
                    found.quantity += picked[y].quantity
                    found.total += picked[y].total
                }
            }
            pickedBySKU.sort((a, b) => (a.total > b.total) ? -1 : (a.total === b.total) ? ((a.buyer_name > b.buyer_name) ? -1 : 1) : 1)
            array_to_sheet = [["SKU", "จำนวน", "ราคา"]]
            sum = 0
            for (let y = 0; y < pickedBySKU.length; y++) {
                sum += pickedBySKU[y].total
                array_to_arrayToSheet = []
                array_to_arrayToSheet.push(pickedBySKU[y].sku)
                array_to_arrayToSheet.push(pickedBySKU[y].quantity)
                array_to_arrayToSheet.push(pickedBySKU[y].total)
                array_to_sheet.push(array_to_arrayToSheet)
                if (y === pickedBySKU.length - 1) {
                    array_to_sheet.push(["", "", ""])
                    array_to_sheet.push(["", "", sum])
                    worksheet = reader.utils.aoa_to_sheet(array_to_sheet)
                    reader.utils.book_append_sheet(workbook, worksheet, sheetName)
                    reader.writeFile(workbook, './xlsx/reportQuatationBySKU(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx')
                }
            }
        }
    }
    console.log('created report by sku from quatation success!');
}

async function exportToExcelByCustomerFromQuatation(data, start_date, end_date, timestamp) {
    workbook = reader.utils.book_new()
    year = []
    data.forEach(element => {
        this_date = new Date(element.date)
        year.push(this_date.getFullYear())
    });
    years = [...new Set(year)]
    for (let index = 0; index < years.length; index++) {
        for (let x = 0; x < 12; x++) {
            m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
            sheetName = m[x] + ' ' + years[index]
            searchName = years[index] + '-' + x + '%'
            picked = data.filter(function (item) {
                if (new Date(item.date).getFullYear() === years[index] && new Date(item.date).getMonth() === x)
                    return true
                return false
            })
            pickedByCustomer = []
            for (let y = 0; y < picked.length; y++) {
                found = pickedByCustomer.some(el => el.buyer_name == picked[y].buyer_name)
                if (!found) {
                    pickedByCustomer.push(picked[y])
                } else {
                    found = pickedByCustomer.find(element => element.buyer_name == picked[y].buyer_name)
                    found.quantity += picked[y].quantity
                    found.total += picked[y].total
                }
            }
            pickedByCustomer.sort((a, b) => (a.total > b.total) ? -1 : (a.total === b.total) ? ((a.buyer_name > b.buyer_name) ? -1 : 1) : 1)
            array_to_sheet = [["ผู้ซื้อ", "จำนวน", "ราคา"]]
            sum = 0
            for (let y = 0; y < pickedByCustomer.length; y++) {
                sum += pickedByCustomer[y].total
                array_to_arrayToSheet = []
                array_to_arrayToSheet.push(pickedByCustomer[y].buyer_name)
                array_to_arrayToSheet.push(pickedByCustomer[y].quantity)
                array_to_arrayToSheet.push(pickedByCustomer[y].total)
                array_to_sheet.push(array_to_arrayToSheet)
                if (y === pickedByCustomer.length - 1) {
                    array_to_sheet.push(["", "", ""])
                    array_to_sheet.push(["", "", sum])
                    worksheet = reader.utils.aoa_to_sheet(array_to_sheet)
                    reader.utils.book_append_sheet(workbook, worksheet, sheetName)
                    reader.writeFile(workbook, './xlsx/reportQuatationByCustomer(' + start_date + '-' + end_date + ')_' + timestamp + '.xlsx')
                }
            }
        }
    }
    console.log('created report by customer from quatation success!');
}

const export_order_not_sent = async (orders) => {
    try {
        const fileName = `order_not_sent.xlsx`
        const workbook = reader.utils.book_new()
        const sheetName = 'order not sent'
        const countOrders = orders.length
        let arrayToSheet = [['วันที่', 'order_number', 'tracking_no', 'รายละเอียดคำสั่งซื้อ', 'ชื่อลูกค้า']]
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i]
            const date = order.created_at
            const orderNumber = order.order_number
            const trackingNo = order.pno
            const buyerName = order.buyer_name
            const productList = JSON.parse(order.product_list)
            const arrayStringProduct = []
            for (let j = 0; j < productList.length; j++) {
                const product = productList[j]
                const sku = product.sku
                const quantity = product.quantity
                const productAttributeDetail = product.product_attribute_detail
                const key1value = product.key_1_value
                const key2value = product.key_2_value
                const haveAttribute = product.have_attribute
                if (haveAttribute === 'yes') {
                    if (key1value && key2value) {
                        arrayStringProduct.push(`${sku} ${key1value} ${productAttributeDetail.attribute_priority_1} ${key2value} ${productAttributeDetail.attribute_priority_2} จำนวน ${quantity} ชิ้น`)
                    } else if (!key2value) {
                        arrayStringProduct.push(`${sku} ${key1value} ${productAttributeDetail.attribute_priority_1} จำนวน ${quantity} ชิ้น`)
                    }
                } else if (haveAttribute === 'no') {
                    arrayStringProduct.push(`${sku} จำนวน ${quantity} ชิ้น`)
                }
            }
            const stringAllProducts = arrayStringProduct.join(', ')
            arrayToSheet.push([
                date,
                orderNumber,
                trackingNo,
                stringAllProducts,
                buyerName
            ])
        }
        arrayToSheet.push([])
        arrayToSheet.push(['', '', '', 'รวม', `${countOrders} รายการ`])
        const workSheet = reader.utils.aoa_to_sheet(arrayToSheet)
        reader.utils.book_append_sheet(workbook, workSheet, sheetName)
        reader.writeFile(workbook, `./xlsx/${fileName}`)
        return fileName
    } catch (err) {
        return null
    }
}
const export_excel_order_detail = async (shop_id, start_date, end_date) => {
    try{
        const fileName = `OrderDetail.xlsx`
        const workbook = reader.utils.book_new()
        const sheetName = 'ข้อมูลรายการสั่งซื้อ'
        // const countOrders = orders.length
        let arrayToSheet = [['ลำดับ', 'วันที่', 'รหัสการสั่งซื้อ', 'ชื่อ-นามสกุล', 'ราคาไม่รวมภาษีมูลค่าเพิ่ม','ส่วนลด','ภาษีมูลค่าเพิ่ม','ราคารวมภาษีมูลค่าเพิ่ม','ค่าจัดส่ง','ราคารวมสุทธิ','สถานะการสั่งซื้อ','สถานะการชำระเงิน','ช่องทางการชำระเงิน','ธนาคาร','วันที่ชำระเงิน','Ref','เลขที่โอนเงิน']]
        const querypayment = "SELECT DATE_FORMAT(o.created_at,'%d %M %Y') AS dateBE, o.order_number,o.created_at,pt.transaction_status AS payment_status,(CASE WHEN pt.transaction_status = 'Pending' THEN 'รออนุมัติ' WHEN pt.transaction_status = 'Not Paid' THEN 'ยังไม่ชำระเงิน' WHEN pt.transaction_status = 'Success' THEN 'ชำระเงินสำเร็จ' WHEN pt.transaction_status = 'Approve' THEN 'วางบิล' WHEN pt.transaction_status = 'Fail' THEN 'ชำระเงินไม่สำเร็จ' WHEN pt.transaction_status = 'Cancel' THEN 'ยกเลิกคำสั่งซื้อ'ELSE 'ไม่พบสถานะ'END) AS payment_text,(CASE WHEN o.status = 'N' THEN 'ยังไม่ดำเนินการ' WHEN o.status = 'Y' THEN 'ดำเนินการแล้ว' ELSE 'ยกเลิก'END) AS order_text,FORMAT(o.total_price_no_vat,2) AS total_price_no_vat,FORMAT(o.total_discount,2) AS total_discount,FORMAT(o.total_vat,2) AS total_vat,FORMAT(o.total_price_vat,2) AS total_price_vat,FORMAT(o.total_shipping,2) AS total_shipping,FORMAT(o.net_price,2) AS net_price,tpt.payType,tpt.bankNo,DATE_FORMAT(pt.paid_datetime,'%d %M %Y %H:%i:%S') AS paid_datetime,tpt.orderIDRef,pt.payment_transaction_number,o.buyer_name FROM `order` o left join order_transaction_join otj on o.order_number = otj.order_number left join payment_transaction pt on otj.payment_transaction_number = pt.payment_transaction_number left JOIN thai_payment_transaction tpt on tpt.orderId = o.order_number left join users on pt.user_id = users.id where o.seller_shop_id = ? and o.created_at between ? and ? ORDER BY o.created_at DESC"
        const queryData = await query( querypayment,[shop_id,start_date + " " + "00:00:00", end_date + " " + "23:59:59"])

        for (let i = 0; i < queryData.length; i++) {
            const order = queryData[i]
            const inputDate = new Date(order.dateBE);
            const thaiDateOptions = { year: 'numeric', month: 'long', day: 'numeric'};
            const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', thaiDateOptions);
            const thaiFormattedDate = thaiDateFormatter.format(inputDate);
            const inputDateNoTime = new Date(order.paid_datetime);
            const thaiFormattedDatehaveTime = {dateStyle: 'long', timeStyle: 'medium'};
            const thaiDateFormatterHaveTime = new Intl.DateTimeFormat('th-TH', thaiFormattedDatehaveTime);
            const thaiFormattedDateHaveTime = thaiDateFormatterHaveTime.format(inputDateNoTime);
            const date = order.dateBE ? thaiFormattedDate : order.dateBE
            const orderNumber = order.order_number
            const buyerName = order.buyer_name
            const total_price_no_vat = order.total_price_no_vat
            const discount = order.total_discount
            const total_vat = order.total_vat
            const total_price_vat = order.total_price_vat
            const total_shipping = order.total_shipping
            const net_price = order.net_price
            const order_text = order.order_text
            const payment_text = order.payment_text
            const payType = order.payType
            const bankNo = order.bankNo
            const paid_datetime = order.paid_datetime ? thaiFormattedDateHaveTime : order.paid_datetime
            const orderIDRef = order.orderIDRef
            // const payment_transaction_number = order.payment_transaction_number
            arrayToSheet.push([
                i+1,
                date,
                orderNumber,
                buyerName,
                total_price_no_vat,
                discount,
                total_vat,
                total_price_vat,
                total_shipping,
                net_price,
                order_text,
                payment_text,
                payType,
                bankNo,
                paid_datetime,
                orderIDRef,
                // payment_transaction_number,
            ])
        }
        // arrayToSheet.push([])
        const workSheet = reader.utils.aoa_to_sheet(arrayToSheet)
        reader.utils.book_append_sheet(workbook, workSheet, sheetName)
        reader.writeFile(workbook, `./xlsx/${fileName}`)
        // console.log(fileName)
        return fileName
    } catch (err) {
        return err
    }
}

module.exports = {
    reportPayment,
    export_to_excel,
    export_to_excel_by_sku,
    export_to_excel_by_buyer,
    exportToExcelFromQuatation,
    exportToExcelBySkuFromQuatation,
    exportToExcelByCustomerFromQuatation,
    export_order_not_sent,
    export_excel_order_detail
}