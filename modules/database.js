'use strict';

var mysql  = require('mysql');
var config = require('config');
var connection;

exports.dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

exports.isConnected = function ()
{
    if (typeof connection !== 'undefined') {
        return connection.isConnected();
    }

    return false;
};

exports.connect = function ()
{
    connection = mysql.createConnection(config.get('database'));

    connection.connect(handleConnectionError);

    connection.on('error', onError);
};

exports.query = function (sql, callback)
{
    connection.query(sql, function (err) {
        if (err) {
            onError(err);
            console.log('Unable to run database query. ' + err + ' ' + sql);

            if (typeof callback === 'function') {
                callback([], err.code);
            }

            return;
        }

        if (typeof callback === 'function') {
            callback();
        }
    });
};

exports.fetch = function (sql, callback)
{
    connection.query(sql, function (err, rows) {
        if (err) {
            onError(err);
            console.log('Unable to fetch data from database. ' + err + ' ' + sql);

            if (typeof callback === 'function') {
                callback([], err.code);
            }

            return;
        }

        if (typeof callback === 'function') {
            callback(rows);
        }
    });
};

exports.insert = function (sql, callback)
{
    connection.query(sql, function (err, result) {
        if (err) {
            onError(err);
            console.log('Unable to save data to database. ' + err + ' ' + sql);

            if (typeof callback === 'function') {
                callback(null, err.code);
            }

            return;
        }

        if (typeof callback === 'function') {
            callback(result.insertId);
        }
    });
};

exports.insertObject = function (table, object, callback)
{
    var sql    = 'INSERT INTO `' + table + '` (`' + Object.keys(object).join('`, `') + '`) VALUES ',
        values = [];

    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            values.push(sanitizeValue(object[key]));
        }
    }

    sql += '(' + values.join(', ') + ')';

    this.insert(sql, callback);
};

exports.update = function (sql, callback)
{
    connection.query(sql, function (err) {
        if (err) {
            onError(err);
            console.log('Unable to update data in database. ' + err + ' ' + sql);

            if (typeof callback === 'function') {
                callback(err.code);
            }

            return;
        }

        if (typeof callback === 'function') {
            callback();
        }
    });
};

exports.updateObject = function (table, id, object, callback)
{
    var sql = 'UPDATE `' + table + '` SET ',
        valueCount = 0;

    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (valueCount > 0) {
                sql += ', ';
            }

            sql += '`' + key + '` = ' + sanitizeValue(object[key]);
        }

        valueCount++;
    }

    sql += ' WHERE `id` = ' + id;

    this.update(sql, callback);
};

function sanitizeValue(value)
{
    if (value !== null && typeof value === 'object' && value._isAMomentObject) {
        value = value.format(module.exports.dateTimeFormat);
    }

    return connection.escape(value);
}

function handleConnectionError(exception)
{
    if (exception) {
        console.log('Exception occurred when trying to connect to database. ' + exception);
        throw exception;
    } else {
        console.log('Database connected as id ' + connection.threadId + '.');
        exports.fetch('SET time_zone = "+00:00"');
    }
}

function onError(exception) {
    switch (exception.code) {
        case 'PROTOCOL_CONNECTION_LOST':
            exports.connect();

            break;
        case 'EPIPE':
            setTimeout(resetConnection, 100);
            break;
        case 'ECONNREFUSED':
            setTimeout(resetConnection, 100);
            break;
        default:
            console.log('Unknown database error: ' + exception);
            throw exception;
    }
}

function resetConnection()
{
    try {
        connection.destroy();
    } catch (e) {}

    exports.connect();
}
