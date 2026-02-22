'use strict';

var express = require('express');
var bodyParser = require('body-parser');
require('./api/models/db');

var routesApi = require('./api/routes/apiRoutes');
var app = express();
var port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.send('<!DOCTYPE html><html><body style="background-color:gray;"><h1 style="text-align:center;">Up and running.</h1></body></html>');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routesApi(app);

app.use(function(req, res) {
  res.status(404).send({ error: 'Url not found!', url: req.originalUrl });
});

app.listen(port);
console.log('Up and running on port: ' + port);
