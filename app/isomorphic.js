"use strict"

require("babel-register")
var server = require('./isomorphic.jsx').default;
const PORT = process.env.PORT || 4002;
server.listen(PORT, function () {
  console.log('Server listening on', PORT);
});