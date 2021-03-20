'use strict';
var Sys = require('../../../../Boot/Sys');

const mongoose = require('mongoose');
const playerAllTransactionModel  = mongoose.model('playerAllTransactions');

// const gameModel  = mongoose.model('game');

module.exports = {

    createTransaction: async function(data){
        try {
          return  await playerAllTransactionModel.create(data);
        } catch (error) {
            Sys.Log.info(' Error in save player all createTransaction : ' + error);
        }
    },

    getSingleData: async function(query){
      try {
        return await playerAllTransactionModel.findOne(query).sort({'createdAt':'-1'}).lean();
      }
      catch (error) {
        Sys.Log.info('Chips Service Error in getSingleData : ' + error);
      }
    }
}
