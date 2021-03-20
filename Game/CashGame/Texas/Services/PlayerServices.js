'use strict';
var Sys = require('../../../../Boot/Sys');

const mongoose = require('mongoose');
const playerModel  = mongoose.model('player');

module.exports = {
    getOneByData: async function(data){
        console.log('Find By Data:',data)
        try {
			return  await playerModel.findOne(data);
        } catch (error) {
            Sys.Log.info('Error in getOneByData : ' + error);
        }
    },

	  getByData: async function(data){
        try {
			return  await playerModel.find(data);
        } catch (error) {
            Sys.Log.info('Error in getByData : ' + error);
        }
    },

    getById: async function(id){
        try {
			return  await playerModel.findById(id);
        } catch (error) {
            Sys.Log.info('Error in getByData : ' + error);
        }
	},

    getByIds: async function(ids) {
        try {
          return  await playerModel.find({_id: ids});
        } catch (error) {
          Sys.Log.info('Error in getByData : ' + error);
        }
	  },

    update: async function(id,query){
        try {
            console.log("player update called:", id);
            let  player = await playerModel.updateOne({_id: id},query, {new: true});
			return player;

        } catch (error) {
            Sys.Log.info('Error in Update Player : ' + error);
        }
	  },

}
