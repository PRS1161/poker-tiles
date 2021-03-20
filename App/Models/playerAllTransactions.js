const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ChipsSchema = new Schema({
	user_id: { type: 'string', required: true },
	username: { type: 'string', required: true },
	gameId: { type: 'string' },                   //in case of deposit/won on game
	gameNumber: { type: 'string' },   //debit/credit
	tableId: { type: 'string' },
	tableName: { type: 'string' },
	chips: { type: 'number' },
	previousBalance: { type: 'number' },
	afterBalance: { type: 'number' },
	category: { type: 'string', required: true },   //debit/credit
	type: { type: 'string', required: true },   //bet/win/revert/rake/entry
	remark: { type: 'string' },   //deposit/won on game <game_id>, deposit/withdraw coins
	isTournament:{ type: 'string' },
	isGamePot:{ type: 'string' },
},{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }},
 { collection: 'playerAllTransactions' });

mongoose.model('playerAllTransactions', ChipsSchema);
