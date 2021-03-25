const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RoomSchema = new Schema({
    tableNumber     : { type: 'string', required: true },
    dealer		      : { type: 'number', required: true },
    smallBlind      : { type: 'number', required: true },
    bigBlind	      : { type: 'number', required: true },
    smallBlindIndex : { type: 'number', required: true },
    bigBlindIndex   : { type: 'number', required: true },
    minPlayers      : { type: 'number', required: true },
    maxPlayers      : { type: 'number', required: true },
    otherData       : Schema.Types.Mixed ,
    minBuyIn        : { type: 'number' },
    maxBuyIn        : { type: 'number' },
    currentPlayer   : { type: 'number', allowNull: true },
    players         : { type: 'array' },
    gameWinners     : { type: 'array' },
    gameLosers      : { type: 'array' },
    turnBet         : { type: 'array' },
    timerStart      : { type: 'boolean' },
    status          : { type: 'string' }, // closed for deleted rooms
    game            : { type: Schema.Types.ObjectId, ref: 'game' },
    createdAt       : { type: Date, default: Date.now() },
    updatedAt       : { type: Date, default: Date.now() }
},{ 
  collection: 'room',
  versionKey: false
});
mongoose.model('room', RoomSchema);
