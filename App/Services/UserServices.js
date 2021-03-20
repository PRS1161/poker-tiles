'use strict';

const mongoose = require('mongoose');
var Sys = require('../../Boot/Sys');
const userModel  = mongoose.model('user');


module.exports = {

	getByData: async function(data){
        //console.log('Find By Data:',data)
        try {
          return  await userModel.find(data);
        } catch (e) {
          console.log("UserServices Error in getByData",e);
    return new Error(e);
        }
	},

  getUserData: async function(data){
        try {
          return  await userModel.find(data);
        } catch (e) {
          console.log("UserServices Error in getUserData",e);
    return new Error(e);
        }
	},

  getUserCount: async function(data){
    try {
          return  await userModel.countDocuments(data);
        } catch (e) {
          console.log("UserServices Error in getUserCount",e);
          return new Error(e);
    }
  },

	getSingleUserData: async function(data,column){
        try {
          return  await userModel.findOne(data).select(column);
        } catch (e) {
          console.log("UserServices Error in getSingleUserData",e);
          return new Error(e);
        }
	},

  getUserDatatable: async function(query, length, start){
        try {
          return  await userModel.find(query).skip(start).limit(length);
        } catch (e) {
          console.log("UserServices Error in getUserDatatable",e);
          return new Error(e);
        }
	},

  insertUserData: async function(data){
        try {
          await userModel.create(data);
        } catch (e) {   
    console.log("UserServices Error in getUserDatatable",e);
          return new Error(e);
        }
	},

  deleteUser: async function(data){
        try {
          await userModel.deleteOne({_id: data});
        } catch (e) {
          console.log("UserServices Error in deleteUser",e);
          return new Error(e);
        }
  },

	updateUserData: async function(condition, data){
        try {
          return await userModel.update(condition, data);
        } catch (e) {
          console.log("UserServices Error in updateUserData",e);
          return new Error(e);
        }
	}

}
