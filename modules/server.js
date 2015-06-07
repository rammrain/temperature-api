'use strict';

var express    = require('express');
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var moment     = require('moment');
var app        = express();
var router     = express.Router();
var database   = require('./database');

exports.start = function ()
{
    // disallow all robots
    app.use(function (req, res, next) {
        if (req.url === '/robots.txt') {
            res.type('text/plain');
            res.send("User-agent: *\nDisallow: /");
        } else {
            next();
        }
    });

    // configure body parser
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // log to console
    app.use(morgan('dev'));

    routes();

    app.use('/', router);

    app.listen(3000);
};

function routes()
{
    router.route('/temperature').post(function (req, res) {
        database.fetch("SELECT * FROM sensor WHERE serial = '" + req.body.sensor + "'", function (rows) {
            if (rows.length) {
                var sensor = rows[0];

                if (sensor) {
                    database.insertObject('temperature', {
                        sensor_id:    sensor.id,
                        temperature:  req.body.temperature * 10,
                        date_created: moment()
                    });
                }
            }
        });

        res.json({
            success: true
        });
    });
}
