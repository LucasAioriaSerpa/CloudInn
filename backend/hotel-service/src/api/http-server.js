const http = require('node:http');
const { createApp } = require('./app');

function createHttpServer(dependencies) {
  return http.createServer(createApp(dependencies));
}

module.exports = { createHttpServer };
