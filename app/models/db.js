const mysql = require("mysql");
const dbConfig = require("../config/db.config.js");

/*
var connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB
});

module.exports = connection;
*/

var pool  = mysql.createPool({
    host     : dbConfig.HOST,
    port     : dbConfig.PORT,
    user     : dbConfig.USER,
    password : dbConfig.PASSWORD,
    database : dbConfig.DB,
    connector: 'mysql',
    timezone: 'gmt',
    charset : 'utf8mb4'
});

module.exports = pool;