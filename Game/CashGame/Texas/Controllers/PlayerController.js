var Sys = require('../../../../Boot/Sys');
let moment = require('moment');

module.exports = {
   
    playerAction: async function(socket, data){
      try {
        var action = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction(data);
        return {
          status: 'success',
          result  : null,
          data: action,
          message: 'Player action successful.'
        };
      } catch (e) {
        console.log("Error: ", e);
      }

    },

    removePlayerFromRooms:async function() {
      console.log("remove player calles")
      try{
        let rooms = Sys.Rooms;

        let allRooms = await Sys.Game.CashGame.Texas.Services.RoomServices.getAllRoom({});

        if(allRooms.length > 0){
          for(let r = 0; r< allRooms.length; r++){
            let tId = allRooms[r]._id;
            var room = rooms[tId];
            if(room){
             // console.log("working player rooms ---->", room.players);
              var players = room.players;
              console.log("player", players.length)
              if(players.length > 0){
                for(let p =0; p < players.length; p++){
                  var playerTimeout = room.players[p].idealTime;

                  if(playerTimeout != null){

                    let idealAt = moment(playerTimeout);
                    //console.log("ideal at", idealAt)
                    let removeAt =  moment(playerTimeout).add('8','minutes')
                    //let removeAt =  moment(playerTimeout).add('5','minutes')
                    //console.log("remove at", removeAt);
                    if( removeAt < moment() ){
                      console.log("date comes");
                       room.players[p].status = "Left";
                       room.players[p].sitOutNextHand = false;
                       room.players[p].sitOutNextBigBlind = false;
                       room.players[p].defaultActionCount = 0;
                       room.players[p].oldPlayerLeftTime = new Date();
                       room.players[p].idealTime = null;

                       await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId': room.players[p].id,roomId: room.id });
                      
                      //await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId': room.players[p].id,roomId: room.id });
                      console.log("ideal player status", room.players[p].isAllinPlayersChipsAssigned)
                      let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(room.players[p].id);
                      if (dataPlayer && room.players[p].isAllinPlayersChipsAssigned == false) {
                          console.log("Chips",dataPlayer.chips,room.players[p].chips);
                        let chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[p].chips) + parseFloat(room.players[p].extraChips);
                        var playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[p].id, { chips: chips });
                        // added by K@Y
                        let transactionData = {
                          user_id           : room.players[p].id,
                          username          : room.players[p].playerName,
                          // gameId           :
                          chips             : parseFloat(room.players[p].chips),
                          previousBalance   : parseFloat(dataPlayer.chips),
                          afterBalance      : chips,
                          category          : 'credit',
                          type              : 'remove',
                          remark            : 'Remove player from rooms if player is ideal for more than 5 minutes'
                        }
                        //await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);
                        room.players[p].isAllinPlayersChipsAssigned = true;
                        room.players[p].extraChips = 0;

                        var transGameId = ""
                        var transGameNum = ""
                        if(room.game != null){
                          var transGameId = room.game.id;
                          var transGameNum = room.game.gameNumber;
                        }

                        let transactionLeftData = {
                          user_id: room.players[p].id,
                          username: room.players[p].playerName,
                          gameId: transGameId,
                          gameNumber: transGameNum,
                          tableId: room.id,
                          tableName: room.tableNumber,
                          chips: parseFloat(room.players[p].chips),
                          previousBalance: parseFloat(dataPlayer.chips),
                          afterBalance: parseFloat(chips),
                          category: 'debit',
                          type: 'entry',
                          remark: 'Left',
                          isTournament: 'No',
                          isGamePot: 'no'
                        }
                        let traNumber = + new Date()
                        let sessionData={
                          sessionId:room.players[p].sessionId,
                          uniqId:room.players[p].uniqId,
                          user_id:room.players[p].id,
                          username:room.players[p].playerName,
                          chips: room.players[p].chips,
                          previousBalance: parseFloat(dataPlayer.chips),
                          afterBalance: parseFloat(chips),
                          type:"leftChips",
                          remark:"game left",
                          category:"credit",
                          transactionNumber: 'DEP-' + traNumber,
                        }
                        await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData);	
                       
                        console.log("minutes left player transactionLeftData: ", transactionLeftData);
                        await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionLeftData);

                      }
                      let playerUpdated = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room)
                      console.log("player updated in ideal player remove", playerUpdated);

                    }else{
                      console.log("waiting");
                    }
                  }else{
                    console.log("ideal time else", playerTimeout, room.players[p].id, room.players[p].playerName);
                  }

                }
              }else{
                console.log("player not found");
              }

              // remove singlr player
              let totalPlayingPlayers = 0;
              let removePlayerIndex;
              for (i = 0; i < room.players.length; i++) {
                if(room.players[i].status != 'Ideal' && room.players[i].status != 'Left'){
                  removePlayerIndex = i;
                  totalPlayingPlayers++;
                }
              }
            console.log("remove player index", removePlayerIndex, totalPlayingPlayers)
            if(room.status != 'Running' && totalPlayingPlayers == 1){
              let subscribePlayerTIme = room.players[removePlayerIndex].subscribeTime;
              if(subscribePlayerTIme != null){

                let idealAt = moment(room.players[removePlayerIndex].subscribeTime);
                console.log("single player eideal at", idealAt)
                let removeAt =  moment(room.players[removePlayerIndex].subscribeTime).add('30','minutes')
                console.log("single player remove at", removeAt);
                if( removeAt < moment() ){
                  console.log("single player date comes");
                   room.players[removePlayerIndex].status = "Left";
                   room.players[removePlayerIndex].subscribeTime = null;
                   room.players[removePlayerIndex].sitOutNextHand = false;
                   room.players[removePlayerIndex].sitOutNextBigBlind = false;
                   room.players[removePlayerIndex].defaultActionCount = 0;
                   room.players[removePlayerIndex].oldPlayerLeftTime = new Date();
                   room.players[removePlayerIndex].waitForBigBlindCheckbox = false;
                   room.players[removePlayerIndex].waitForBigBlindCheckboxValue = false;
                   
                   await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId': room.players[removePlayerIndex].id, roomId: room.id });
                   
                  
                  let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(room.players[removePlayerIndex].id);
                  console.log("single player status", room.players[removePlayerIndex].isAllinPlayersChipsAssigned)
                    
                    //await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId': room.players[removePlayerIndex].id, roomId: room.id });
                     if (dataPlayer && room.players[removePlayerIndex].isAllinPlayersChipsAssigned == false) {
                        console.log("Chips",dataPlayer.chips,room.players[removePlayerIndex].chips, room.players[removePlayerIndex].extraChips);
                        let chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[removePlayerIndex].chips) + parseFloat(room.players[removePlayerIndex].extraChips);
                        var playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[removePlayerIndex].id, { chips: chips });
                        // added by K@Y
                        let transactionData = {
                          user_id           : room.players[removePlayerIndex].id,
                          username          : room.players[removePlayerIndex].playerName,
                          // gameId           :
                          chips             : parseFloat(room.players[removePlayerIndex].chips) + parseFloat(room.players[removePlayerIndex].extraChips),
                          previousBalance   : parseFloat(dataPlayer.chips),
                          afterBalance      : chips,
                          category          : 'debit',
                          type              : 'remove',
                          remark            : 'Remove player from rooms if player is ideal for more than 5 minutes'
                        }
                        //await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);
                        room.players[removePlayerIndex].isAllinPlayersChipsAssigned = true;

                        var transGameId = "";
                        var transGameNum = "";
                        if(room.game != null){
                          var transGameId = room.game.id;
                          var transGameNum = room.game.gameNumber;
                        }

                        let transactionDataLeft = {
                          user_id: room.players[removePlayerIndex].id,
                          username: room.players[removePlayerIndex].playerName,
                          gameId: transGameId,
                          gameNumber: transGameNum,
                          tableId: room.id,
                          tableName: room.tableNumber,
                          chips: (parseFloat(room.players[removePlayerIndex].chips) + parseFloat(room.players[removePlayerIndex].extraChips)),
                          previousBalance: parseFloat(dataPlayer.chips),
                          afterBalance: parseFloat(chips),
                          category: 'credit',
                          type: 'entry',
                          remark: 'Left',
                          isTournament: 'No',
                          isGamePot: 'no'
                        }
                        console.log("Player left for game: ", transactionDataLeft);
                        let traNumber = + new Date()
                        let sessionData={
                          sessionId:room.players[removePlayerIndex].sessionId,
                          uniqId:room.players[removePlayerIndex].uniqId,
                          user_id:room.players[removePlayerIndex].id,
                          username:room.players[removePlayerIndex].playerName,
                          chips: room.players[removePlayerIndex].chips,
                          previousBalance: parseFloat(dataPlayer.chips),
                          afterBalance: parseFloat(chips),
                          type:"leftChips",
                          remark:"game left",
                          category:"credit",
                          transactionNumber: 'DEP-' + traNumber,
                        }
                        await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData);	
                       
                        room.players[removePlayerIndex].extraChips = 0;
                        console.log("extra chips test", room.players[removePlayerIndex].extraChips);

                        await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataLeft);

                      }
                      let playerUpdated = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room)

                  }else{
                    console.log("waiting for removing single player");
                  }
                }else{
                  console.log("single player time else", room.players[removePlayerIndex].subscribeTime, room.players[removePlayerIndex].id, room.players[removePlayerIndex].playerName);
                }
              }
            }
          }
        }
      }catch(error){
        console.log("error when ideal and single player remove automatically: ", error);
      }
    },

}
