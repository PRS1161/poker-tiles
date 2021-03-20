'use strict';
var Sys = require('../../../Boot/Sys');
const mongoose = require('mongoose');
const playerModel  = mongoose.model('player');

module.exports = {
  create: async function(data){
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
    } catch (error) {
      console.log("Error in create:" + error);
      return new Error(error);
    }
  },
  update: async function(id,query){
    try {
      let player = await playerModel.updateOne({_id: id},query, {new: true});
      return player;
    } catch (error) {
      console.log('Error in update:' + error);
      return new Error(error);
    }
  },
  getOneByData: async function(data, select, setOption){
    try {
      return await playerModel.findOne(data, select, setOption);
    } catch (error) {
      console.log('Error in getOneByData:' + error);
      return new Error(error);
    }
  },

  getByData: async function(data, select, setOption){
    try {
      return await playerModel.find(data, select, setOption);
    } catch (error) {
      console.log('Error in getByData:' + error);
      return new Error(error);
    }
  },

  getById: async function(id){
    try {
      return await playerModel.findById(id);
    } catch (error) {
      console.log('Error in getById:' + error);
      return new Error(error);
    }
  },
  getByIdForLocation: async function(id){
    try {
      return await playerModel.find({ _id : id });
    } catch (error) {
      console.log('Error in getByData:' + error);
      return new Error(error);
    }
  },

  updatePlayerData: async function(condition, data){
    try {
      return await playerModel.update(condition, data);
    } catch (error) {
      console.log("Error in updatePlayerData:" + error);
      return new Error(e);
    }
  },

  getPlayerCount: async function(data, select, setOption){
    try {
      return await playerModel.countDocuments(data, select, setOption);
    } catch (error) {
      console.log('Error in getPlayerCount:' + error);
      return new Error(error);
    }
  },

  aggregateQuery : async function(data){
    try {
      return await playerModel.aggregate(data);
    } catch (error) {
      console.log("Error in aggregateQuery:" + error);
      return new Error(e);
    }
  },

}
