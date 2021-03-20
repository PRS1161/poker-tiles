'use strict'; 
const mongoose = require('mongoose');
var Sys = require('../../Boot/Sys');
const playerModel  = mongoose.model('player');

module.exports = {

	getByData: async function(data){
        //console.log('Find By Data:',data)
        try {
          return  await playerModel.find(data);
        } catch (e) {
          console.log("PlayerServices Error in getByData",e);
          return new Error(e);
        }
	},

  getPlayerData: async function(data){
        try {
            return  await playerModel.find(data);
        } catch (e) {
          console.log("PlayerServices Error in getPlayerData",e);
          return new Error(e);
        }
	},

  getPlayerCount: async function(data){
    try {
          return  await playerModel.countDocuments(data);
        } catch (e) {
          console.log("PlayerServices Error in getPlayerCount",e);
          return new Error(e);
    }
  },

	getSinglePlayerData: async function(data,column){
        try {          
          return  await playerModel.findOne(data).select(column);
        } catch (e) {
          console.log("PlayerServices Error in getSinglePlayerData",e);
          return new Error(e);
        }
	},

  getPlayerDatatable: async function(query, length, start,column){
        try {
          if(length==-1)
          {
            return  await playerModel.find(query).lean();
          }else{
            return  await playerModel.find(query).skip(start).limit(length).select(column).lean();
          }
        } catch (e) {
          console.log("PlayerServices Error in getPlayerDataTable",e);
          return new Error(e);
        }
	},

  insertPlayerData: async function(data){
        try { 
          let uniqId = (await playerModel.findOne().select(['uniqId']).sort({_id:-1}));
          if(uniqId == null){
            data.uniqId = 'PT' + 1000;
          }else{
            let re = /^[0-9]+$/;
            if(!re.test(uniqId.uniqId)){
              uniqId.uniqId = uniqId.uniqId.replace(/[A-Za-z]/g, '');
            }
            data.uniqId = 'PT' + parseInt(parseInt(uniqId.uniqId) + 1);
          }
          console.log("UniqId :", data.uniqId);
          return await playerModel.create(data);
        } catch (e) {
          console.log("PlayerServices Error in insertPlayerData",e);
          return new Error(e);
        }
	},

  deletePlayer: async function(data){
        try {
          return await playerModel.deleteOne({_id: data});
        } catch (e) {
          console.log("PlayerServices Error in deletePlayer",e);
          return new Error(e);
        }
  },

	updatePlayerData: async function(condition, data){
        try {
          return await playerModel.update(condition, data);
        } catch (e) {
          console.log("PlayerServices Error in updatePlayerData",e);
          return new Error(e);
        }
	},

  getLimitPlayer: async function(data){
        try {
          return await playerModel.find(data).limit(8).sort({createdAt:-1});
        } catch (e) {
          console.log("PlayerServices Error in getLimitPlayer",e);
          return new Error(e);
        }
  },

  getLimitedPlayerWithSort: async function(data,limit,sortBy,sortOrder){
        try {
          return  await playerModel.find(data).sort({chips:sortOrder}).limit(limit);
        } catch (e) {
          console.log("PlayerServices Error in getLimitedPlayerWithSort",e);
          return new Error(e);
        }
  },
 
  aggregateQuery : async function(data){
    try {
      return  await playerModel.aggregate(data);
    } catch (e) {
      console.log("PlayerServices Error in aggregateQuery",e);
      return new Error(e);
    }
  },

  updateMultiplePlayerData: async function(condition, data){
        try {
          await playerModel.update(condition, data, {multi: true});
        } catch (e) {
          console.log("PlayerServices Error in updateMultiplePlayerData",e);
          return new Error(e);
        }
  },

  getPlayerExport: async function(query, pageSize){
        try {
          return  await playerModel.find(query).limit(pageSize);
        } catch (e) {
          console.log("PlayerServices Error in getPlayerExport",e);
          return new Error(e);
        }
  },

  getLoggedInTokens: async function(){
    try {
      return await playerModel.find({loginToken: { $ne: null }}).select({ loginToken: 1, _id: 0 });
    } catch (e) {
      console.log("Error",e);
      return new Error(e);
    }
  },

}
