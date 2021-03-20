const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = new Schema({
    roomId: {
        type: 'string',
        required: true
    },
    otherData     : Schema.Types.Mixed , // Store Some other Data
    gameNumber: {
        type: 'string'
    },
    smallBlind: {
        type: 'number',
        default: 0
    },
    bigBlind: {
        type: 'number',
        default: 0
    },
    status: {
        type: 'string',
        default: ''
    },
    pot: {
        type: 'number',
        default: 0
    },
    roundName: {
        type: 'string',
        default: ''
    },
    betName: {
        type: 'string',
        default: ''
    },
    bets: {
        type: 'array',
        default: []
    },
    roundBets: {
        type: 'array',
        default: []
    },
    deck: {
        type: 'array',
        default: []
    },
    board: {
        type: 'array',
        default: []
    },
    history: {
        type: 'array',
        default: []
    },
    players: {
        type: 'array',
        default: []
    },
    winners: {
        type: 'array',
        default: []
    },
    sidePotAmount:{
        type: 'array',
        default: []
    },
    playerSidePot:{
        type: 'array',
        default: []
    },
    gamePot:{
        type: 'array',
        default: []
    },
    gameRevertPoint :{
        type: 'array',
        default: []
    },
    gameMainPot: {
        type: 'number',
        default: 0
    },
    rakePercenage: {
        type: 'number',
        default: 0
    },
    winnerDetails:{
        type: 'array',
        default: []
    },
    updatedAt : { type: Date, default: Date.now() },
    createdAt : { type: Date, default: Date.now() }
},{ collection: 'game',versionKey: false });
mongoose.model('game', GameSchema);

 
