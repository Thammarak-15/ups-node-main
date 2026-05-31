module.exports = app => {
    const WebStat = require("../controllers/web_stat.controller");
    app.post("/statistics/getStatisticsByUrl", WebStat.getStatisticsByUrl);
    app.post("/statistics/upsertStatistics", WebStat.upsertStatistics);
	app.post("/statistics/getAllStatCount", WebStat.getAllStatCount);
};
