const WebStat = require("../models/web_stat.model");

// Retrieve WebStat from the database by URL.
exports.getStatisticsByUrl = (req, res) => {
    WebStat.getStatisticsByUrl(req.body.URL, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving statistics."
            });
        else res.send(data);
    });
};
exports.upsertStatistics = (req, res) => {
    WebStat.collectStatistics(req.body.URL, req.body.token, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    { ok: "n", error: err.message }
            });
        else res.send(data);
    });
};

exports.getAllStatCount = (req, res) => {
	WebStat.getAllStatCount(req.body.seller_shop_id, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    { ok: "n", error: err.message }
            });
        else res.send(data);
	});
};