const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ChipsSchema = new Schema({
	user_id: { type: 'string' },
	username: { type: 'string' },
	gameId: { type: 'string' },  
	chips: { type: 'number' },
	bet_amount: { type: 'number' },
	receiverId:{ type: 'string' },
	providerId:{ type: 'string' },
	previousBalance: { type: 'number' },
	afterBalance: { type: 'number' },
	beforeBalance: { type: 'number' },
	category: { type: 'string' },
	gameNumber: { type: 'string' },
	type: { type: 'string' },   
	remark: { type: 'string' }, 
	isTournament:{ type: 'string' },
	receiverName:{ type: 'string' },	
	uniqId:{ type: 'string' },
	sessionId:{ type: 'string' },
	// updatedAt  		: { type : Date, default : Date.now },
},{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }},
 { collection: 'transactions' });

mongoose.model('transactions', ChipsSchema);
