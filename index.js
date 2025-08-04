const PORT = 2000;
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: __dirname + "/.env" });
const app = express();
const cors = require("cors");
const path = require("path");
const routes = require("./routes/router");
const fileUpload = require("express-fileupload");
const { enCryptData } = require("./helper/utilityHelper");
const errorHandler = require("./utils/errorHandler");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(fileUpload());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Routes
app.use("/api/v1", routes);
app.use(errorHandler);
app.get("/", async (req, res) => {
  return res.status(200).json({
    msg: "Everything is good!",
  });
});

console.log(
  enCryptData({
    type: "1",
    line1: "Anand Kumar Verma",
    line2: "Sudheer@123",
    city: "Lucknow",
    state: "Uttar Pradesh",
    postal_code: "225305",
    country: "India",
  })
);
const bcrypt = require("bcrypt");

async function name(params) {
  const e = await bcrypt.hash("123", 10);
  console.log(e)
}
name()
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
