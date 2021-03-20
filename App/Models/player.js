const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PlayerSchema = new Schema({
	uniqId : {
		type : 'string',
		required : true
	},
	device_id: {
		type: 'string',
		required: true
	},
	appid: {
		type: 'string',
		default: ''
	},
	username: {
		type: 'string',
		default: ''
		//required: true
	},
	profilePic: {
		type: 'number',
		default: 0
	},
	email: {
		type: 'string',
		default: ''
	},
	password: {
		type: 'string',
		default: ''
	},
	chips: {
		type: 'number',
		required: true
	},
	status: {
		type: 'string',
		default: 'active'
	},
	socketId: {
		type: 'string',
		default: ''
	},
	fcmId: {
		type: 'string',
		default: ''
	},
	platform_os: {
		type: 'string',
		default: 'other'
	},
	avatar: { 
		type: 'string',
		default: null 
	}, // if player upload image as profile image
	updatedAt : {
		type: Date,
		default: Date.now()
	},
	createdAt : {
		type: Date,
		default: Date.now() 
	},
	resetPasswordToken: {
		type: 'string',
		default: null
	}, // Forgot password token
	resetPasswordExpires: {
		type: 'number',
		default: 0
	},
},{ collection: 'player',versionKey: false });

mongoose.model('player', PlayerSchema);
