var Sys = require('../../../Boot/Sys');

module.exports = {
    
  createTable: async function() {
      let settingsData = await Sys.App.Services.SettingsServices.getSettingsData({});
      if(!settingsData || settingsData instanceof Error){
          return {
              status: 'fail',
              result: null,
              message: 'Error in fetching setting rack percentage',
              statusCode: 401
          }
      }
      let roomCount = await Sys.Game.Common.Services.RoomServices.getCount({});
      if(roomCount instanceof Error){
          return {
              status: 'fail',
              result: null,
              message: 'Error in fetching room count',
              statusCode: 401
          }
      }

      let tableNumber = parseInt(roomCount + 1);
      let smallBlind = 1;
      let bigBlind = 2;

      let newTableData = await Sys.Game.Common.Services.RoomServices.insertTableData({
          tableNumber      : 'PT'+tableNumber,
          dealer           : 0,
          smallBlind       : smallBlind,
          bigBlind         : bigBlind,
          smallBlindIndex  : 0,
          bigBlindIndex    : 0,
          minPlayers       : 2,
          maxPlayers       : Sys.Config.App.maxPlayers,
          otherData        : { gameSpeed :  15 },
          minBuyIn         : parseFloat(smallBlind * 80),
          maxBuyIn         : parseFloat(bigBlind * 200),
          rackPercent      : settingsData.rakePercenage,
          currentPlayer    : 0,
          players          : [],
          gameWinners      : [],
          gameLosers       : [],
          turnBet          : [],
          timerStart       : false,
          status           : "Waiting",
          game             : null
      });
      console.log(newTableData)
      if(newTableData instanceof Error){
          return {
              status: 'fail',
              result: null,
              message: 'Error in creating room',
              statusCode: 401
          }
      }else{
          return {
              status: 'success',
              result: newTableData,
              message: 'Room Created Successfully',
              statusCode: 200
          }
      }
  },

  getBuyinsAndPlayerchips: async function(socket, data){
      try{
          
        let room = await Sys.Game.Common.Services.RoomServices.getById(data.roomId);
        let player = await Sys.Game.Common.Services.PlayerServices.getById(data.playerId);
  
        if (!room || room == undefined || !player || player == undefined) {
          return {
            status: 'fail',
            result: null,
            message: "Data not found",
            statusCode: 404
          };
        }
  
        if(Sys.Rooms[room.id].waitingList.length > 0){
          for(let i = 0; i < Sys.Rooms[room.id].waitingList.length; i++){
            if(Sys.Rooms[room.id].waitingList[i].playerId != data.playerId){
              return {
                status: 'fail',
                message: 'Seat is reserved please join in waiting list'
              };
            }
          }
        }
        

        let minBuyIn = room.minBuyIn;
        let maxBuyIn = room.maxBuyIn;
  
        maxBuyIn = (player.chips < maxBuyIn )? player.chips : maxBuyIn ;
  
        if (player.chips < minBuyIn) {
          return {
            status: 'fail',
            message: 'You do not have enough chips to play in this table.'
          };
        }
  
        // check for oldPlayer chips, it needs to be >= than previous chips
        let oldPlayer = null;
        let oldPlayerLeftTimeDiff = null;
        if(room){
          if (room.players.length > 0) {
            for (let i = 0; i < room.players.length; i++) {
              if (room.players[i].id == player.id && room.players[i].status == 'Left') { // && room.players[i].status == 'Left' Remove by Me
                oldPlayer = room.players[i];
                break;
              }
            }
          }
  
          if(oldPlayer == null){
            if (room.oldPlayers.length > 0) {
              for (let i = 0; i < room.oldPlayers.length; i++) {
                if (room.oldPlayers[i].id == player.id && room.oldPlayers[i].status == 'Left') { // && room.players[i].status == 'Left' Remove by Me
                  oldPlayer = room.oldPlayers[i];
                  break;
                }
              }
            }
          }
  
          // check if player is kicked
          console.log("oldplayer in getBuyinsAndPlayerchips", oldPlayer)
          if(oldPlayer && oldPlayer.isKicked == true){
            let oldPlayerKickedTime=moment(new Date(oldPlayer.kickedTime)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format();
            let oldPlayerKickedTimeDiff = moment.duration(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).diff(moment(new Date(oldPlayer.kickedTime)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone))).asMinutes();
            console.log("oldPlayerKickedTimeDiff in getBuyinsAndPlayerchips", oldPlayerKickedTimeDiff, (Sys.Config.Texas.KickedTimeInMin))
            if(oldPlayerKickedTimeDiff <  (Sys.Config.Texas.KickedTimeInMin)){
              let remainedTime = (Sys.Config.Texas.KickedTimeInMin) - oldPlayerKickedTimeDiff;
              return {
                status: 'fail',
                message: "Time for next request: "+ remainedTime.toFixed(2),
              };
            }
          }
  
  
          if(oldPlayer){
            let oldPlayerLeftTime=moment(new Date(oldPlayer.oldPlayerLeftTime)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format();
            oldPlayerLeftTimeDiff = moment.duration(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).diff(moment(new Date(oldPlayer.oldPlayerLeftTime)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone))).asMinutes();
            console.log("oldPlayerLeftTime", oldPlayerLeftTime)
            console.log("Current time", moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format())
            console.log("oldPlayerLeftTimeDiff", oldPlayerLeftTimeDiff)
            if( oldPlayer.chips > minBuyIn  && (Sys.Config.Texas.oldPlayerLeftTimeInMin) >= oldPlayerLeftTimeDiff){
              if(player.chips < oldPlayer.chips){
                return {
                  status: 'fail',
                  message: `zu wenig Chips. Das min. Buy-In beträgt ${oldPlayer.chips} \n Low chips. The min. Buy-in is ${oldPlayer.chips} `
                };
              }
            }
          }
  
  
        }
  
        return {
          status: 'success',
          message: "Room and Player data found!",
          result: {
            minBuyIn: minBuyIn,
            maxBuyIn: maxBuyIn,
            playerChips: parseFloat(player.chips)
          }
        };
      }catch(e){
        Sys.Log.info("error in getBuyinsAndPlayerchips", e);
      }
  },

  listRooms: async function (socket, data){
    try {
      let query = {
        status: { "$nin":  ['Closed','Finished'] }
      };

      let rooms = await Sys.Game.Common.Services.RoomServices.getByData(query);

      if (rooms) {
        var result = [];
        for (let i = 0; i < rooms.length; i++) {
          let room = rooms[i];

          let playerCount = 0;
          room.players.forEach(function (player){
            if(player.status != 'Left'){
              playerCount++;
            }
          });
         
          result.push({
            roomId: room.id,
            status: room.status,
            smallBlind: room.smallBlind,
            bigBlind: room.bigBlind,
            playerCount: playerCount,
            pot: (room.game != null ? room.game.pot : 0),
            minBuyIn: room.minBuyIn,
            maxPlayers: room.maxPlayers,
            maxBuyIn: room.maxBuyIn
          });
        }

        
        let createNewRoom = result.every((val) => val.playerCount == Sys.Config.App.maxPlayers);
        if (createNewRoom == true) {
          let newCreateRoom = await Sys.Game.Common.Controllers.RoomController.createTable();
          let newRoom = await Sys.Game.Common.Services.RoomServices.getByDataPara();

          result.push({
            roomId: newRoom.id,
            status: newRoom.status,
            smallBlind: newRoom.smallBlind,
            bigBlind: newRoom.bigBlind,
            playerCount: 0,
            pot: (newRoom.game != null ? room.game.pot : 0),
            minBuyIn: newRoom.minBuyIn,
            maxPlayers: newRoom.maxPlayers,
            maxBuyIn: newRoom.maxBuyIn
          });
        }
       
        return {
          status: 'success',
          result: result,
          message: 'Table Available',
          statusCode: 200
        };
      }
      return {
        status: 'success',
        result: null,
        message: 'No Rooms Found.',
        statusCode: 200
      }
    }
    catch (e) {
      console.log("Error in Common RoomController.listRooms :", e);
      return new Error(e);
    }
  },
      
}