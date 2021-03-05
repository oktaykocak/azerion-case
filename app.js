/*!
 * azerion-case
 * Copyright(c) 2021 Oktay Koçak
 * Do What The F*ck You Want To Public Licensed
 */

var express = require("express");
var routes = require("./routes/route.js");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  "/asset/",
  express.static(path.join(__dirname, "assets"), {
    index: false,
    extensions: ["jpg"],
  })
);

// setup API routes
routes(app);

// start Express Server
var server = app.listen(port, function () {
  console.log("Express server listening on port " + port);
});

module.exports = server;
