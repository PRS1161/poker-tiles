const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const playerTransection = new Schema({
	gameId: {type: 'string',required: true},
	gameNumber: {type: 'string',required: true},
	winPlayerDetails: {type: Array,required: true},
	gameBetPlayer: {type: Array,required: true},
	rack: {type: 'string',required: true},
	totalRackDeductionWinner: {type: 'number',required: true},
	type: {type: 'string',required: true},
	remark: {type: 'string',required: true},	

}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },{ collection: 'playerTransectionHistory'});

mongoose.model('playerTransectionHistory', playerTransection);



// const ChipsSchema = new Schema({
// 	user_id: { type: 'string', required: true },
// 	username: { type: 'string', required: true },
// 	gameId: { type: 'string' },                   //in case of deposit/won on game
// 	chips: { type: 'number', required: true },
// 	previousBalance: { type: 'number' },
// 	afterBalance: { type: 'number' },
// 	category: { type: 'string', required: true },   //debit/credit
// 	gameNumber: { type: 'string' },   //debit/credit
// 	type: { type: 'string', required: true },   //bet/win/revert/rake/entry
// 	remark: { type: 'string' },   //deposit/won on game <game_id>, deposit/withdraw coins
// },{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }},
//  { collection: 'transactions' });


