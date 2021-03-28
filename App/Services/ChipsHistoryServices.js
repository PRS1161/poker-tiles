'use strict';
const mongoose = require('mongoose');
var Sys = require('../../Boot/Sys');
const chipsModel = mongoose.model('chipsHistory');
const transactionModel = mongoose.model('allUsersTransactionHistory');
module.exports = {

	getByData: async function(data){
      try {
        return await chipsModel.find(data);
      } catch (e) {
        console.log("ChipsHistoryServices Error in getByData",e);
        return new Error(e);
      }
	},

  getChipsData: async function(data){
      try {
        return await chipsModel.find(data);
      } catch (e) {
        console.log("ChipsHistoryServices Error in getChipsData",e);
        return new Error(e);
      }
	},

  getChipsHistoryCount: async function(data){
      try {
        return await chipsModel.countDocuments(data);
      } catch (e) {
        console.log("ChipsHistoryServices Error in getChipsHistoryCount",e);
        return new Error(e);
      }
  },

	getSingleChipsData: async function(data){
      try {
        return await chipsModel.findOne(data);
      } catch (e) {
        console.log("ChipsHistoryServices Error in getSingleChipsData",e);
        return new Error(e);
      }
  },

  getChipsDatatable: async function(query, length, start){
      try {
        return await chipsModel.find(query).skip(start).limit(length);
      } catch (e) {
        console.log("ChipsHistoryServices Error in getChipsDatatable",e);
        return new Error(e);
      }
	},

  insertChipsData: async function(data){
      try {
        return await chipsModel.create(data);
      } catch (e) {
        console.log("ChipsHistoryServices Error in insertChipsData",e);
        return new Error(e);
      }
	},

  deleteChips: async function(data){
      try {
        return await chipsModel.deleteOne({_id: data});
      } catch (e) {
        console.log("ChipsHistoryServices Error in deleteChips",e);
        return new Error(e);        
      }
  },

	updateChipsData: async function(condition, data){
      try {
        return await chipsModel.update(condition, data);
      } catch (e) {
        console.log("ChipsHistoryServices Error in updateChipsData",e);
        return new Error(e);                
      }
	},



  getData: async function(data, select, setOption,sort){
      try {
        return await transactionModel.find(data, select, setOption).lean();
      } catch (e) {
        console.log("ChipsHistoryServices Error  in getData",e);
        return new Error(e);
      }
  },


  createTransaction: async function(data){
      try {
        return await transactionModel.create(data);
      } catch (e) {
        console.log("ChipsServices  Error in createTransaction",e);
        return new Error(e);
      }
  },


  getDataTnxData: async function(query,length,start,sort){
      try {
        return await transactionModel.find(query).limit(length).skip(start).sort(sort).lean();
      } catch (e) {
        console.log('ChipsServices Error in getData : ' + e);
        return new Error(e);
      }
  },


  getDataAggregate: async function(query,length,start,sort){
      try {
            return await transactionModel.aggregate( [
          {
            $facet: {
              "firstData": [
                { $match: query },
                {$group: {
                    _id: null,
                    firstRecord: {$first : "$$ROOT"},
                    lastRecords: {$last : "$$ROOT"}
                }},
              ],
              "secondData": [
                { $match: query },
                {$group: {
                    _id: null,
                    count: {$sum : 1}
                }},
              ],
              "thirdData": [
                {$match: query},
                {$sort:sort},
                {$skip:start},
                {$limit: length},
              ]
            }
          }
        ])
      }
      catch (e) {
        console.log('ChipsServices Error in getData : ' + e);
        return new Error(e);
      }
  },


  getSingleData: async function(query){
      try {
        return await transactionModel.findOne(query).lean();
      }
      catch (e) {
        console.log('ChipsServices Error in getSingleData : ' + e);
        return new Error(e);
      }
  },

  updateTransactionData: async function(condition, data){
      try {
        return await transactionModel.update(condition, data);
      } catch (e) {
        console.log("ChipsServices Error in updateTransactionData",e);
        return new Error(e);
      }
  },


}
