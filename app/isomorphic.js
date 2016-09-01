"use strict"

require("babel-register")
const server = require('./isomorphic.jsx').default;

const PORT = 4002;

server.listen(PORT, function () {
  console.log('ISO server listening on port', PORT);
});