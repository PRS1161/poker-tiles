'use strict';
var Sys = require('../../../Boot/Sys');

const mongoose = require('mongoose');
const { func } = require('joi');
const roomModel  = mongoose.model('room');

module.exports = { 
    
  getCount: async function(){
    try {
      return await roomModel.countDocuments({});
    }
    catch (error) {
      console.log('Room Service Error in getCount : ' + error);
      return new Error(error);
    }
  },

  insertTableData: async function(data){
    try {
      return await roomModel.create(data);
    }
    catch (e) {
      console.log("Error Inserting Table", e);
      return new Error(e);
    }
	},

  resetAllRoom : async function(){
    try {
      let rooms = await roomModel.find({});
      for(let r = 0; r < rooms.length; r += 1){
        if( rooms[r].isTournamentTable == false){
          rooms[r].status = 'Waiting';
          try{
            console.log("player", rooms[r].players.length)
            if(rooms[r].players.length > 0){
              for(let p =0; p < rooms[r].players.length; p++){
               let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(rooms[r].players[p].id);
                if (dataPlayer && rooms[r].players[p].isAllinPlayersChipsAssigned == false) {
                  let chips = parseFloat(dataPlayer.chips) + parseFloat(rooms[r].players[p].chips);
                  console.log("total chips", chips, rooms[r].players[p].id);
                  let traNumber = + new Date()
                        let sessionData={
                          sessionId:rooms[r].players[p].sessionId,
                          uniqId:rooms[r].players[p].uniqId,
                          user_id:rooms[r].players[p].id,
                          username:rooms[r].players[p].playerName,
                          chips: rooms[r].players[p].chips,
                          previousBalance: parseFloat(dataPlayer.chips),
                          afterBalance: parseFloat(chips),
                          type:"leftChips",
                          remark:"game left",
                          category:"credit",
                          transactionNumber: 'DEP-' + traNumber,
                        }
                        await Sys.Game.Common.Services.ChipsServices.insertData(sessionData);	
                  let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(rooms[r].players[p].id, { chips: chips });  
                } 
              }
            }else{
              console.log("players not found");
            }
          }catch(e){
            Sys.Log.info('Error in while assigning chips during game reset server : ' + e);
          } 
        }else{
          rooms[r].status = 'Closed';
        }
        rooms[r].timerStart = false;
        rooms[r].players = [];
        rooms[r].gameWinners = [];
        rooms[r].gameLosers = [];
        rooms[r].dealer = 0;
        rooms[r].game = null;
        rooms[r].turnBet = [];
        let updatedGame = await roomModel.updateOne({
        _id: rooms[r].id
        }, rooms[r], {
          new: true
        });
      }
    }
    catch (error) {
      Sys.Log.info('Error in reset All Room  : ' + error);
    }
  },
    
  updateRoomData: async function(condition,data){
    try{
      return await roomModel.update(condition, data);
    }catch(e){
      console.log("Error in update room data",e);
      return new Error(e);
    }
  },

  getById: async function(id){
    try {
      return await roomModel.findById(id);
    }
    catch (error) {
      Sys.Log.info('Error in getByData : ' + error);
    }
  },

  getByData: async function(query){
    try {
      return await roomModel.find(query);
    } catch (e) {
      console.log("Error",e);
    }
  },

  getByDataPara : async function () {
    try {
      return await roomModel.findOne({}).sort({_id:-1}).limit(1);
    } catch (e) { 
      console.log("Error ",e);
    }
  }
}
 
 
