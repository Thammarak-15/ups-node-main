const FlashOrder = require("../models/flash.model");
const stream = require('stream');

exports.createOrder = (req, res) => {
    FlashOrder.createOrder(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating flash order."
            });
        else res.send(data);
    });
};
exports.cancelOrder = (req, res) => {
    FlashOrder.cancelOrder(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while canceling flash order."
            });
        else res.send(data);
    });
};
exports.trackingOrder = (req, res) => {
    FlashOrder.trackingOrder(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting tracking order."
            });
        else res.send(data);
    });
};
exports.printSmalllabel = (req, res) => {
    FlashOrder.printSmalllabel(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting small label."
            });
        else {
            // res.set('Content-Type', 'application/pdf');
            res.send((data));
        }
    });
};
exports.printBiglabel = (req, res) => {
    FlashOrder.printBiglabel(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                status: "fail",
                message:
                    err.message || "Some error occurred while getting small label."
            });
        else {
            // res.set('Content-Type', 'application/pdf');
            res.send((data));
        }
    });
};
exports.estimateRate = (req, res) => {
    FlashOrder.estimateRate(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting estimate rate."
            });
        else {
            res.send((data));
        }
    });
};

exports.callFlashWebHook = (req, res) => {
    FlashOrder.CallFlashWebHook(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.getFlashWebHookData = (req, res) => {
    FlashOrder.GetFlashData(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.callCourier = (req, res) => {
    FlashOrder.callCourier(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.getNotify = (req, res) => {
    FlashOrder.getNotify(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.cancelNotify = (req, res) => {
    FlashOrder.cancelNotify(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.getDataCourier = (req, res) => {
    FlashOrder.getDataCourier(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.setDataCourier = (req, res) => {
    FlashOrder.setDataCourier(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};

exports.modifyOrder = (req, res) => {
    FlashOrder.modifyOrder(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting data."
            });
        else {
            res.send((data));
        }
    });
};
exports.autoEstimateRate = (req, res) => {
    FlashOrder.autoEstimateRate(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting estimate rate."
            });
        else {
            res.send((data));
        }
    });
};

exports.DownloadSmallLabel = (req, res) => {
    FlashOrder.DownloadSmallLabel(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting small label."
            });
        else {
            var fileContents = Buffer.from(data, "buffer");
            var readStream = new stream.PassThrough();
            readStream.end(fileContents);

            res.set('Content-disposition', 'attachment; filename=' + "small" + Date.now() + ".pdf");
            res.set('Content-Type', 'pdf');

            readStream.pipe(res);
            return res.download(data);
        }
    })
}

exports.DownloadBigLabel = (req, res) => {
    FlashOrder.DownloadBigLabel(req.body, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while getting big label."
            });
        else {
            var fileContents = Buffer.from(data, "buffer");
            var readStream = new stream.PassThrough();
            readStream.end(fileContents);

            res.set('Content-disposition', 'attachment; filename=' + "bigLabel" + Date.now() + ".pdf");
            res.set('Content-Type', 'pdf');

            readStream.pipe(res);
            return res.download(data);
        }
    })
}