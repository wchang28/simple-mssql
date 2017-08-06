"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var sql = require("mssql");
var events = require("events");
var _ = require("lodash");
var connect_retry_1 = require("connect-retry");
var SimpleMSSQL = (function (_super) {
    __extends(SimpleMSSQL, _super);
    function SimpleMSSQL(__sqlConfig, options) {
        var _this = _super.call(this) || this;
        _this.__sqlConfig = __sqlConfig;
        options = (options || SimpleMSSQL.defaultOptions);
        _this.__options = _.assignIn({}, SimpleMSSQL.defaultOptions, options);
        _this.__state = "not-connected";
        _this.__connection = _this.createPool(_this.msnodesqlv8, _this.__sqlConfig);
        _this.__connection.on("error", function (err) {
            _this.emit("error", err);
        });
        _this.__connectRetry = connect_retry_1.get(_this.__connection, _this.__options.reconnectIntervalMS);
        _this.__connectRetry.on("connecting", function () {
            _this.setState("connecting");
            _this.emit("connecting");
        }).on("connected", function (pool) {
            _this.setState("connected");
            _this.emit("connect", pool);
        }).on("error", function (err) {
            _this.emit("error", err);
        });
        return _this;
    }
    Object.defineProperty(SimpleMSSQL.prototype, "msnodesqlv8", {
        get: function () { return (!this.__sqlConfig.user || !this.__sqlConfig.password ? true : false); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleMSSQL.prototype, "Options", {
        get: function () { return this.__options; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleMSSQL.prototype, "Connection", {
        get: function () { return this.__connection; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleMSSQL.prototype, "State", {
        get: function () { return this.__state; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleMSSQL.prototype, "Connected", {
        get: function () { return this.State === "connected"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleMSSQL.prototype, "Connecting", {
        get: function () { return this.State === "connecting"; },
        enumerable: true,
        configurable: true
    });
    SimpleMSSQL.prototype.setState = function (newState) {
        var oldState = this.__state;
        if (this.__state !== newState) {
            this.__state = newState;
            this.emit("change", newState, oldState);
        }
    };
    SimpleMSSQL.prototype.closeConnection = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.setState("disconnecting");
            _this.__connection.close()
                .then(function () {
                //console.log(":-) connection.close() success");
                _this.__connection = null;
                _this.setState("not-connected");
                _this.emit("close");
                resolve();
            }).catch(function (err) {
                //console.error("!!! connection.close() failed !!! err=" + err.toString());
                _this.__connection = null;
                _this.setState("not-connected");
                _this.emit("close");
                reject(err);
            });
        });
    };
    SimpleMSSQL.prototype.createPool = function (msnodesqlv8, config) {
        if (msnodesqlv8) {
            var nsql = require("mssql/msnodesqlv8");
            return new nsql.ConnectionPool(config);
        }
        else
            return new sql.ConnectionPool(config);
    };
    SimpleMSSQL.prototype.query = function (sqlString, params) {
        if (!this.Connected)
            return Promise.reject(SimpleMSSQL.NOT_CONNECTED_ERR);
        else {
            var request = this.Connection.request();
            if (params) {
                for (var field in params)
                    request.input(field, params[field]);
            }
            return request.query(sqlString);
        }
    };
    SimpleMSSQL.prototype.execute = function (storedProc, params) {
        if (!this.Connected)
            return Promise.reject(SimpleMSSQL.NOT_CONNECTED_ERR);
        else {
            var request = this.Connection.request();
            if (params) {
                for (var field in params)
                    request.input(field, params[field]);
            }
            return request.execute(storedProc);
        }
    };
    SimpleMSSQL.prototype.connect = function () {
        if (this.State === "not-connected")
            this.__connectRetry.start();
    };
    SimpleMSSQL.prototype.disconnect = function () {
        if (!this.Connected)
            return Promise.reject(SimpleMSSQL.NOT_CONNECTED_ERR);
        else
            return this.closeConnection();
    };
    SimpleMSSQL.defaultOptions = { reconnectIntervalMS: 3000 };
    SimpleMSSQL.NOT_CONNECTED_ERR = { error: 'internal-server-error', error_description: 'not connected to the database' };
    return SimpleMSSQL;
}(events.EventEmitter));
exports.SimpleMSSQL = SimpleMSSQL;
__export(require("mssql"));
function get(sqlConfig, options) { return new SimpleMSSQL(sqlConfig, options); }
exports.get = get;
