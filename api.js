'use strict';

var moment   = require('moment');
var database = require('./modules/database.js');
var server   = require('./modules/server.js');

process.env.TZ = 'UTC';
moment.defaultFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZZ';

database.connect();
server.start();
