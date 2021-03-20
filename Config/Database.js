module.exports = {
	connectionType :  'local',
	option : {
		autoIndex: false, // Don't build indexes
		reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
		reconnectInterval: 500, // Reconnect every 500ms
		poolSize: 10, // Maintain up to 10 socket connections
		bufferMaxEntries: 0,
		useNewUrlParser: true,
		poolSize: 2,
		promiseLibrary: global.Promise
	},
	
	local: {
		mode: 'local',
		mongo: {
			host: 'localhost',
			port: 27017,
			user: 'root',
			password: '',
			database: 'pokertiles'
		}
	},
	production: {
		mode: 'production',
		mongo: {
			host: '172.31.23.105', // internal/private IP
			port: 27017,
			user: 'pokertiles',
			password : 'GJHge78eTy',
			database: 'pokertiles'
		}
	}
}
