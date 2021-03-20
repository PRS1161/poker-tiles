const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const allUsersTransactionHistorySchema = new Schema({
    player: { type: Schema.Types.ObjectId, ref: 'player' },
    receiverId: { type: 'string', default: '' },
    receiverRole: { type: 'string', default: '' },
    providerId: { type: 'string', default: '' },
    providerRole: { type: 'string', default: '' },
    providerEmail: { type: 'string', default: '' },
    chips: { type: 'string', default: '' },
    cash: { type: 'string', default: '' },
    message: { type: 'string', default: '' },
    transactionNumber: { type: 'string', default: '' },
    beforeBalance: { type: 'string', default: '' },
    afterBalance: { type: 'string', default: '' },
    type: { type: 'string', default: '' },  // deposit, withdraw
    status: { type: 'string', default: '' }, // success, inProgress, cancel
    game: { type: 'string' }, default: '',
    rackFromId: { type: 'string', default: '' },
    rackToId: { type: 'string', default: '' },
    rackFrom: { type: 'string', default: '' },
    rackTo: { type: 'string', default: '' },
    won: { type: 'number', default: '' },
    rackPercent: { type: 'string', default: '' },
    totalRack: { type: 'number', default: '0' },
    gameNumber: { type: 'string', default: '' },
    rackToAfter_balance: { type: 'number', default: '' },
    rackToBefore_balance: { type: 'number', default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sessionId:{ type: 'string', default: '' },
    user_id: { type: 'string', default: '' },
    username: { type: 'string', default: '' },
    gameId: { type: 'string', default: '' },                   //in case of deposit/won on game
    bet_amount: { type: 'number', default: 0 },
    previousBalance: { type: 'number', default: 0 },
    category: { type: 'string', default: '' },   //debit/credit
    remark: { type: 'string', default: '' },   //deposit/won on game <game_id>, deposit/withdraw coins
    isTournament: { type: 'string', default: '' },
    receiverName: { type: 'string', default: '' },
    rakeChips: { type: 'string' },
    adminChips: { type: 'string' },
    uniqId:{ type: 'string',default:'' },
    // chips: { type: 'number' },
    // receiverId:{ type: 'string' },
    // providerId:{ type: 'string' },
    // afterBalance: { type: 'number' },
    // beforeBalance: { type: 'number' },
    // gameNumber: { type: 'string' },   //debit/credit
    // type: { type: 'string', },   //bet/win/revert/rake/entry

}, { collection: 'allUsersTransactionHistory', versionKey: false });

mongoose.model('allUsersTransactionHistory', allUsersTransactionHistorySchema);
