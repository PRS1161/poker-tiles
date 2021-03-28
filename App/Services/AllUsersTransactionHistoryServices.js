'use strict';

const mongoose = require('mongoose');
const Sys = require('../../Boot/Sys');
const Model  = mongoose.model('allUsersTransactionHistory');

module.exports = {

	getByData: async function(data, select, setOption,sort){
        try {
		 	return await Model.find(data, select, setOption).lean();  // setOption(sort, limit,skip) 
        } catch (e) {
		 	console.log("AllUsersTransactionHistoryServices Error in getByData",e);
  			return new Error(e);
        }
	},
	getDataCount: async function(query){
		try {
			return await Model.countDocuments(query)
		} catch (e) {
			console.log('ChipsServices Error in getData : ' + e);
			return new Error(e);
		}
	},
	getSingleData: async function(data, select, setOption){
        try {
          return await Model.findOne(data, select, setOption);
        } catch (e) {
			console.log("AllUsersTransactionHistoryServices Error in getSingleData",e);
			return new Error(e);
        }
	},

	getById: async function(id, select){
		try {
		   	return await Model.findById(id, select);
		} catch (e) {
			console.log("AllUsersTransactionHistoryServices Error in getById",e);
			return new Error(e);
		}
	},

	getCount: async function(data){
	  	try {
	        return await Model.countDocuments(data);
	    } catch (e) {
	        console.log("AllUsersTransactionHistoryServices Error in getCount",e);
			return new Error(e);
	    }
	},

  	insertData: async function(data){
        try {
          	return await Model.create(data);
        } catch (e) {
			console.log("AllUsersTransactionHistoryServices Error in insertData",e);
			return new Error(e);
        }
	},

  	deleteData: async function(data){
        try {
        	return await Model.deleteOne({_id: data});
        } catch (e) {
			console.log("AllUsersTransactionHistoryServices Error in deleteData",e);
			return new Error(e);
        }
  	},

	updateData: async function(condition, data){
		try {
			return await Model.update(condition, data);
		} catch (e) {
			console.log("AllUsersTransactionHistoryServices Error in updateData",e);
			return new Error(e);
		}
	},

	aggregateQuery: async function(data){
		try {
		    return await Model.aggregate(data);
		} catch (e) {
		    console.log("AllUsersTransactionHistoryServices Error in updateData",e);
          	return new Error(e);
		}
	},

	aggregateQueryCount : async function(data){
		try {
		    return await Model.aggregate(data).toArray().length;
		} catch (e) {
		    console.log("AllUsersTransactionHistoryServices Error in aggregateQueryCount",e);
          	return new Error(e);
		}
	},

	getPopulatedData: async function(query, populateWith){
		try {
		  return await Model.find(query).populate(populateWith);
		} catch (e) {
			console.log("AllUsersTransactionHistoryServices Error in getPopulatedData",e);
			return new Error(e);
		}
	},
	getDataAggregate: async function(query,length,start,sort){
		try {
			  return await Model.aggregate( [
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
			
				"thirdData": [
				   {$match: query},
				   {$sort:sort},
				   {$skip:start},
				   {$limit: length},
				]
			  }
			}
		  ])
		} catch (e) {
		  console.log('ChipsServices Error in getData : ' + e);
		  return new Error(e);
		}
	}
}

