var Sys = require('../../Boot/Sys');
var bcrypt = require('bcryptjs');
const moment = require('moment');
const mongoose = require('mongoose');

module.exports = {

  //***********************************************************Self  Reports******************************************************************** */
  selfReports: async function (req, res) {
    try {
      var types = [{ name: "all", value: "All" }, { name: "deposit", value: "Deposit/Withdraw" }, { name: "tournament", value: "Tournament Fees" }]
      var ChipsTypes = [{ name: "mainChips", value: "Main Chips" }]
      var data = {
        App: Sys.Config.App.details, Agent: req.session.details,
        types: types,
        ChipsTypes:ChipsTypes,
        error: req.flash("error"),
        success: req.flash("success"),
        selfActive: 'active',
        reportMenu: 'active'
      };
      return res.render('reports/selfReports', data);
    } catch (e) {
      console.log("Error", e);
    }
  },
  getSelfReportData: async function (req, res) {
    try {
      let agent
      if(req.query.hasOwnProperty('agent')){
         agent = req.query.agent;
      }else {
         agent = req.session.details.id;
      }
      console.log("vatsal",req.query.agent);

      let type = req.query.hasOwnProperty('types') ? req.query.types : '';
      let search = req.query.search.value;
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      let ChipsTypes = req.query.hasOwnProperty('ChipsTypes') ? req.query.ChipsTypes : '';      
      let total_balance = 0;
      let totalTrx = 0;
      var sort = { 'createdAt': 1 };
      var query = {$and:[{$or:[{rackToId:agent},{receiverId:agent},{user_id:agent}]}]};
      if (search) { query.transactionNumber = { $regex: '.*' + search + '.*' } }
      req.query.endDate = req.query.endDate.concat(" 23:59:59")
      if (req.query.startDate && req.query.endDate) { query.createdAt = { "$gte": new Date(req.query.startDate), "$lt": new Date(req.query.endDate) } }
      console.log(type,ChipsTypes);
      
      if (type == "all") {
        if (ChipsTypes == "rakeChips") {
          query.rakeChips = 'true'
        }else if(ChipsTypes == "adminRake"){
          query.adminChips = 'true'
        }
         else {
          query.rakeChips = { '$ne': 'true' }
          query.adminChips = { '$ne': 'true' }
        }
      } else if (type == "rake" && ChipsTypes == "adminRake") { 
        query.rakeChips = { '$ne': 'true' }
        query.adminChips = 'true'
         }
      else if (type == "rake" && ChipsTypes == "rakeChips") { query.type = "rake"
      query.adminChips = { '$ne': 'true' }
      query.rakeChips = 'true'
      }
      else if (type == "deposit" ) {
        query.type = { '$in': ["deposit", "deduct"] }
        if (ChipsTypes == "rakeChips") {
          query.rakeChips = 'true'
        } else if (ChipsTypes == "adminRake") {
          query.adminChips = 'true'
        } else {
          query.isTournament = { '$ne': 'true' }
          query.rakeChips = { '$ne': 'true' }
          query.adminChips = { '$ne': 'true' }
        }
      }
      // else if (type == "tournament" && ChipsTypes != "rakeChips" ) {
      //   query.type = { '$in': ["deposit", "deduct"] }
      //   query.isTournament = 'true'
      //   query.rakeChips = { '$ne': 'true' }
      // }
      else if (type == "tournament" && ChipsTypes == "rakeChips" ) {
        query.isTournament = 'true'
      }
      // else if (type == "tournament" && ChipsTypes == "adminChips " ) {
      //   query.isTournament = 'true'
      //   query.adminChips  = 'true'
      // }
       else {
        var obj = {
          'draw': req.query.draw,
          'closingData': 0,
          'openingData': 0,
          'recordsTotal': 0,
          'recordsFiltered': 0,
          'data': [],
          'total_balance': 0
        };
        return res.send(obj);
      }
      console.log(query);
      
     let data = await Sys.App.Services.AllUsersTransactionHistoryServices.getDataAggregate(query, length, start, sort);    
                let DataCount = await Sys.App.Services.AllUsersTransactionHistoryServices.getDataCount(query);     
      for (let index = 0; index < data[0].thirdData.length; index++) {
        if (data[0].thirdData[index].type == "rake") {
          data[0].thirdData[index].from =  data[0].thirdData[index].rackFrom;
          data[0].thirdData[index].in = data[0].thirdData[index].totalRack;
          total_balance = data[0].thirdData[index].totalRack ? parseFloat(total_balance) + parseFloat(data[0].thirdData[index].totalRack) : total_balance;
          data[0].thirdData[index].type = "Rake";
           data[0].thirdData[index].remark = "Rake Amount"
          data[0].thirdData[index].afterBalance = data[0].thirdData[index].rackToAfter_balance;
          data[0].thirdData[index].beforeBalance = data[0].thirdData[index].rackToBefore_balance;
        } else if (data[0].thirdData[index].type != "rake") {
          data[0].thirdData[index].from = data[0].thirdData[index].providerEmail;
          data[0].thirdData[index].in = data[0].thirdData[index].type == "deposit" ? data[0].thirdData[index].chips : "-";
          data[0].thirdData[index].out = data[0].thirdData[index].type == "deduct" ? data[0].thirdData[index].chips : "-";
          total_balance = data[0].thirdData[index].type == "deposit" ? parseFloat(total_balance) + parseFloat(data[0].thirdData[index].chips) : parseFloat(total_balance) - parseFloat(data[0].thirdData[index].chips)
          if (data[0].thirdData[index].isTournament == 'true') {
            data[0].thirdData[index].remark = data[0].thirdData[index].remark
            data[0].thirdData[index].from = data[0].thirdData[index].receiverName
          } else { 
            data[0].thirdData[index].remark = data[0].thirdData[index].type == "deposit" ? "Received By " + data[0].thirdData[index].providerEmail : "Transfer To " + data[0].thirdData[index].providerEmail;
          }
        }
      }
      let openingData=0
      let closingData=0
      if (DataCount) {
         openingData = data[0].firstData[0].firstRecord.beforeBalance ? data[0].firstData[0].firstRecord.beforeBalance : data[0].firstData[0].firstRecord.rackToBefore_balance;
         closingData = data[0].firstData[0].lastRecords.afterBalance ? data[0].firstData[0].lastRecords.afterBalance : data[0].firstData[0].lastRecords.rackToAfter_balance
        totalTrx = openingData - closingData
        if (type == 'deduct') {
          totalTrx = Math.abs(totalTrx)
        }
      }
      if(data[0].thirdData.length){
      data[0].thirdData.unshift({createdAt:data[0].thirdData[0].createdAt,gameNumber:"-",transactionNumber:"-",from:"-",in:"0",out:"0",afterBalance:openingData,type:"Opening",remark:"Opening Balance"})
      }
       obj = {
        'draw': req.query.draw,
        'closingData': closingData,
        'openingData': openingData,
        'recordsTotal': DataCount,
        'recordsFiltered': DataCount,
        'data': data[0].thirdData,
        'total_balance': totalTrx
      };
      res.send(obj);
    } catch (e) {
      console.log("Error", e);
    }
  },
 
  //***********************************************************Player Reports******************************************************************** */
  playerReports: async function (req, res) {
    try {
      let query = { agentId: req.session.details.id };
      var players = req.session.details.role != "admin" ? await Sys.App.Services.PlayerServices.getPlayerDatatable(query, null, null, ['username']) : await Sys.App.Services.PlayerServices.getPlayerDatatable({}, null, null, ['username']);
      // var types = [{ name: "all", value: "All" }, { name: "entry", value: "Entry Game" }, { name: "buyIn", value: "Buy In" }, { name: "newhand", value: "Game Starting Chips" }, { name: "totalbet", value: "Total Bet Amount" }, { name: "rake", value: "Rake" }, { name: "winner", value: "Game Win" }, { name: "revert", value: "Revert Chips" }, { name: "leave", value: "Game Leave" }, { name: "deposit", value: "Deposit" }, { name: "withdraw", value: "Withdraw" }]
       var types = [{ name: "all", value: "All" },{ name: "entry", value: "Tournament Entry" },{ name: "leave", value: "Tournament Leave" },{ name: "addChips", value: "Game Join" },{ name: "leftChips", value: "Game left" },{ name: "deposit", value: "Deposit" }, { name: "deduct", value: "Withdraw" }]

      var data = {
        App: Sys.Config.App.details, Agent: req.session.details,
        types: types,
        players: players,
        error: req.flash("error"),
        success: req.flash("success"),
        playerReportActive: 'active',
        reportMenu: 'active'
      };
      return res.render('reports/playerReports', data);
    } catch (e) {
      console.log("Error", e);
    }
  },
  getPlayerReportData: async function (req, res) {
    try {
      let player = req.query.hasOwnProperty('player') ? req.query.player : '';
      let types = req.query.hasOwnProperty('types') ? req.query.types : '';
      let search = req.query.search.value;
      let start_date = new Date(req.query.startDate)
      let end_date = new Date(req.query.endDate)  
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      var sort = { 'createdAt': 1 };
      end_date.setHours(23, 59, 59, 999);
      let id = ""
      let query = { _id: req.query.player };
      let players = await Sys.App.Services.PlayerServices.getSinglePlayerData(query, null, null, ['agentId', 'agentRole', 'username'])
      id = players.username;
          
      // query = {};
      // query.receiverId = player;
       query = {$or:[{receiverId:player},{user_id:player}]};
      if (req.query.startDate && req.query.endDate) {
        query.createdAt = { "$gte": new Date(start_date), "$lte":new Date(end_date) }
      }
      if (search) {
        query.sessionId = { $regex: '.*' + search + '.*' };
      }
      if(types && types!="all"){
        query.type=types
      }else {
        query.type={'$nin': ['winner', 'lose'] } 
      }
      console.log("query vatsal: ", query);
      let playerData = await Sys.App.Services.ChipsHistoryServices.getDataAggregate(query, length, start, sort);
      let total_balance = 0      
      if(playerData[0].thirdData){
      for (var i = 0; i < playerData[0].thirdData.length; i++) {
        // playerData[0].thirdData[i].gameNumber=playerData[0].thirdData[i].gameNumber ?  req.session.details.role == "admin" ? '<a href="/game/allGameHistory/' + playerData[0].thirdData[i].gameId + '">' + playerData[0].thirdData[i].gameNumber + '</a>':  '<a >' + playerData[0].thirdData[i].gameNumber + '</a>' :"-";
        playerData[0].thirdData[i].sessionId =playerData[0].thirdData[i].sessionId ? '<a target="_blank"  href="/playerReports/'+ playerData[0].thirdData[i].uniqId + '/' + playerData[0].thirdData[i].sessionId + '">'  + playerData[0].thirdData[i].sessionId + '</a>':"-";
        if(playerData[0].thirdData[i].category == 'credit'){
          total_balance =  parseFloat(total_balance) + parseFloat(playerData[0].thirdData[i].chips)
          total_balance =  parseFloat(total_balance) - parseFloat(playerData[0].thirdData[i].bet_amount)
        }else if(playerData[0].thirdData[i].category == 'debit'){
          total_balance =parseFloat(total_balance) - parseFloat(playerData[0].thirdData[i].chips)
        }      
      } 
    } 
    if(playerData[0].thirdData.length){
      playerData[0].thirdData.unshift({createdAt:playerData[0].thirdData[0].createdAt ,sessionId:"-",transactionNumber:"-",chips:"0",afterBalance:playerData[0].thirdData.length ? playerData[0].firstData[0].firstRecord.previousBalance || playerData[0].firstData[0].firstRecord.beforeBalance : 0,type:"Opening",remark:"Opening Balance"})
    }
      var obj = {
        'App': Sys.Config.App.details, Agent: req.session.details,'draw': req.query.draw,
        'recordsTotal':playerData[0].thirdData.length ? playerData[0].secondData[0].count : 0,
        'recordsFiltered': playerData[0].thirdData.length ? playerData[0].secondData[0].count : 0,
        'data': playerData[0].thirdData,
        'openingData': playerData[0].thirdData.length ? playerData[0].firstData[0].firstRecord.previousBalance || playerData[0].firstData[0].firstRecord.beforeBalance : 0,
        'closingData': playerData[0].thirdData.length ? playerData[0].firstData[0].lastRecords.afterBalance : 0,
        'id': id,
        'total_balance': total_balance
      };
      res.send(obj);
    } catch (e) {
      console.log("getPlayerReportData Error: ", e);
    }
  },
  getAllPlayerGameData: async function (req, res) {
    try {   
    let types = req.query.hasOwnProperty('types') ? req.query.types : '';
    let sessionId = req.query.hasOwnProperty('sessionId') ? req.query.sessionId : '';
    let userId = req.query.hasOwnProperty('userId') ? req.query.userId : '';
    let search = req.query.search.value;
    let start_date = new Date(req.query.startDate)
    let end_date = new Date(req.query.endDate)  
    let start = parseInt(req.query.start);
    let length = parseInt(req.query.length);
    var sort = { 'createdAt': 1 };
    end_date.setHours(23, 59, 59, 999);
    let id = ""
    let query = { uniqId: userId };
    let players = await Sys.App.Services.PlayerServices.getSinglePlayerData(query, null, null, ['agentId', 'agentRole', 'username'])
    id = players.username;
    
      query={}
     query.sessionId = sessionId;
      if (req.query.startDate && req.query.endDate) {
        query.createdAt = { "$gte": new Date(start_date), "$lte":new Date(end_date) }
      }
      if (search) {
        query.gameNumber = { $regex: '.*' + search + '.*' };
      }
      if(types && types!="all"){
        query.type=types
      }else {
        query.type={'$in': ['winner', 'lose'] } 
      }
      console.log("query: ", query);
      var playerData = await Sys.App.Services.ChipsHistoryServices.getDataAggregate(query,length, start, sort);
  

      for (var i = 0; i < playerData[0].thirdData.length; i++) {
                // playerData[0].thirdData[i].gameNumber=playerData[0].thirdData[i].gameNumber ?  req.session.details.role == "admin" ? '<a target="_blank" href="/game/allGameHistory/' + playerData[0].thirdData[i].gameId + '">' + playerData[0].thirdData[i].gameNumber + '</a>':  '<a >' + playerData[0].thirdData[i].gameNumber + '</a>' :"-";
                playerData[0].thirdData[i].gameNumber=playerData[0].thirdData[i].gameNumber ? playerData[0].thirdData[i].gameNumber:"-";
      }

      if(playerData[0].thirdData.length){
        playerData[0].thirdData.unshift({createdAt:playerData[0].thirdData[0].createdAt,sessionId:"-",transactionNumber:"-",chips:"0",afterBalance:playerData[0].thirdData.length ? playerData[0].firstData[0].firstRecord.previousBalance || playerData[0].firstData[0].firstRecord.beforeBalance : 0,type:"Opening",remark:"Opening Balance"})
      }
   var obj = {
        'App': Sys.Config.App.details, Agent: req.session.details,'draw': req.query.draw,
        'recordsTotal': playerData[0].secondData.length ? playerData[0].secondData[0].count:0,
        'recordsFiltered': playerData[0].secondData.length ? playerData[0].secondData[0].count:0,
        'data': playerData[0].thirdData,
        'openingData':playerData[0].firstData.length? playerData[0].firstData[0].firstRecord.previousBalance:0.00,
        'closingData':playerData[0].firstData.length? playerData[0].firstData[0].lastRecords.afterBalance:0.00,
        'id': id,
      }; 
       res.send(obj);
    }catch (e) {
      console.log("Error", e)
    }

    
  },
  allPlayerGame: async function (req, res) {
    try {
      let types = [{ name: "all", value: "All" },{ name: "winner", value: "Game Win" },{ name: "lose", value: "Game Lose" }]
      
        var data = {
        App: Sys.Config.App.details, Agent: req.session.details,
        types:types,
        sessionId:req.params.sessionId ,
        entryFee_chips:req.params.isTournament!="true" ? 0: tournamentDetails.entry_fee + tournamentDetails.buy_in,
        stacks_chips:req.params.isTournament !="true"  ? 0 : tournamentDetails.stacks_chips,
        userId:req.params.uniqId,
        error: req.flash("error"),
        success: req.flash("success"),
        playerReportActive: 'active',
        reportMenu: 'active'
      };
      return res.render('reports/playerGameReports', data);
    }
    catch (e) {
      console.log("Error", e)
    }
  },
  
  systemChips: async function (req, res) {
    try {
      var types = [{ name: "all", value: "Deposit/Withdraw" }, { name: "deposit", value: "Deposit" }, { name: "deduct", value: "Withdraw" }]
      var data = {
        App: Sys.Config.App.details, Agent: req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        types: types,
        systemChips: 'active',
        reportMenu: 'active'
      };
      return res.render('reports/systemReports', data);
    } catch (e) {
      console.log("Error", e);
    }
  },
  systemChipsGetData: async function (req, res) {
    try {
      let type = req.query.hasOwnProperty('types') ? req.query.types : '';
      let totalTrx = 0;
      let search = req.query.search.value;
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      let start_date = req.query.startDate;
      let end_date = req.query.endDate;
      var sort = { 'createdAt': 1 };
      let query = {};
      query.receiverId = "System";
      if (type == "all") { query.type = { '$in': ["deposit", "deduct"] } }
      else if (type == "deposit") {
        query.type = { '$in': ["deposit"] }
        query.isTournament = { '$ne': 'true' }
      } else if (type == "deduct") {
        query.type = { '$in': ["deduct"] }
        query.isTournament = { '$ne': 'true' }
      }
      if (search) { query.transactionNumber = { $regex: '.*' + search + '.*' } }
      if (req.query.startDate && req.query.endDate) {
        query.createdAt = { "$gte": start_date, "$lte": end_date }
      }
      let dataCount = await Sys.App.Services.AllUsersTransactionHistoryServices.getByData(query);
      let data = await Sys.App.Services.AllUsersTransactionHistoryServices.getByData(query, null, { sort, limit: length, skip: start });

      for (let index = 0; index < data.length; index++) {
        data[index].from = data[index].providerEmail;
        data[index].in = data[index].type == "deposit" ? data[index].chips : undefined;
        data[index].out = data[index].type == "deduct" ? data[index].chips : undefined;
        // totalTrx=data[index].type == "deposit"?  parseInt(totalTrx) +  parseInt(data[index].chips):   parseInt(totalTrx) - parseInt(data[index].chips)
      }
      let setting = await Sys.App.Services.SettingsServices.getSettingsData({}, ['systemChips']);
      console.log(setting);

      let systemTrx = setting.systemChips
      if (type == 'deduct') {
        totalTrx = Math.abs(totalTrx)
      }
      // if(dataCount.length){
      //   let openingData= dataCount[0].beforeBalance;
      //   let closingData= dataCount[(parseInt(dataCount.length) - 1)].afterBalance ;
      //   totalTrx= openingData-closingData

      // }

      let obj = {
        'recordsTotal': dataCount.length,
        'recordsFiltered': dataCount.length,
        'draw': req.query.draw,
        'data': data,
        'system_balance': systemTrx,
        // 'total_balance': totalTrx
      };
      return res.send(obj);
    } catch (e) {
      console.log("allUserGetData Error: ", e);
    }
  },
 
  //***********************************************************Transaction reports  ******************************************************************** */
  transactionReports: async function (req, res) {
    try {
      var types = [{ name: "all", value: "All" }, { name: "deposit", value: "Deposit" }, { name: "deduct", value: "Withdraw" }]
      var category = [{name: "player", value:"Player"},{name:"agent",value:"Agent"}];
      var data = {
        App: Sys.Config.App.details, Agent: req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        transactionReports: 'active',
        reportMenu: 'active',
        types: types,
        category:category
      };
      return res.render('reports/allTransactionsReport', data);
    } catch (e) {
      console.log("Error", e);
    }
  },

  transactionReportsGetData: async function(req,res){
    try{
      let type = req.query.hasOwnProperty('types') ? req.query.types : '';
      // let category =  req.query.hasOwnProperty('category') ? req.query.category : '';
      let start = parseInt(req.query.start);
      let length = parseInt(req.query.length);
      let startDate = req.query.startDate;
      let endDate = req.query.endDate;
      var sort = { 'createdAt': 1 };
      let query = {};
      if(type == "all") { 
        query.type = { '$in': ["deposit", "deduct"] } 
      }else if (type == "deposit") {
        query.type = { '$in': ["deposit"] }
      }else if (type == "deduct") {
        query.type = { '$in': ["deduct"] }
      }
      if (req.query.startDate && req.query.endDate) {
        query.createdAt = { "$gte": startDate, "$lte": endDate }
      }
      let data,dataCount;
        dataCount = await Sys.App.Services.AllUsersTransactionHistoryServices.getByData(query);
        data = await Sys.App.Services.AllUsersTransactionHistoryServices.getByData(query, null, { sort, limit: length, skip: start });
        for (let index = 0; index < data.length; index++) {
          data[index].in = data[index].type == "deposit" ? data[index].chips : undefined;
          data[index].out = data[index].type == "deduct" ? data[index].chips : undefined;
          // data[index].receiverId  ,receiverRole 
          if (data[index].receiverRole=="Player"){
          let players = await Sys.App.Services.PlayerServices.getPlayerDatatable({_id:data[index].receiverId}, null, null, ['username']);
              data[index].receiverUsername=players[0].username? players[0].username:"";
          }
          else if(data[index].receiverRole=="admin"){
            let players = await Sys.App.Services.UserServices.getSingleUserData({_id:data[index].receiverId}, null, null, ['username'])
              data[index].receiverUsername="admin";
          }else{
            let  players = await Sys.App.Services.agentServices.getAgentDatatable({_id:data[index].receiverId}, null, null, ['username'])            
              data[index].receiverUsername=players[0] ? players[0].username:"";
          }
           if (data[index].providerRole=="Player"){
          let players = await Sys.App.Services.PlayerServices.getPlayerDatatable({_id:data[index].providerId}, null, null, ['username']);
              data[index].providerUsername=players[0].username? players[0].username:"";

          }
          else if(data[index].providerRole=="admin"){
           let players = await Sys.App.Services.UserServices.getSingleUserData({_id:data[index].providerId}, null, null, ['username'])
              data[index].providerUsername="admin"  
          }else{
            let players = await Sys.App.Services.agentServices.getAgentDatatable({_id:data[index].providerId}, null, null, ['username'])
              data[index].providerUsername=players[0] ? players[0].username:"";

          }
      }
      let obj = {
        'recordsTotal': dataCount.length,
        'recordsFiltered': dataCount.length,
        'draw': req.query.draw,
        'data':data
        
      };
      return res.send(obj);
    
    }catch(e){
      console.log("Error",e);
    }
},
  //***********************************************************plyAllTransaction reports  ******************************************************************** */

  plyAllTransaction: async function (req, res) {
    try {
      let query = { parentId: req.session.details.id };
      var players = req.session.details.role != "admin" ? await Sys.App.Services.PlayerServices.getPlayerDatatable(query, null, null, ['username']) : await Sys.App.Services.PlayerServices.getPlayerDatatable({}, null, null, ['username']);
        
      //console.log("plyAllTransaction players: ", players);

      var types = [{ name: "all", value: "All" }, { name: "rake", value: "Rake" }, { name: "deposit", value: "Deposit" }, { name: "deduct", value: "Withdraw" }]
      var data = {
        App: Sys.Config.App.details, Agent: req.session.details,
        players: players,
        types: types,
        error: req.flash("error"),
        success: req.flash("success"),
        agentActive: 'active',
        reportMenu: 'active'
      };
      return res.render('reports/playerAllTrans', data);
    } catch (e) {
      console.log("Error", e);
    }
  },

  plyAllTransactionGetData: async function (req, res) {
    try {

      var start = parseInt(req.query.start);
      var length = parseInt(req.query.length);
      var search = req.query.search.value;
      var query = {};

      if (search != '') {
          query = { $or: [
              {'username': new RegExp(search, 'g')},
              {'gameNumber': new RegExp(search, 'g')}
            ]
          }
      }

      if(req.query.user_id){
        query.user_id = req.query.user_id;
      }

      if(req.query.startDate){
        let start_date = new Date(req.query.startDate);
        let end_date = new Date(req.query.endDate);

        end_date.setHours(23);
        end_date.setMinutes(59);
        end_date.setSeconds(59);

        query.createdAt = {"$gte": start_date, "$lte": end_date };
      }

      console.log("query: ", query);

      var transactionAllData = await Sys.App.Services.playerTransactionHistoryService.getAllData(query);
      var transactionData = await Sys.App.Services.playerTransactionHistoryService.getByDataNew(query,length,start,{createdAt:'-1'});

      var obj = {
        'draw': req.query.draw,
        'recordsTotal': transactionAllData.length,
        'recordsFiltered': transactionAllData.length,
        'data': transactionData
      };
      res.send(obj);
    }catch(error){
      console.log("Error when get player all transaction data: ", error);
    }
  },

}
