var sql = require('mssql');

function SimpleMSSQL(sqlConfig) {
	// onDone(err, recordsets)
	this.query = function(sqlString, params, onDone) {
		var connection = new sql.Connection(sqlConfig, function(err) {
			if (err) {
				if (typeof onDone === 'function') onDone(err, null);
			} else {
				var request = new sql.Request(connection);
				request.multiple = true;
				if (params) {
					for (var field in params)
						request.input(field, params[field]);
				}
				request.query(sqlString, function(err, recordsets) {
					connection.close();
					if (typeof onDone === 'function') onDone(err, recordsets);
				});
			}
		});
		connection.on('close', function() {
		});
		connection.on('error', function(err) {
			if (typeof onDone === 'function') onDone(err, null);
		});
	};
	// onDone(err, recordsets)
	this.execute = function(storedProc, params, onDone) {
		var connection = new sql.Connection(sqlConfig, function(err) {
			if (err) {
				if (typeof onDone === 'function') onDone(err, null);
			} else {
				var request = new sql.Request(connection);
				if (params) {
					for (var field in params)
						request.input(field, params[field]);
				}
				request.execute(storedProc, function(err, recordsets) {
					connection.close();
					if (typeof onDone === 'function') onDone(err, recordsets);
				});
			}
		});
		connection.on('close', function() {
		});
		connection.on('error', function(err) {
			if (typeof onDone === 'function') onDone(err, null);
		});
	};
}

SimpleMSSQL.SimpleMSSQL = SimpleMSSQL;
module.exports = SimpleMSSQL;