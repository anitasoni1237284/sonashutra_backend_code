const { Sequelize } = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize(
  process.env.DB_NAME, // db name
  process.env.DB_USER, // user name
  process.env.DB_PASSWORD, // pass
  {
    // port: 15345,
    dialect: "mysql",
    host: process.env.DB_HOST, // host
    logging: false,
  }
);
module.exports = sequelize;

// const sequelize = new Sequelize(
//   process.env.DB_NAME, // db name
//   process.env.DB_USER, // user name
//   process.env.DB_PASSWORD, // pass
//   {
//     port: 15345,
//     dialect: "mssql",
//     host: process.env.DB_HOST, // host
//     logging: false,
//   }
// );
// module.exports = sequelize;

