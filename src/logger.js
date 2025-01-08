const fs = require("fs");
const moment = require("moment");
const LOG_TYPE_ERROR = 1;
const LOG_TYPE_INFO = 2;
exports.LOG_TYPE_ERROR = LOG_TYPE_ERROR;
exports.LOG_TYPE_INFO = LOG_TYPE_INFO;

exports.logger = (text, type = LOG_TYPE_INFO) => {
  const now = moment().format("Y-MM-DD H:mm:ss");
  let textContent;

  if (type == LOG_TYPE_ERROR) {
    textContent = `${now} [error] ${text}`;
    console.error(textContent);
  } else if (type == LOG_TYPE_INFO) {
    textContent = `${now} [info] ${text}`;
    console.log(textContent);
  } else {
    textContent = `${text}`;
    console.log(textContent);
  }

  // if (process.env.LOG_FILE)
  fs.appendFile("./app.log", `${textContent}\n`, (err) => {
    if (err) console.error(err);
  });
};
