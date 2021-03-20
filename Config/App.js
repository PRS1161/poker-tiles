module.exports = {
	details : {
		name : 'Poker Tiles'
	},
	maxPlayers : 4,
	logger : {
		logFolder : 'Log', // Change Your Name With Your Custom Folder
		logFilePrefix : 'game'
	},
	defaultUserLogin:{
		name: 'Poker Tiles',
		email: 'pokerTiles@gmail.com',
		password: '123456',
		role: 'admin',
		avatar: 'user.png'
	},
	mailer: {
		auth: {
			user: 'pokerTiles@gmail.com',
			pass: 'AIS@#!@#$!@SW',
		},
		defaultFromAddress: 'Poker Tiles <pokerTiles@gmail.com>'
	},
}
