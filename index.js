"use strict";

const app = require('./server');
const port = process.env.NODE_PORT || 3333;

console.log("Start lazy-http-scan on port=%d", port);
app.listen(port);
