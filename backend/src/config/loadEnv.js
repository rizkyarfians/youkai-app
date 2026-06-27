const path = require('path');

function loadEnv() {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env'),
  });
}

module.exports = loadEnv;
