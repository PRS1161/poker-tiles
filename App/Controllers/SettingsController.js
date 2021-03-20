var Sys = require('../../Boot/Sys');
const moment =require('moment');
const pm2     = require('pm2');

module.exports = {
  settings: async function(req,res){
    try {
      let settings = await Sys.App.Services.SettingsServices.getSettingsData();
      var data = {
        App : Sys.Config.App.details,Agent : req.session.details,
        error: req.flash("error"),
        success: req.flash("success"),
        setting : settings,
        settingActive : 'active'
      };
      return res.render('settings/settings',data);
    }
    catch (e) {
      req.flash('error','Error in Settings');
      res.redirect('/');
      console.log("Error in settings :", e);
    }
  },

  settingsUpdate: async function(req , res){
    try {
      let settings = await Sys.App.Services.SettingsServices.getSettingsData({_id: req.body.id});
      if (settings) {
        await Sys.App.Services.SettingsServices.updateSettingsData({
          _id: req.body.id
        }, {
          defaultChips: req.body.chips,
          rakePercenage: req.body.rakePercenage,
          BackupDetails:{
            db_backup_days: req.body.db_backup_days,
            db_next_backup_date: moment().add(req.body.db_backup_days, 'days').format("YYYY-MM-DD"), 
            db_host: req.body.db_host,
            db_username: req.body.db_username,
            db_password: req.body.db_password,
            db_name: req.body.db_name,
          },
          processId: req.body.processId
        });

        Sys.Setting = await Sys.App.Services.SettingsServices.getSettingsData({});

        req.flash('success','Settings update successfully');
        res.redirect('/settings');
      }
      else{
        req.flash('error','Error Updating Settings');
        res.redirect('/settings');
      }
    }
    catch (e){
      req.flash('error','Error Updating Settings');
      res.redirect('/settings');
      console.log("Error in settingsUpdate :", e);
    }
  },

  settingsAdd : async function (req , res){
    try {
      await Sys.App.Services.SettingsServices.insertSettingsData({
        defaultChips: req.body.chips,
        rakePercenage: req.body.rakePercenage,
        BackupDetails:{
          db_backup_days: req.body.db_backup_days,
          db_next_backup_date: moment().add(req.body.db_backup_days, 'days').format("YYYY-MM-DD"), 
          db_host: req.body.db_host,
          db_username: req.body.db_username,
          db_password: req.body.db_password,
          db_name: req.body.db_name,
        },
         processId: req.body.processId
      });

      Sys.Setting = await Sys.App.Services.SettingsServices.getSettingsData({});

      req.flash('success','Settings create successfully');
      res.redirect('/settings');
    }
    catch (e){
      req.flash('error','Error Adding Setting');
      res.redirect('/settings');
      console.log("Error in settingsAdd :", e);
    }
  },

  maintenance: async function(req, res){
    try {
       
      //var settings = await Sys.App.Services.SettingsServices.getSettingsData();
       //console.log("settings ->>>>>>",Sys.Setting.maintenance);
       console.log("settings ->>>>>>",Sys.Setting);
      if(Sys.Setting.maintenance == undefined){
         await Sys.App.Services.SettingsServices.updateSettingsData(
          {
            _id: Sys.Setting._id
          },{
            maintenance:{
              'maintenance_start_date': moment().format("YYYY-MM-DD HH:mm"),
              'maintenance_end_date': moment().format("YYYY-MM-DD HH:mm"),
              'message': 'This Application is Under Maintenance.',
              'showBeforeMinutes': '90',
              'status': 'inactive'
            }
          });
          Sys.Setting = await Sys.App.Services.SettingsServices.getSettingsData({});
      }
      
      let resPromise= new Promise((resolve, reject) => {
            pm2.list(0,(err, res) => {
              if(err){reject(err)} resolve(res)
            })
      });
      
      resPromise.then(function(val){
         
        var restartCount = (val.length == 0)? 0 : (val[0].pm2_env.restart_time);
        var data = {
          App : Sys.Config.App.details,Agent : req.session.details,
          error: req.flash("error"),
          success: req.flash("success"),
          setting : Sys.Setting,
          maintenanceActive : 'active',
          restartCount: restartCount
        };
        return res.render('settings/maintenance',data);
      })
      
    }
    catch (e) {
      req.flash('error','Error in maintenance');
      res.redirect('/');
      console.log("Error in maintenance :", e);
    }
  },

  /*maintenanceStatusChange: async function(req, res){
    try{
      let settings = await Sys.App.Services.SettingsServices.getSettingsData();
      if (settings || settings.length >0) {
        
        if(settings.maintenance.status == 'active'){
          settings.maintenance.status = 'inactive';
          
        }else{
          settings.maintenance.status = 'active';
        }
        await Sys.App.Services.SettingsServices.updateSettingsData(
          {
            _id: req.body.id
          },{
            maintenance:settings.maintenance
          }
          )
        return res.send("success");
      }else {
        return res.send("error");
        req.flash('error', 'Problem while updating Status.');
      }

    } catch (e){
      console.log("Error",e);
    }
  },*/

  editMaintenance: async function(req, res){
   try {
         let settings = await Sys.App.Services.SettingsServices.getSettingsData();
         let maintenance_start_date = moment(settings.maintenance.maintenance_start_date).format("YYYY-MM-DD HH:mm");
         if(settings.maintenance.maintenance_start_date == null || settings.maintenance.maintenance_start_date == undefined || settings.maintenance.maintenance_start_date ==''){
           let maintenance_start_date = moment(settings.maintenance.maintenance_start_date).format("YYYY-MM-DD HH:mm");
         }
         let maintenance_end_date = moment(settings.maintenance.maintenance_end_date).format("YYYY-MM-DD HH:mm");
         if(settings.maintenance.maintenance_end_date == null || settings.maintenance.maintenance_end_date == undefined || settings.maintenance.maintenance_end_date ==''){
           let maintenance_end_date = moment(settings.maintenance.maintenance_end_date).format("YYYY-MM-DD HH:mm");
         }
         
         var data = {
           App : Sys.Config.App.details,Agent : req.session.details,
           error: req.flash("error"),
           success: req.flash("success"),
           setting : settings,
           maintenanceActive : 'active',
           maintenance_start_date: maintenance_start_date,
           maintenance_end_date: maintenance_end_date,
         };
         return res.render('settings/maintenanceEdit',data);
       }
       catch (e) {
         req.flash('error','Error in Settings');
         res.redirect('/maintenance');
         console.log("Error in settings :", e);
       }
  },

  updateMaintenance: async function(req, res){
    try {
      let settings = await Sys.App.Services.SettingsServices.getSettingsData({_id: req.params.id});
      if (settings) {
        await Sys.App.Services.SettingsServices.updateSettingsData({
          _id: req.params.id
        }, {
            maintenance:{
              maintenance_start_date: req.body.maintenance_start_date,
              maintenance_end_date: req.body.maintenance_end_date,
              message:req.body.message,
              showBeforeMinutes: req.body.showBeforeMinutes,
              status: req.body.status,
            }
        });

        Sys.Setting = await Sys.App.Services.SettingsServices.getSettingsData({});
      
      //START: chirag 31-08-2019 game under maintenance code 
        if(req.body.status == "active"){          
          let allPlayer = await Sys.App.Services.PlayerServices.getByData({'socketId':{$ne:''}});
          var playerIdArr = [];
          if(allPlayer.length > 0){
            for(var i=0; i<allPlayer.length; i++){
              playerIdArr.push(allPlayer[i].id);
            }
          }

          console.log("playerIdArr: ", playerIdArr);
          let allRoom = await Sys.App.Services.RoomServices.getByData({'isTournamentTable' : false});

          console.log("allRoom.length: ", allRoom.length);

          var playingIdArr = [];
          if(allRoom.length > 0){
            for(var j = 0; j<allRoom.length; j++){
              var roomData = allRoom[j];
              if(roomData.players.length > 0){
                for(var k=0; k<roomData.players.length; k++){
                  var playerData = roomData.players[k];
                  var playerId = playerData.id;

                  console.log("updateMaintenance playerData.status: ", playerData.status);

                  if(playerData.status=="Playing"){
                    playingIdArr.push(playerId);
                  }

                  if(playerData.status=="Waiting"){
                    await Sys.Game.CashGame.Texas.Controllers.RoomProcess.leftRoom({roomId:roomData.id,playerId:playerId});
                  }

                  if(playerData.status=="Ideal"){
                    await Sys.Game.CashGame.Texas.Controllers.RoomProcess.leftRoom({roomId:roomData.id,playerId:playerId});
                  }

                  if(playerData.status=="Playing" && roomData.status == "Finished"){
                    await Sys.Game.CashGame.Texas.Controllers.RoomProcess.leftRoom({roomId:roomData.id,playerId:playerId});
                  }
                }
              }
            }
          }

          console.log("playingIdArr: ", playingIdArr);

          var tourAllRoom = await Sys.App.Services.RoomServices.getByData({'isTournamentTable' : true});

          console.log("tourAllRoom.length: ", tourAllRoom.length);

          var tourPlayingIdArr = [];
          var tourPlayingNameArr = [];
          if(tourAllRoom.length > 0){
            for(var m = 0; m<tourAllRoom.length; m++){
              var tourRoomData = tourAllRoom[m];
              if(tourRoomData.players.length > 0){
                for(var n=0; n<tourRoomData.players.length; n++){
                  if(tourRoomData.players[n].status=="Playing"){
                    var tourPlayerId = tourRoomData.players[n].id;
                    tourPlayingIdArr.push(tourPlayerId);
                    tourPlayingNameArr.push(tourRoomData.players[n].playerName);
                  }
                }
              }
            }
          }

          console.log("tourPlayingIdArr: ", tourPlayingIdArr);
          console.log("tourPlayingNameArr: ", tourPlayingNameArr);

          for(var l=0; l<playerIdArr.length; l++){
            var playerId = playerIdArr[l];
            console.log("playingIdArr.indexOf(playerId): ", playingIdArr.indexOf(playerId));
            console.log("playerIdArr[l]: ", playerIdArr[l]);
            if(playingIdArr.indexOf(playerId) == -1 && tourPlayingIdArr.indexOf(playerId) == -1){
              var playerDetail = await Sys.App.Services.PlayerServices.getSinglePlayerData({'_id':playerId});
              var socketId = playerDetail.socketId;
              if(socketId != ""){
                await Sys.Io.to(socketId).emit('forceLogOut',{
                  playerId :  playerId,
                  message: "System under maintenance, please login after sometimes",
                });

                //await Sys.Io.sockets.connected[socketId].disconnect();

                await Sys.Game.Common.Services.PlayerServices.update({_id: playerId},{socketId:''});
              }                
            }           
          }

          //await Sys.Io.emit('maintenanceServer',{status:'success', 'message':'Server gose under maintenance in '+req.body.showBeforeMinutes+' minutes'});
          var message = ' Server ce se za '+req.body.showBeforeMinutes+' minute ugasiti i ponovno pokrenit. \n Der Server wird in '+req.body.showBeforeMinutes+' Minuten neu gestartet.' 
          await Sys.Io.emit('maintenanceServer',{status:'success', 'message':message});
        }
      //END: chirag 31-08-2019 game under maintenance code 
      let maintenanceMode = false;
      if(Sys.Setting && Sys.Setting.maintenance){
        if(Sys.Setting.maintenance.status == 'active'){
          maintenanceMode = true;
        }
      }
      Sys.Config.App.details.maintenanceMode = maintenanceMode;
        req.flash('success','Maintenance Settings updated successfully');
        if(req.body.DailyReports==true)
          return "success";
        else
          res.redirect('/maintenance');
        
      }
      else{
        req.flash('error','Error Updating Maintenance Settings');
        if(req.body.DailyReports==true){
          console.log("Error Updating Maintenance Settings");
          return "error";
        }
        else
          res.redirect('/maintenance');
      }
    }
    catch (e){
      req.flash('error',' Catch Error Updating Maintenance Settings');
      console.log("Error Updating Maintenance Settings");
      if(req.body.DailyReports==true)
        return "error"
      else
        res.redirect('/maintenance');
      console.log("Error in settingsUpdate :", e);
    }
  },

  /**
    Backup game collection to specified database
  **/
  insertBatch: async function(targetCollection, documents,MongoClient, targetServerHostAndPort, targetDatabaseName,db_username, db_password){
    let db, client;
    try{
     
      //let bulkInsert = collection.initializeUnorderedBulkOp();
      var insertedIds = [];
      var id;

      //let connectionString = 'mongodb://'+db_username+':'+db_password+'@'+targetServerHostAndPort;
      let connectionString = "mongodb://127.0.0.1:27017";
      //console.log(connectionString)
      client = await MongoClient.connect(connectionString, { useNewUrlParser: true });
      db = client.db(targetDatabaseName);
      var col = db.collection(targetCollection);
      var batch = col.initializeUnorderedBulkOp({useLegacyOps: true});
      
      documents.forEach( function(doc) {
        //batch.insert(doc);
        id = doc._id;
        batch.find({_id: id}).upsert().replaceOne(doc);
        insertedIds.push(id);
      });

      batch.execute();
     
      return insertedIds;

    }catch(e){
      console.log("error in inserting batch data while backup", e)
    }finally {
      client.close();
    }
  },
  deleteBatch: async function(collection, documents,MongoClient ){
    let db, client;
    try{  
      client = await MongoClient.connect("mongodb://127.0.0.1:27017", { useNewUrlParser: true });
      db = client.db("pokertiles");
      var col = db.collection(collection);
      var bulkRemove = col.initializeUnorderedBulkOp({useLegacyOps: true});
      
      documents.forEach(async function(doc) {
        //bulkRemove.find({_id: doc._id}).removeOne();
        await bulkRemove.find({_id: doc._id}).removeOne();
      });

      bulkRemove.execute();
     
    }catch(e){
      console.log("error in deleting batch data while backup", e)
    }finally {
      client.close();
    }
  },

  checkBackupStatus: async function(req, res){
    try{
      let settings = await Sys.App.Services.SettingsServices.getSettingsData();console.log(settings);
      var currentDate = moment(new Date()).format("YYYY-MM-DD");console.log("current date", currentDate)
      if(settings.BackupDetails && settings.BackupDetails.db_backup_days && settings.BackupDetails.db_next_backup_date && currentDate == settings.BackupDetails.db_next_backup_date){
        let expiryDate =moment(new Date()).subtract(3, 'months').format("YYYY-MM-DD"); // months
        console.log("Expiry Date",expiryDate);
        //let backupData = await Sys.App.Services.GameService.getByData({'createdAt': {$lt: expiryDate } });
        let targetCollection = 'game_'+currentDate;
        let sourceCollection = 'game';
        let targetServerHostAndPort = settings.BackupDetails.db_host;
        let targetDatabaseName =settings.BackupDetails.db_name;
        const MongoClient = require('mongodb').MongoClient;
        
          var count;
          while ((count = await Sys.App.Services.GameService.getGameCount({'createdAt': {$lt: expiryDate } }) ) > 0) {
            console.log(count + " documents remaining");
            let sourceDocs = await Sys.App.Services.GameService.getLimitedGame({'createdAt': {$lt: expiryDate } });
            let idsOfCopiedDocs = await module.exports.insertBatch(targetCollection, sourceDocs,MongoClient, targetServerHostAndPort, targetDatabaseName, settings.BackupDetails.db_username, settings.BackupDetails.db_password);
            console.log("bulk inserted ids", idsOfCopiedDocs);
            if(typeof idsOfCopiedDocs !== 'undefined' && idsOfCopiedDocs.length > 0){
              let targetDocs = await Sys.App.Services.GameService.getByData({_id: {$in: idsOfCopiedDocs}});
              await module.exports.deleteBatch(sourceCollection, targetDocs, MongoClient);
            }
            
          }
          console.log("iddddd", settings._id);
          await Sys.App.Services.SettingsServices.updateSettingsData({
          _id: settings._id
          }, {
            BackupDetails:{
              db_backup_days: settings.BackupDetails.db_backup_days,
              db_next_backup_date:moment(currentDate).add(settings.BackupDetails.db_backup_days, 'days').format("YYYY-MM-DD"),
              db_host: settings.BackupDetails.db_host,
              db_username: settings.BackupDetails.db_username,
              db_password: settings.BackupDetails.db_password,
              db_name: settings.BackupDetails.db_name,   
            }
          });  

          res.send("Backup completed");
      }else{
        console.log("NOO");
      }
    }catch(e){
      console.log("Error in checkBackupStatus of game collection :", e);
    }
  },

  // restart server
  restartServer: async function(req, res){
    try{
      
      console.log("restart the server");
      /*pm2.restart(0, function (err, proc) {
        if (err){
         throw new Error('err');
         return res.send("error");
          
        } 
      });*/
      setTimeout(function(){
        pm2.restart(Sys.Setting.processId);
      }, 1000);
      
      return res.send("success");
    } catch (e){
      console.log("Error",e);
      return res.send("error");
      req.flash('error', 'Problem while updating Status.');
    }
  } 

}
