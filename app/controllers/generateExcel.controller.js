const generateExcel = require("../models/generateExcel.model")
const fs = require('fs')

exports.generateExcel = (req, res) => {
    if(!(req.body.token)){
        res.status(400).send({
            message : "Please verify token"
        })
        return
    }
    if(!(req.body.start_date)){
        res.status(400).send({
            message : "Please verify start_date"
        })
        return
    }
    if(!(req.body.end_date)){
        res.status(400).send({
            message : "Please verify end_date"
        })
        return
    }
    
    generateExcel.generateExcel(req.body.token , req.body.start_date, req.body.end_date, (err, data) => {
        //res.status(200).download('./xlsx/reportAll.xlsx')
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while generate excel files."
            });
        else if(fs.existsSync(data.message)){
            res.status(200).download(data.message)
        } else {
            res.status(404);
            res.send(data); 
        }
    });
};

exports.generateExcelForOrder = (req, res) => {
    // if(!req.header('Authorization')) {
    //     res.status(401).json({
    //         'result': 'Error',
    //         'code':401,
    //         'message': 'This user has unauthorized'
    //     })
    // }
    //let token = req.header('Authorization').split(" ")
    //token = token[1]
    generateExcel.generateExcelForOrder( (err, data) => {
        if(err) res.status(err.code || 500).json(err)
        if(data) res.download(`./xlsx/${data.message}`)
    })
}
exports.exportExcelOrderDetail = (req, res) => {
    if(!(req.body.token)){
        res.status(400).send({
            message : "Please verify token"
        })
        return
    }
    if(!(req.body.shop_id)){
        res.status(400).send({
            message : "Please verify shop_id"
        })
        return
    }
    if(!(req.body.start_date)){
        res.status(400).send({
            message : "Please verify start_date"
        })
        return
    }
    if(!(req.body.end_date)){
        res.status(400).send({
            message : "Please verify end_date"
        })
        return
    }
    generateExcel.exportExcelOrderDetail(req.body.token ,req.body.shop_id, req.body.start_date, req.body.end_date, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while generate excel files."
            });
            
        else if(fs.existsSync(data.message)){
            res.status(200).download(data.message)
        } else {
            res.status(404);
            res.send(data); 
        }
    });
};