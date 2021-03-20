'use strict';
var Sys = require('../../../../Boot/Sys');

const mongoose = require('mongoose');
const chipModel  = mongoose.model('chipsHistory');
const errorModel  = mongoose.model('errorReports');
const transactionModel  = mongoose.model('allUsersTransactionHistory');
const transactionOldModel  = mongoose.model('transactions');

// const gameModel  = mongoose.model('game');

module.exports = {

    create: async function(data){
        try {
          let gameSave = new chipModel(data);
          game = await chipModel.save()
			    return  await chipModel.find(data);
        } catch (error) {
          console.log('ChipsServices Error in create : ' + error);
          return new Error(error);
        }
    },
    
    createErrorLog: async function(data){
      try {
        return await errorModel.create(data);
      } catch (error) {
        console.log("ChipsServices  Error in createErrorLog",error);
          return new Error(error);
      }
  },

    createTransaction: async function(data){
        try {
			    return await transactionModel.create(data);
        } catch (error) {
          console.log("ChipsServices  Error in createTransaction",error);
            return new Error(error);
        }
    },

    getData: async function(query,length,start,sort){
      try {
        return await transactionModel.find(query).limit(length).skip(start).sort(sort).lean();
      }
      catch (error) {
        console.log('ChipsServices Error in getData : ' + error);
        return new Error(error);
      }
    },

    getOldData: async function(query,length,start,sort){
      try {
        return await transactionOldModel.find(query).limit(length).skip(start).sort(sort).lean();
      }
      catch (error) {
        console.log('ChipsServices Error in getData : ' + error);
        return new Error(error);
      }
    },
    getSingleData: async function(query){
      try {
        return await transactionModel.findOne(query).lean();
      }
      catch (error) {
        console.log('ChipsServices Error in getSingleData : ' + error);
        return new Error(error);
      }
    },

    updateTransactionData: async function(condition, data){
        try {
          return await transactionModel.update(condition, data);
        } catch (e) {
          console.log("ChipsServices Error in updateTransactionData",e);
          return new Error(error);
        }
    },
 
}
