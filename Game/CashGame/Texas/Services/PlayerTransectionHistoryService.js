'use strict';
var Sys = require('../../../../Boot/Sys');

const mongoose = require('mongoose');
const playerTransectionHistoryModel  = mongoose.model('playerTransectionHistory');

module.exports = {
  getAllPlayerTransectionHistrory: async function(query){
    try {
      return await playerTransectionHistoryModel.find(query).lean();
    }
    catch (error) {
      Sys.Log.info('getAllPlayerTransectionHistrory Service Error in playerTransectionHistory : ' + error);
    }
  },
  insertPlayerTransectionHistrory: async function(data){
    try {
      return await playerTransectionHistoryModel.create(data);
    } catch (e) {
      console.log("insertPlayerTransectionHistrory Service Error in playerTransectionHistory",e);
      throw e;
    }
}, 



}
