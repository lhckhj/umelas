var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var path = require("path");

var frontend = express();
frontend.use(cors());
frontend.listen(3010);
frontend.use(bodyParser.json({limit: '5mb'}));

frontend.use("/common", express.static(__dirname + '/../common'));
frontend.use("/css", express.static(__dirname + '/css'));
frontend.use("/font-awesome", express.static(__dirname + '/font-awesome'));
frontend.use("/fonts", express.static(__dirname + '/fonts'));
frontend.use("/img", express.static(__dirname + '/img'));
frontend.use("/js", express.static(__dirname + '/js'));
frontend.use("/views", express.static(__dirname + '/views'));

frontend.get('/',function(req,res){
  res.sendFile((path.join(__dirname+'/index.html')));
});

var backend = express();
backend.use(cors());
backend.listen(3011);
backend.use(bodyParser.json({limit: '5mb'}));
require('./routes.js')(backend);