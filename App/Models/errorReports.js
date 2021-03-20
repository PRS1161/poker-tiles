const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const errorReportsSchema = new Schema({
    gameNumber: { type: 'string', default: '' },
    gameTotalChips: { type: 'number', default: '0' },
    winners: {
        type: 'array',
        default: []
    },
    pot: {
        type: 'number',
        default: 0
    },
    roomId: {
        type: 'string',
        default: ''
    },
    rakePercenage: {
        type: 'number',
        default: 0
    },
    gameId: { type: 'string', default: '' },                   //in case of deposit/won on game
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

}, { collection: 'errorReports', versionKey: false });

mongoose.model('errorReports', errorReportsSchema);
