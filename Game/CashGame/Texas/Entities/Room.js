var Sys = require('../../../../Boot/Sys');
let moment = require('moment-timezone');
class Room {
  constructor(id, smallBlind, bigBlind,dealerIndex,smallBlindIndex,bigBlindIndex, minPlayers, maxPlayers, minBuyIn, maxBuyIn, status, dealer, players, gameWinners, gameLosers, turnBet, game, currentPlayer, rackPercent, rackAmount, expireTime, tableNumber,timerStart,otherData, lastFoldedPlayerIdArray, tempStatus, oldDealerIndex, oldSmallBlindIndex, oldBigBlindIndex) {

    var room = this;
    this.id = id;
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
    this.dealerIndex = dealerIndex;
    this.smallBlindIndex = smallBlindIndex;
    this.bigBlindIndex = bigBlindIndex;
    this.minPlayers = minPlayers;
    this.maxPlayers = maxPlayers;
    this.minBuyIn = minBuyIn;
    this.maxBuyIn = maxBuyIn;
    this.status = (status) ? status : 'Waiting';

    //Track the dealer position between games
    this.dealer = -1;
    if (dealer) {
      this.dealer = dealer;
    }
    this.players = [];
      if (players && Array.isArray(players)) {
        room.players = [];
        players.forEach(function (player) {

          room.players.push(new Sys.Game.CashGame.Texas.Entities.Player().createObject(player));

        });
      }
    this.gameWinners = [];
    if (gameWinners && Array.isArray(gameWinners) ) {
      room.gameWinners = gameWinners
    }
    this.gameLosers = [];
    if (gameLosers) {
      gameLosers.forEach(function (player) {
       room.gameLosers.push(new Sys.Game.CashGame.Texas.Entities.Player().createObject(player));

      });
    }
    this.turnBet = {};
    if (turnBet) {
      room.turnBet = turnBet;
    }
    // other variables
    this.game = null;

    if (game) {

      this.game = new Sys.Game.CashGame.Texas.Entities.Game().createObject(game);

    }

    this.currentPlayer = currentPlayer
    this.rackPercent = rackPercent
    this.rackAmount = rackAmount
    this.expireTime = expireTime
    this.tableNumber = tableNumber;
    this.timerStart = timerStart;
    this.otherData = otherData;
   
    this.lastFoldedPlayerIdArray = [];
    if (lastFoldedPlayerIdArray && Array.isArray(lastFoldedPlayerIdArray) ) {
      room.lastFoldedPlayerIdArray = lastFoldedPlayerIdArray
    }
    //this.previousGameNumber = previousGameNumber;
    //this.previousGameId = previousGameId;
    this.tempStatus = (tempStatus) ? tempStatus : "Waiting";
    this.oldDealerIndex = oldDealerIndex;
    this.oldSmallBlindIndex = oldSmallBlindIndex;
    this.oldBigBlindIndex = oldBigBlindIndex;
  }

   createObject(room) {
    return new Room(
      room.id,
      room.smallBlind,
      room.bigBlind,
      room.dealerIndex,
      room.smallBlindIndex,
      room.bigBlindIndex,
      room.minPlayers,
      room.maxPlayers,
      room.minBuyIn,
      room.maxBuyIn,
      room.status,
      room.dealer,
      room.players,
      room.gameWinners,
      room.gameLosers,
      room.turnBet,
      room.game,
      room.currentPlayer,
      room.rackPercent,
      room.rackAmount,
      room.expireTime,
      room.tableNumber,
      room.timerStart,
      room.otherData,
      room.lastFoldedPlayerIdArray,
      //room.previousGameNumber,
      //room.previousGameId,
      room.tempStatus,
      room.oldDealerIndex,
      room.oldSmallBlindIndex,
      room.oldBigBlindIndex
    );
  }

  /*
   * Helper Methods Public
   */
  toJson() {

    var room = {
      id: this.id,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      dealerIndex : this.dealerIndex,
      smallBlindIndex : this.smallBlindIndex,
      bigBlindIndex : this.bigBlindIndex,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
      minBuyIn: this.minBuyIn,
      maxBuyIn: this.maxBuyIn,
      status: this.status,
      dealer: this.dealer,
      turnBet: this.turnBet,
      players: [],
      gameWinners: this.gameWinners,
      gameLosers: [],
      game: null,
      currentPlayer: this.currentPlayer,
      rackPercent: this.rackPercent,
      rackAmount : this.rackAmount,
      expireTime : this.expireTime,
      tableNumber:this.tableNumber,
      timerStart : this.timerStart,
      otherData : this.otherData,
      lastFoldedPlayerIdArray: [],
      //previousGameNumber: this.previousGameNumber,
      //previousGameId: this.previousGameId,
      tempStatus: this.tempStatus,
      oldDealerIndex : this.oldDealerIndex,
      oldSmallBlindIndex : this.oldSmallBlindIndex,
      oldBigBlindIndex : this.oldBigBlindIndex
    }
    if (this.players.length > 0) {
      this.players.forEach(function (player) {
        room.players.push(new Sys.Game.CashGame.Texas.Entities.Player().createObject(player));
      })
    }
    if (this.gameLosers.length > 0) {
      this.gameLosers.forEach(function (player) {
        room.gameLosers.push(new Sys.Game.CashGame.Texas.Entities.Player().createObject(player));
      });
    }
    if (this.game) {
      room.game = this.game.toJson();
    }
    
    return room;
  }

  // newRound helper
  getHandForPlayerName(playerName) {
    for (var i in this.players) {
      if (this.players[i].playerName === playerName) {
        return this.players[i].cards;
      }
    }
    return [];
  }

  getDealer() {
    return this.players[this.dealerIndex];
  }

  getSmallBliendPlayer() {
    return this.players[this.smallBlindIndex];
  }

  getBigBliendPlayer() {
    return this.players[this.bigBlindIndex];
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  getPlayerById(id) {
    let player = null;
    for (let i = 0; i < this.players.length; i++) {
      if (id == this.players[i].id) {
        player = this.players[i];
        break;
      }
    }
    return player;
  }

  getPreviousPlayerAction() {
    return this.turnBet;
  }

  // Player actions: Check(), Fold(), Bet(bet), Call(), AllIn()
  check (id, hasRaised) {
    console.log("Action Called :: [-CHECK-] ")
    var currentPlayer = this.currentPlayer;
    if (id === this.players[currentPlayer].id) {
      this.players[currentPlayer].Check(this.id,hasRaised);
      return true;
    }
    else {
      // todo: check if something went wrong ( not enough money or things )
      Sys.Log.info("wrong user has made a move");
      return false;
    }
  }

  fold (id, hasRaised) {
    console.log("Action Called :: [-FOLD-] ")
    var currentPlayer = this.currentPlayer;
    if (id === this.players[currentPlayer].id) {
      this.players[currentPlayer].Fold(this.id,hasRaised);
      return true;
    }
    else {
      Sys.Log.info("wrong user has made a move");
      return false;
    }
  }

  call(id, hasRaised) {
    console.log("Action Called :: [-CALL-] ")
    var currentPlayer = this.currentPlayer;
    if (id === this.players[currentPlayer].id) {
      this.players[currentPlayer].Call(this.id,hasRaised);
      return true;
    } else {
      Sys.Log.info("wrong user has made a move");
      return false;
    }
  }

  bet(id, amt, hasRaised) {
    console.log("Action Called :: [-BET-] ")
    var currentPlayer = this.currentPlayer;
    if (id === this.players[currentPlayer].id) {
      this.players[currentPlayer].Bet(this.id,amt, hasRaised);
      return true;
    } else {
      console.log("wrong user has made a move");
      return false;
    }
  }

  AllIn(id, hasRaised) {
    console.log("Action Called :: [-ALLIN-] ")
    var currentPlayer = this.currentPlayer;
    if (id === this.players[currentPlayer].id) {
      this.players[currentPlayer].AllIn(this.id,hasRaised);
      return true;
    } else {
      console.log("wrong user has made a move");
      return false;
    }
  }

  getWinners() {
     return this.gameWinners;
  }

  getLosers() {
     return this.gameLosers;
  }

  getAllHands() {
     var all = this.losers.concat(this.players);
     var allHands = [];
     for (var i in all) {
       allHands.push({
         playerName: all[i].playerName,
         chips: all[i].chips,
         hand: all[i].cards,
       });
     }
     return allHands;
  }

  AddPlayer(id, socketId, playerName, avatar, fb_avatar, chips, seatIndex, autoBuyin, subscribeTime,longitude,latitude,uniqId,sessionId,profilePicUrl) {

    let room = this;
    console.log("AddPlayer room.minBuyIn: ", room.minBuyIn);
    if (chips >= room.minBuyIn) {
      let player = new Sys.Game.CashGame.Texas.Entities.Player(id, socketId,seatIndex, playerName, avatar, fb_avatar, "Waiting", parseFloat(chips),0, parseFloat(chips),false,false,false,[],autoBuyin,0,false,null, subscribeTime, false, false,false, 0,false, false, false, false, longitude,latitude,0,uniqId,sessionId,false,profilePicUrl);
      console.log("Player -> :",player)
      this.players.push(player);
    }
    return room; // Return Room
  }

  removePlayer(id) {
    for (let i in this.players) {
      if (this.players[i].id === id) {
        this.players[i].status = 'Left';
        this.players[i].Fold(this.id,false); // Set hasRais False
      }
    }
  }

  async StartGame() {
    try {
      let m_start_date = moment(new Date(Sys.Setting.maintenance.maintenance_start_date)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
      let m_end_date = moment(new Date(Sys.Setting.maintenance.maintenance_end_date)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
      let current_date = moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
      console.log("m_start_date: ", m_start_date);
      console.log("m_end_date: ", m_end_date);
      console.log("current_date: ", current_date);

      if (current_date >= m_start_date && current_date <= m_end_date && Sys.Setting.maintenance.status == 'active') {
        room.tempStatus = "Waiting";
        Sys.Game.Common.Controllers.RoomController.playerRemoveBySystem(room);
      }else{
        console.log("/$$$$$$$$$$$$$$$$$$NEW GAME START$$$$$$$$$$$$$$$$$$$$$$$$/");
        console.log("||  ROOM ");
        console.log("/$$$$$$$$$$$$$$$$$$NEW GAME START$$$$$$$$$$$$$$$$$$$$$$$$/");
        let room = this;
        console.log("ROOOOOOM",room);
        let playingCounter = 0;
        let playingKey = 0;
        room.otherData.isPreventMultipleTurn = false;
      
        for (let p in room.players) {
          if (room.players[p].status == 'Waiting') {
            room.players[p].status = 'Playing';
          }
          room.players[p].considerLeftedPlayer = false;
        }

        console.log("room players while starting game", room.players);
        console.log("/************** Removed Left Player ***********************/");

        /* for (let i = room.players.length-1; i >= 0; i--) {
          if (room.players[i].status == 'Left') {
            console.log("Removed Name  : ",room.players[i].playerName)
            room.players.splice(i,1);
          }
        } */

        for (let i = room.players.length-1; i >= 0; i--) {
          let date = new Date();
          let timestamp1 = date.getTime();
          let sessionId= room.players[i].uniqId + "-" + room.tableNumber+"-" +timestamp1;
          if (room.players[i].status == 'Left') {
            console.log("Removed Name  : ",room.players[i].playerName,room.players[i].id);
            room.players[i].defaultActionCount = 0;
            room.players[i].considerLeftedPlayer = false;

            let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(room.players[i].id);
            console.log("room.players[i].isAllinPlayersChipsAssigned in game finish", room.players[i].isAllinPlayersChipsAssigned);
            if (dataPlayer && room.players[i].isAllinPlayersChipsAssigned == false) {
              console.log("Chips",dataPlayer.chips,room.players[i].chips);

              let chips = 0;
              if(room.players[i].extraChips > 0) {
                console.log("extra chips of lefted player in startGame", room.players[i].id, room.players[i].extraChips);
                chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips);
                let traNumber = + new Date()
                await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction({
                  sessionId:room.players[i].sessionId,
                  uniqId:room.players[i].uniqId,
                  username:room.players[i].username,
                  user_id:room.players[i].id,
                  chips: parseFloat(room.players[i].chips),
                  previousBalance:parseFloat(dataPlayer.chips) + parseFloat(room.players[i].extraChips),
                  afterBalance: parseFloat(dataPlayer.chips) + parseFloat(room.players[i].extraChips) + parseFloat(room.players[i].chips),
                  type:"leftChips",
                  remark:"game left",
                  transactionNumber: 'DEP-' + traNumber,
                  category:"credit"
                });
               
                room.players[i].sessionId=sessionId;
                let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[i].id, { chips: chips, extraChips: 0 });
                traNumber = + new Date()
                await Sys.Game.CashGame.Texas.Services.ChipsServices.insertData({
                  sessionId: sessionId,
                  uniqId:room.players[i].uniqId,
                  username:room.players[i].username,
                  chips: parseFloat(parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips)),
                  previousBalance:parseFloat(dataPlayer.chips) + parseFloat(room.players[i].extraChips) + parseFloat(room.players[i].chips),
                  afterBalance: parseFloat(dataPlayer.chips) - parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips),
                  type:"addChips",
                  user_id:room.players[i].id,
                  transactionNumber: 'DE-' + traNumber,
                  remark:"re Buy-in add chips",
                  category:"debit"
                });
                traNumber = + new Date()
                await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction({
                  sessionId:room.players[i].sessionId,
                  uniqId:room.players[i].uniqId,
                  username:room.players[i].username,
                  user_id:room.players[i].id,
                  chips:   parseFloat(room.players[i].extraChips) + parseFloat(room.players[i].chips),
                  previousBalance:dataPlayer.chips,
                  afterBalance: parseFloat(chips),
                  type:"leftChips",
                  remark:"game left",
                  transactionNumber: 'DEP-' + traNumber,
                  category:"credit"
                });
                room.players[i].extraChips = 0;
              }else{
                chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[i].chips);
                let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[i].id, { chips: chips });
                let traNumber = + new Date();
                await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction({
                  sessionId:room.players[i].sessionId,
                  uniqId:room.players[i].uniqId,
                  username:room.players[i].username,
                  user_id:room.players[i].id,
                  chips:  parseFloat(room.players[i].chips),
                  previousBalance:dataPlayer.chips,
                  afterBalance: parseFloat(chips),
                  type:"leftChips",
                  remark:"game left",
                  transactionNumber: 'DEP-' + traNumber,
                  category:"credit"
                });
               
              }
              //let chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[i].chips);
              //var playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[i].id, { chips: chips });
              // added by K@Y
              /*let transactionData = {
                user_id						:	room.players[i].id,
                username					: room.players[i].playerName,
                // gameId						:
                chips							:	data.chips,
                previousBalance		:	parseFloat(updatedPlayerChips.chips),
                // afterBalance
                category					:	'credit',
                type							:	'remove',
                remark						: 'Removing Lefted Player while starting Game'
              }*/
              //await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);
              room.players[i].isAllinPlayersChipsAssigned = true;
            }
           
            room.players.splice(i,1);
          }
        }

        let remainPlayerArray = [];
        for (let i = 0; i < room.players.length; i += 1) {
          if(room.players[i].status != 'Ideal' && room.players[i].status != 'Left' && room.players[i].status != 'Waiting'){
            remainPlayerArray.push(room.players[i]);
          }
        }

        // Player Sort By SeatIndex.
        remainPlayerArray.sort(function (a, b) {
          return a.seatIndex - b.seatIndex;
        });

        for (let i = 0; i < room.players.length; i += 1) {
          if(room.players[i].status == 'Ideal'){
            remainPlayerArray.push(room.players[i]);
          }
        }
        // Set New Player Arrray : last all Players  Ideals

        room.players = remainPlayerArray;
        room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);

        let playersLength =  await room.roomPlayerLength(room);
        console.log("Playing Player Length : ", playersLength);

        room.players.sort(function(a,b){
          if(a.status=='Ideal' && b.status!='Ideal'){
                return -1;
          }
          if(a.status!='Ideal' && b.status=='Ideal'){
                return 1;
          }
          return b.seatIndex - a.seatIndex;
        });
        room.players = room.players.reverse();
        playersLength =  await room.roomPlayerLength(room);
        console.log("ROOM AFTER UPDATE",room.players,playersLength)

        for (let i = 0; i < room.players.length; i++) {
          let date = new Date()
          let timestamp1 = date.getTime();
          let sessionId= room.players[i].uniqId + "-" + room.tableNumber+"-" +timestamp1
          if (room.players[i].status != 'Left' && room.players[i].extraChips != 0) {
            let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(room.players[i].id);
            let traNumber = + new Date();
            await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction({
              sessionId:room.players[i].sessionId,
              uniqId:room.players[i].uniqId,
              username:room.players[i].playerName,
              user_id:room.players[i].id,
              chips: parseFloat(room.players[i].chips),
              previousBalance:parseFloat(dataPlayer.chips) + parseFloat(room.players[i].extraChips),
              afterBalance: parseFloat(dataPlayer.chips)  + parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips),
              type:"leftChips",
              remark:"game left",
              transactionNumber: 'DEP-' + traNumber,
              category:"credit"
            });
           
            room.players[i].chips = parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips); // Add Rebuyin Chips to Orignal Account.
            let extraChips=room.players[i].extraChips
            room.players[i].sessionId=sessionId;
            traNumber = + new Date()
            await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction({
              sessionId: room.players[i].sessionId,
              uniqId:room.players[i].uniqId,
              username:room.players[i].playerName,
              chips: room.players[i].chips,
              user_id:room.players[i].id,
              previousBalance:parseFloat(dataPlayer.chips)  + parseFloat(room.players[i].chips),
              afterBalance: parseFloat(dataPlayer.chips)  + parseFloat(room.players[i].chips) - parseFloat(room.players[i].chips),
              type:"addChips",
              transactionNumber: 'DE-' + traNumber,
              remark:"re Buy-in add chips",
              category:"debit"
            });
            
            console.log("/************** EXTRA CHIPS ***********************/");
            console.log("| Name  : ",room.players[i].playerName);
            console.log("| Extra Chips : ",room.players[i].extraChips);
            console.log("| Chips : ",room.players[i].chips);
            console.log("/**************************************************/");
            room.players[i].entryChips = parseFloat(room.players[i].entryChips) + parseFloat(room.players[i].extraChips);
            room.players[i].extraChips = 0;
            if (room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting') { // ???
              room.players[i].status = 'Playing';
              room.players[i].idealPlayer = false;
            }
          }
        }

        // Select Dealer/SB/BB
        if(playersLength >= room.minPlayers){
          room = await room.roomDealerPositionSet(room,false);
        }else{
          clearTimeout(Sys.Timers[room.id]);
          clearInterval(Sys.Timers[room.id]);
          console.log("removed error",room.game, playersLength)
          room.status = 'Finished';
          room.game = null;
          //room.status = false;
          console.log("Minimum player not found while calculating dealer position");
          room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
          return false;
        }

        console.log("--------------------Bib Blind Remove----------------------------------");
        console.log("---", room.players[room.bigBlindIndex].playerName);
        console.log("----------------------------------------------------------------------");

        console.log("--------------------Smalll Bliende----------------------------------");
        console.log("---", room.players[room.smallBlindIndex].playerName);
        console.log("----------------------------------------------------------------------");

        if(room.players[room.bigBlindIndex].sitOutNextBigBlind == true){
          console.log("--------------------IN Big Blind Remove----------------------------------");
          console.log("---", room.players[room.bigBlindIndex].playerName);
          console.log("----------------------------------------------------------------------");

          room.gameLosers.push(room.players[room.bigBlindIndex]);

          room.players[room.bigBlindIndex].status = 'Ideal';
          //await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId':  room.players[room.bigBlindIndex].id, roomId: room.id });
          await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnIdealPlayer', { 'playerId': room.players[room.bigBlindIndex].id,status : true, roomId: room.id });
          // Big Blind Remove So Find New Big Blind Player.
          room.players[room.bigBlindIndex].idealTime = (room.players[room.bigBlindIndex].idealTime == null) ? new Date().getTime() : room.players[room.bigBlindIndex].idealTime;
          room.players[room.bigBlindIndex].defaultActionCount = 3;
          let remainPlayerArray = [];
          for (let i = 0; i < room.players.length; i += 1) {
            if(room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting'){
              remainPlayerArray.push(room.players[i]);
            }
          }
         
          // Player Sort By SeatIndex.
          remainPlayerArray.sort(function (a, b) {
            return a.seatIndex - b.seatIndex;
          });

          for (let i = 0; i < room.players.length; i += 1) {
            if(room.players[i].status == 'Ideal'){
              remainPlayerArray.push(room.players[i]);
            }
          }
          // Set New Player Arrray : last all Players  Ideals

          room.players = remainPlayerArray;
          room = await room.roomDealerPositionSet(room,true);
        }

        // await room.sbBb(room);

        console.log("--------------------Bib Blind Remove----------------------------------");
        // console.log("---", room.players[room.bigBlindIndex].playerName);
        console.log("----------------------------------------------------------------------");

        console.log("--------------------Smalll Bliende----------------------------------");
        console.log("---", room.players[room.smallBlindIndex].playerName);
        console.log("----------------------------------------------------------------------");

        for (let i = 0; i < room.players.length; i++) {
          if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal' ) {
            playingCounter++; // Count How Many Player Playing Game.
            playingKey = i;
          }
        }
        if(playingCounter == 1){ // if Only One Player in Table
          room.players[playingKey].status = 'Waiting'; // When Player is One Then Change Player Status
        }

        playersLength =  await room.roomPlayerLength(room);
        //rake Cap;
        room.otherData.playingPlayer = playersLength;
        // Remove Player Which Have Status Left

        room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);

        let rack = await Sys.App.Services.SettingsServices.getSettingsData({}); //get Application rack

        //if (room.game == null && playersLength >= this.minPlayers) {
        if ( playersLength >= this.minPlayers) {
          let gameobj = {
            roomId: room.id,
            smallBlind: room.smallBlind,
            bigBlind: room.bigBlind,
            status: 'Running',
            otherData : room.otherData,
            rakePercenage:parseFloat(rack.rakePercenage),
            adminExtraRakePercentage:  parseFloat(rack.adminExtraRakePercentage),

          };

          let game = await Sys.Game.CashGame.Texas.Services.GameServices.create(gameobj);
          // console.log("Game :>",game);
          if(game){
            // Send Brodcast For New Updated Chips
            room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.broadcastPlayerInfo(room);

            room.game = game;
            room.game.status = 'Running';
            room.game.pot = 0;
            room.game.betName = 'bet'; //bet,raise,re-raise,cap
            room.game.bets.splice(0, room.game.bets.length);
            room.game.deck.splice(0, room.game.deck.length);
            room.game.board.splice(0, room.game.board.length);
            room.game.history.splice(0, room.game.history.length);
            for (let i = 0; i < room.players.length; i++) {
              room.game.bets[i] = 0;
              room.game.roundBets[i] = 0;
            }

            for (let rp = 0; rp < room.players.length; rp++) {
              console.log("room.players[rp].status: ", room.players[rp]);

              if (room.players[rp].status == 'Playing'){
                let transactionData = {
                  user_id           : room.players[rp].id,
                  username          : room.players[rp].playerName,
                  gameId            : room.game.id,
                  gameNumber        : room.game.gameNumber,
                  //chips             : room.players[rp].chips,
                  afterBalance      : room.players[rp].chips,
                  category          : 'debit',
                  type              : 'newhand',
                  remark            : 'Game Starting Chips'
                }

                console.log("transactionData: ", transactionData);
                //await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);
              }
            }

            console.log("--------------------Bib Blind Remove----------------------------------");
            console.log("---Dealer :::", room.players[room.dealerIndex].playerName, room.game.gameNumber);
            console.log("--- SB    :::", room.players[room.smallBlindIndex].playerName, room.game.gameNumber);
            console.log("--- BB    :::", room.players[room.bigBlindIndex].playerName, room.game.gameNumber);
            console.log("----------------------------------------------------------------------");

            for (let i = 0; i < room.players.length; i += 1) {
              room.players[i].folded = false;
              room.players[i].talked = false;
              room.players[i].allIn = false;
              room.players[i].isSidepot = false;
              room.players[i].cards.splice(0, room.players[i].cards.length);
            }

            // reset Turn  Bet When New Game Start
            room.turnBet = {action: '-', playerId: room.players[room.dealerIndex].id, betAmount: 0, raisedAmount : 0, hasRaised: false}             
              let sbChips = 0;
              let bbChips = 0;
          
              console.log("ITS HERE 2",room.players[room.smallBlindIndex]);
              if (room.players[room.smallBlindIndex].chips <= room.smallBlind) {
                sbChips = room.players[room.smallBlindIndex].chips;
                var previousBalance = room.players[room.smallBlindIndex].chips;
                room.players[room.smallBlindIndex].allIn = true;
                room.players[room.smallBlindIndex].talked = true;
                room.game.bets[room.smallBlindIndex] = parseFloat(room.players[room.smallBlindIndex].chips);
                room.game.history.push({
                  time: new Date(),
                  playerId: room.players[room.smallBlindIndex].id,
                  playerName: room.players[room.smallBlindIndex].playerName,
                  totalPot:0,
                  betAmount: parseFloat( parseFloat( room.players[room.smallBlindIndex].chips ).toFixed(4) ),
                  totalBetAmount: parseFloat( parseFloat( room.smallBlind ).toFixed(4) ),
                  playerAction: Sys.Config.Texas.AllIn,
                  remaining: 0,
                  boardCard: room.game.board
                });
                room.players[room.smallBlindIndex].chips = 0;
                room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips) + parseFloat(room.players[room.smallBlindIndex].chips));
              } else {
                var previousBalance = room.players[room.smallBlindIndex].chips;
                sbChips = room.smallBlind;
                room.players[room.smallBlindIndex].chips -= room.smallBlind;
                room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips) + parseFloat(sbChips));
                room.game.bets[room.smallBlindIndex] = room.smallBlind;
                room.game.history.push({
                  time: new Date(),
                  playerId: room.players[room.smallBlindIndex].id,
                  playerName: room.players[room.smallBlindIndex].playerName,
                  betAmount: parseFloat( parseFloat( room.smallBlind ).toFixed(4) ),
                  totalBetAmount: parseFloat( parseFloat( room.smallBlind).toFixed(4) ),
                  totalPot:0,
                  playerAction: Sys.Config.Texas.SmallBlind,
                  remaining: parseFloat( parseFloat(room.players[room.smallBlindIndex].chips).toFixed(4) ),
                  boardCard: room.game.board
                });
              }
              
              let transactionDataSB = {
                user_id: room.players[room.smallBlindIndex].id,
                username: room.players[room.smallBlindIndex].playerName,
                tableId: room.id,
                tableName: room.tableNumber,
                gameId: room.game.id,
                gameNumber: room.game.gameNumber,
                chips:	parseFloat(sbChips),
                previousBalance: parseFloat(previousBalance),
                afterBalance: parseFloat(room.players[room.smallBlindIndex].chips),
                category:	'debit',
                type:	'entry',
                remark: 'Small Blind',
                isTournament: 'No',
                isGamePot: 'yes'
              }
              await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataSB);

              var totalGamePot = 0;
              for(var gp =0; gp<room.game.bets.length; gp++){
                totalGamePot += parseFloat(room.game.bets[gp]);
              }

              let transactionDataSBP = {
                user_id: room.players[room.smallBlindIndex].id,
                username: room.players[room.smallBlindIndex].playerName,
                tableId: room.id,
                tableName: room.tableNumber,
                gameId: room.game.id,
                gameNumber: room.game.gameNumber,
                chips:  parseFloat(totalGamePot),
                previousBalance: parseFloat(0),
                afterBalance: parseFloat(totalGamePot),
                category: 'credit',
                type: 'entry',
                remark: 'Game Pot',
                isTournament: 'No',
                isGamePot: 'yes'
              }
              await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataSBP);

              console.log("small blind totalGamePot: ", totalGamePot);

              if (room.players[room.bigBlindIndex].chips <= room.bigBlind) {
                bbChips = room.players[room.bigBlindIndex].chips;
                var previousBalance = room.players[room.bigBlindIndex].chips;
                room.players[room.bigBlindIndex].allIn = true;
                room.players[room.bigBlindIndex].talked = true;
                room.game.bets[room.bigBlindIndex] = parseFloat(room.players[room.bigBlindIndex].chips);
                room.game.history.push({
                  time: new Date(),
                  playerId: room.players[room.bigBlindIndex].id,
                  playerName: room.players[room.bigBlindIndex].playerName,
                  totalPot:0,
                  betAmount: parseFloat( parseFloat( room.players[room.bigBlindIndex].chips).toFixed(4) ),
                  totalBetAmount: parseFloat( parseFloat(room.bigBlind).toFixed(4) ),
                  playerAction: Sys.Config.Texas.AllIn,
                  remaining: 0,
                  boardCard: room.game.board
                });
                room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips) + parseFloat(room.players[room.bigBlindIndex].chips));
                room.players[room.bigBlindIndex].chips = 0;
              } else {
                bbChips = room.bigBlind;
                var previousBalance = room.players[room.bigBlindIndex].chips;
                room.players[room.bigBlindIndex].chips -= room.bigBlind;
                room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips) + parseFloat(bbChips));
                room.game.bets[room.bigBlindIndex] = parseFloat(room.bigBlind);
                room.game.history.push({
                  time: new Date(),
                  playerId: room.players[room.bigBlindIndex].id,
                  playerName: room.players[room.bigBlindIndex].playerName,
                  totalPot:0,
                  betAmount: parseFloat( parseFloat( room.bigBlind).toFixed(4) ),
                  totalBetAmount: parseFloat( parseFloat(room.bigBlind).toFixed(4) ),
                  playerAction: Sys.Config.Texas.BigBlind,
                  remaining: parseFloat( parseFloat( room.players[room.bigBlindIndex].chips ).toFixed(4) ),
                  boardCard: room.game.board
                });
              }

              let transactionDataBB = {
                user_id: room.players[room.bigBlindIndex].id,
                username: room.players[room.bigBlindIndex].playerName,
                tableId: room.id,
                tableName: room.tableNumber,
                gameId: room.game.id,
                gameNumber: room.game.gameNumber,
                chips:  parseFloat(bbChips),
                previousBalance: parseFloat(previousBalance),
                afterBalance: parseFloat(room.players[room.bigBlindIndex].chips),
                category: 'debit',
                type: 'entry',
                remark: 'Big Blind',
                isTournament: 'No',
                isGamePot: 'no'
              }
              await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataBB);

              var gamePortData = await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.getSingleData({isGamePot: 'yes',gameId: room.game.id});
              var currentTotalChips = (parseFloat(gamePortData.afterBalance) + parseFloat(bbChips));

              let transactionDataBBPot = {
                user_id: room.players[room.bigBlindIndex].id,
                username: room.players[room.bigBlindIndex].playerName,
                tableId: room.id,
                tableName: room.tableNumber,
                gameId: room.game.id,
                gameNumber: room.game.gameNumber,
                chips:  parseFloat(bbChips),
                previousBalance: parseFloat(gamePortData.afterBalance),
                afterBalance: parseFloat(currentTotalChips),
                category: 'credit',
                type: 'entry',
                remark: 'Game Pot',
                isTournament: 'No',
                isGamePot: 'yes'
              }
              await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataBBPot);
              
              console.log("big blind gamePortData: ", gamePortData);            
              playersLength =  await room.roomPlayerLength(room);

              if (playersLength >= room.minPlayers) {
                room.game.status = 'Running';
                room.status = 'Running';
                await Sys.Game.CashGame.Texas.newControllers.RoomProcess.newGameStarted(room);
                room.initNewRound();
              }else{
                console.log("game finished before card distribute");
                room.game.deck = [];
                room.gameWinners = [];
                room.gameLosers = [];
                await new Sys.Game.CashGame.Texas.Entities.Deck().fillDeck(room.game.deck);
                for (let i = 0; i < room.players.length; i += 1) {
                  if(room.players[i].status == 'Playing' && room.players[i].folded == false){
                    room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
                    room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
                    room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
                    room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
                    room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
                    room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
                  }
                }
                console.log("room here", JSON.stringify(room.players));
                room.currentPlayer = room.dealerIndex + 3;
                let checkForEndOfRoundTemp = await Sys.Game.CashGame.Texas.newControllers.PlayerProcess.checkForEndOfRound(room);
                console.log("statttttt", room.game.status,checkForEndOfRoundTemp );
                if (checkForEndOfRoundTemp === true || room.game.status == "ForceFinishedFolded" || room.game.status == "ForceFinishedAllIn") {
                  console.log("progress called event if other player lefts the game");
                  Sys.Game.CashGame.Texas.newControllers.PlayerProcess.progress(room);
                }
              }
           

          }else{ // Shiv!@#
            console.log("Game Not Created. So Try Again...");
            room.StartGame();
          }
        }else{
          clearTimeout(Sys.Timers[room.id]);
          clearInterval(Sys.Timers[room.id]);
          console.log("removed error",room.game, playersLength)
          room.status = 'Finished';
          room.game = null;
          room.timerStart = false;
          // console.log("sitout next hand room", room);
          console.log("single Player Remain After Bib Blind Player Left. So Game Not starting...");
          room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
          // console.log("sitout next hand after room", room)
        }
      }
    } catch (e) {
			console.log("Error In start Game : ", e);
		}
  }

  async initNewRound() {
    console.log("Init new Round");
    var room = this
    console.log("Befor Fill Deck")
    room.game.deck = [];
    await new Sys.Game.CashGame.Texas.Entities.Deck().fillDeck(room.game.deck);
    room.NewRound();
  };


  async NewRound() {
     console.log("New Round")
     var room = this;
     // removed because dealer is already assigned so can not make waiting player to playing player, do it on startGame
     /*for (var i in room.players) {
       if (room.players[i].status == 'Waiting') {
         room.players[i].status = 'Playing'
       }
     }*/
     room.gameWinners = [];
     room.gameLosers = [];

     //Deal 2 cards to each player
     for (let i = 0; i < room.players.length; i += 1) {
       //if(room.players[i].status != 'Ideal' && room.players[i].status != 'Left'){
        if(room.players[i].status == 'Playing'){
        /*if(i == 0){
          room.players[i].cards.push('JD');
          room.players[i].cards.push('AH');
        }else if(i == 1){
          room.players[i].cards.push('TD');
          room.players[i].cards.push('3C');
        }else{
          room.players[i].cards.push('AC');
          room.players[i].cards.push('JD');
        }*/
        room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
        room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
        room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
        room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
        room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
        room.players[i].cards.push(room.game.deck[Math.floor(Math.random() * 52)]);
       }
     }



     let  playersLength =  await room.roomPlayerLength(room);

     if(playersLength == 2){
        // get currentPlayer
        room.currentPlayer = room.dealerIndex;
        if (room.currentPlayer >= playersLength) {
          room.currentPlayer -= playersLength;
        }
        if (room.currentPlayer >= playersLength) {
          room.currentPlayer -= playersLength;
        }
     }else{
        // get currentPlayer
        room.currentPlayer = room.dealerIndex + 3;
        if (room.currentPlayer >= playersLength) {
          room.currentPlayer -= playersLength;
        }
        if (room.currentPlayer >= playersLength) {
          room.currentPlayer -= playersLength;
        }
     }

    
     //Force Blind Bets

     console.log("--------------------After SB and BB assign----------------------------------");
     console.log("---Dealer :::", room.players[room.dealerIndex].playerName, room.game.gameNumber);
     console.log("--- SB    :::", room.players[room.smallBlindIndex].playerName, room.game.gameNumber);
     console.log("--- BB    :::", room.players[room.bigBlindIndex].playerName, room.game.gameNumber);
     console.log("-- current player", room.currentPlayer, room.game.gameNumber)
     console.log("----------------------------------------------------------------------");


     console.log("Room Running");
     room.status = 'Running';
     // depriciated
     console.log("Bets ========================================================");
     console.log(room.game.bets);

     let newRoundStarted = Sys.Game.CashGame.Texas.newControllers.RoomProcess.newRoundStarted(room);


  }


  /** Start : Current  Player  Turn Button Action  */
  //START: this code is original code comment 16-08-2019
  getCurrentTurnButtonAction() {

    console.log("Room Called");

    let maxBet = parseFloat(this.getMaxBet(this.game.bets));
    let yourBet = parseFloat(this.game.bets[this.currentPlayer]);
    let playerChips;
    let raisedAmount = (this.turnBet.raisedAmount == undefined) ? 0 : this.turnBet.raisedAmount;
    let oldBet = parseFloat(this.game.bets[this.currentPlayer]);
    
    playerChips = parseFloat(this.players[this.currentPlayer].chips);

    // myraiseAmount update @chetan
    //let minRaisedAmount = parseFloat(parseFloat(maxBet + raisedAmount) - yourBet);
    console.log("maxBetOnRaise in room", parseFloat( this.game.maxBetOnRaise) );
    let minRaisedAmount = parseFloat(parseFloat( parseFloat(this.game.maxBetOnRaise) + raisedAmount) - yourBet);
    
    let isUnqualifiedRaise = this.game.isUnqualifiedRaise;

    if(raisedAmount == 0){ // Under The Gun Player Turn.
      // minRaisedAmount = parseFloat(this.bigBlind * 2) - parseFloat(yourBet);
      minRaisedAmount = (parseFloat(maxBet) + parseFloat(this.bigBlind)) - parseFloat(yourBet);
      console.log("MIN RAISE",minRaisedAmount,maxBet,yourBet)
    }
    let playerRoundRaised = parseFloat(this.players[this.currentPlayer].roundRaisedAmount);

    console.log("/------------------------------------------------------------------------------------------/")
    console.log("player Name        : ",this.players[this.currentPlayer].playerName);
    console.log("Max Bet            : ",maxBet);
    console.log("Your Bet           : ",yourBet);
    console.log("Player Chips       : ",playerChips);
    console.log("RaisedAmount       : ",raisedAmount);
    console.log("Call Value         : ",parseFloat(maxBet - yourBet));
    console.log("Min Raised Amount  : ",minRaisedAmount);
    console.log("isUnqualified  : ",isUnqualifiedRaise);
    console.log("playerRoundRaised  : ",playerRoundRaised);
    console.log("/------------------------------------------------------------------------------------------/")

    // Check For All In
    if(playerChips <= parseFloat(maxBet - yourBet)){
      console.log("ALL In.......");
      if( ( playerRoundRaised > 0 && playerRoundRaised >=  minRaisedAmount && isUnqualifiedRaise == true ) || ( this.game.stopReraise == true ) ){
        console.log("**************reraise or allin is not allowed through allin******", playerRoundRaised, maxBet,yourBet, parseFloat(maxBet - yourBet)  )
        this.game.stopReraise = true;
        console.log("stopreraise or allin inn",this.game.stopReraise )
        return {
          allIn : false,
          allInAmount : 0,
          check : false,
          call : true,
          callAmount : parseFloat(maxBet - yourBet),
          raise : false,
          bet : false,
          betAmount : 0.00,
          minRaise : 0.0,
          maxRaise : 0.0
        }
      }
      return {
        allIn : true,
        allInAmount : parseFloat(playerChips),
        check : false,
        call : false,
        callAmount : 0.0,
        raise : false,
        bet : false,
        betAmount : 0.00,
        minRaise : 0.0,
        maxRaise : 0.0
      }
    }

    // Check for Call
    if(yourBet < maxBet){
      console.log("Call .......");
      if( parseFloat(maxBet - yourBet) < parseFloat(playerChips) && minRaisedAmount < parseFloat(playerChips) ){
        minRaisedAmount = (minRaisedAmount < parseFloat(playerChips)) ? minRaisedAmount : parseFloat(playerChips);

        console.log("stopreraise",this.game.stopReraise )
        if( ( playerRoundRaised > 0 && playerRoundRaised >=  minRaisedAmount && isUnqualifiedRaise == true ) || ( this.game.stopReraise == true ) ){
          console.log("**************reraise is not allowed******", playerRoundRaised, maxBet,yourBet, parseFloat(maxBet - yourBet)  )
          this.game.stopReraise = true;
          console.log("stopreraise inn",this.game.stopReraise )
          return {
            allIn : false,
            allInAmount : 0,
            check : false,
            call : true,
            callAmount : parseFloat(maxBet - yourBet),
            raise : false,
            bet : false,
            betAmount : 0.00,
            minRaise : 0.0,
            maxRaise : 0.0
          }
        }
        console.log("in call raise fnction")
        return {
          allIn : false,
          allInAmount : 0,
          check : false,
          call : true,
          callAmount : parseFloat(maxBet - yourBet),
          raise : true,
          bet : false,
          betAmount : 0.00,
          minRaise : parseFloat(minRaisedAmount),
          maxRaise : parseFloat(playerChips)
        }

      }else{

        if( ( playerRoundRaised > 0 && playerRoundRaised >=  minRaisedAmount && isUnqualifiedRaise == true ) || ( this.game.stopReraise == true ) ){
          console.log("**************reraise is not allowed through call in else function******", playerRoundRaised, maxBet,yourBet, parseFloat(maxBet - yourBet)  )
          this.game.stopReraise = true;
          console.log("stopreraise inn else ",this.game.stopReraise )
          return {
            allIn : false,
            allInAmount : 0,
            check : false,
            call : true,
            callAmount : parseFloat(maxBet - yourBet),
            raise : false,
            bet : false,
            betAmount : 0.00,
            minRaise : 0.0,
            maxRaise : 0.0
          }
        }

        return {
          allIn : true,
          allInAmount : parseFloat(playerChips),
          check : false,
          call : true,
          callAmount : parseFloat(maxBet - yourBet),
          raise : false,
          bet : false,
          betAmount : 0.00,
          minRaise : 0.0,
          maxRaise : 0.0
        }

      }
    }

    // Check for Check

    if(yourBet == maxBet){
      console.log("Check .......");
      let room = this;
      console.log("room.game.bets: ", room.game.bets);

      if(room.game.bets.length > 0){
        var totalBetAmt = 0.00
        for(var i=0; i<room.game.bets.length; i++){
          totalBetAmt += room.game.bets[i];
        }
        console.log("Check ....... totalBetAmt: ", totalBetAmt);
      }

      minRaisedAmount = (minRaisedAmount < parseFloat(playerChips)) ? minRaisedAmount : parseFloat(playerChips);
      if(parseInt(totalBetAmt) == 0 ){
        return {
          allIn : false,
          check : true,
          call : false,
          callAmount : 0.0,
          raise : false,
          bet : true,
          betAmount : parseFloat(minRaisedAmount),
          minRaise : parseFloat(minRaisedAmount),
          maxRaise : parseFloat(playerChips)
        }
      }else{
        if(minRaisedAmount >= this.players[this.currentPlayer].chips){
          return {
            allIn : true,
            allInAmount : parseFloat(playerChips),
            check : true,
            call : false,
            callAmount : 0.0,
            raise : false,
            bet : false,
            betAmount : 0.00,
            minRaise : 0.0,
            maxRaise : 0.0
          }
        }else{
          return {
            allIn : false,
            check : true,
            call : false,
            callAmount : 0.0,
            raise : true,
            bet : false,
            betAmount : 0.00,
            minRaise : parseFloat(minRaisedAmount),
            maxRaise : parseFloat(playerChips)
          }
        }
       
      }
    }

  }
  //END: this code is original code comment 16-08-2019

  //START: this code is only for testing 16-08-2019
  /*getCurrentTurnButtonAction() {

    console.log("Room Called");

    let maxBet = parseFloat(this.getMaxBet(this.game.bets));
    let yourBet = parseFloat(this.game.bets[this.currentPlayer]);
    let playerChips = parseFloat(this.players[this.currentPlayer].chips);
    let raisedAmount = (this.turnBet.raisedAmount == undefined) ? 0 : this.turnBet.raisedAmount;

    // myraiseAmount update @chetan
    //let minRaisedAmount = parseFloat(parseFloat(maxBet + raisedAmount) - yourBet);
    console.log("maxBetOnRaise in room", parseFloat( this.game.maxBetOnRaise) );
    let minRaisedAmount = parseFloat(parseFloat( parseFloat(this.game.maxBetOnRaise) + raisedAmount) - yourBet);


    if(raisedAmount == 0){ // Under The Gun Player Turn.
       minRaisedAmount = parseFloat(this.bigBlind * 2) - parseFloat(yourBet);
    }
    let playerRoundRaised = parseFloat(this.players[this.currentPlayer].roundRaisedAmount);

    console.log("/------------------------------------------------------------------------------------------/")
    console.log("player Name        : ",this.players[this.currentPlayer].playerName);
    console.log("Max Bet            : ",maxBet);
    console.log("Your Bet           : ",yourBet);
    console.log("Player Chips       : ",playerChips);
    console.log("RaisedAmount       : ",raisedAmount);
    console.log("Call Value         : ",parseFloat(maxBet - yourBet));
    console.log("Min Raised Amount  : ",minRaisedAmount);
    console.log("/------------------------------------------------------------------------------------------/")

    // Check For All In
    if(playerChips <= parseFloat(maxBet - yourBet)){
      console.log("my code");
      console.log("ALL In.......");
      return {
        allIn : true,
        allInAmount : parseFloat(playerChips),
        check : false,
        call : false,
        callAmount : 0.0,
        raise : false,
        minRaise : 0.0,
        maxRaise : 0.0
      }
    }

    // Check for Call
    if(yourBet < maxBet){
      console.log("Call .......");
      if( parseFloat(maxBet - yourBet) < parseFloat(playerChips) && minRaisedAmount < parseFloat(playerChips) ){
        minRaisedAmount = (minRaisedAmount < parseFloat(playerChips)) ? minRaisedAmount : parseFloat(playerChips);

        console.log("stopreraise",this.game.stopReraise )
        // if( ( playerRoundRaised > 0 && playerRoundRaised >=  parseFloat(maxBet - yourBet) ) || ( this.game.stopReraise == true ) ){
        //   console.log("**************reraise is not allowed******", playerRoundRaised, maxBet,yourBet, parseFloat(maxBet - yourBet)  )
        //   this.game.stopReraise = true;
        //   console.log("stopreraise inn",this.game.stopReraise )
        //   console.log("sercamstances  code");
        //   return {
        //     allIn : false,
        //     allInAmount : 0,
        //     check : false,
        //     call : true,
        //     callAmount : parseFloat(maxBet - yourBet),
        //     raise : true,
        //     minRaise : 0.0,
        //     maxRaise : 0.0
        //   }
        // }
        console.log("in call raise fnction")

        return {
          allIn : false,
          allInAmount : 0,
          check : false,
          call : true,
          callAmount : parseFloat(maxBet - yourBet),
          raise : true,
          minRaise : parseFloat(minRaisedAmount),
          maxRaise : parseFloat(playerChips)
        }

      }else{
        return {
          allIn : false,
          allInAmount : 0,
          check : false,
          call : true,
          callAmount : parseFloat(maxBet - yourBet),
          raise : true,
          minRaise : parseFloat(maxBet - yourBet),
          maxRaise : parseFloat(playerChips),
        }

      }
    }

    // Check for Check

    if(yourBet == maxBet){
      console.log("Check .......");
      minRaisedAmount = (minRaisedAmount < parseFloat(playerChips)) ? minRaisedAmount : parseFloat(playerChips);
          return {
            allIn : false,
            check : true,
            call : false,
            callAmount : 0.0,
            raise : true,
            minRaise : parseFloat(minRaisedAmount),
            maxRaise : parseFloat(playerChips)
          }
    }

  }*/
  //END: this code is only for testing 16-08-2019

  getDefaultButtons() {
    let buttonArray = [];
      for (let i = 0; i < this.players.length; i += 1) {
        if(this.players[this.currentPlayer].id != this.players[i].id){
          buttonArray.push({
            playerId : this.players[i].id,
            isFold :  this.players[i].isFold,
            isCheck :  this.players[i].isCheck,
            isCall :  this.players[i].isCall,
          })
        }
      }
    return buttonArray;
  }

  getMaxBet(bets) {
    var maxBet, i;
    maxBet = 0;
    for (i = 0; i < bets.length; i += 1) {
        if (bets[i] > maxBet) {
            maxBet = bets[i];
        }
    }
    return maxBet;
  }

   /** End : Current  Player  Turn Button Action */


   // Playing Player Lenght
   async roomPlayerLength(room){
    let playersLength = 0;
    for(let i=0; i < room.players.length; i++){
      if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting') {
        playersLength++;
      }
    }
   
    return playersLength;
   }


   async roomDealerPositionSet(room,idDealerIgnore){

   
    let playersLength = 0;
    for(let i=0; i < room.players.length; i++){
      if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting') {
        playersLength++;
      }
    }
   
    console.log("ROOM PLAYERS LENGTH",playersLength)


    if(idDealerIgnore == false){
      if(room.dealer == -1){
        console.log("First Time Game Play :");
        room.dealer = room.players[0].seatIndex;
      }

      console.log("Old Dealer Seatindex :",room.dealer);
      // Find Next Dealer By Seatindex
      let newDealerFound = false;

      for(let i=0; i < room.players.length; i++){
        console.log("event data1",room.players.length,i, room.players[i].playerName,room.players[i].status)
        if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting') {
          if(room.players[i].seatIndex > room.dealer){
            room.dealer = room.players[i].seatIndex;
            newDealerFound = true;
            room.dealerIndex = i;
            console.log("ROOM OF PALYERS",room.players.length,i)
            break;
          }
        }
      }

      if(newDealerFound == false){
        for(let i=0; i < room.players.length; i++){
          if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting') {
            if(room.players[i].seatIndex < room.dealer){
              room.dealer = room.players[i].seatIndex;
              room.dealerIndex = i;
            }
          }
        }
      }
    }else{
      for(let i=0; i < room.players.length; i++){console.log("event data2", room.players[i].playerName)
        if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal' && room.players[i].status != 'Waiting') {
          if(room.players[i].seatIndex == room.dealer){
            room.dealerIndex = i;
          }
          console.log("ROOM OF PALYERS",room.players.length,i)
        }
      }
    }

    console.log("New Dealer Seatindex :",room.dealerIndex);

    if(playersLength == 2){
      //Identify Small and Big Blind player index
      room.smallBlindIndex = room.dealerIndex;
      if (room.smallBlindIndex >= playersLength) {
        room.smallBlindIndex = 0;
      }
      if (room.smallBlindIndex >= playersLength) {
        room.smallBlindIndex -= playersLength;
      }
      room.bigBlindIndex = room.dealerIndex + 1;
      if (room.bigBlindIndex >= playersLength) {
        //room.bigBlindIndex -= playersLength;
        room.bigBlindIndex == room.smallBlindIndex+1;
      }
      if (room.bigBlindIndex >= playersLength) {
        room.bigBlindIndex -= playersLength;
      }
    }else{
      //Identify Small and Big Blind player index
      room.smallBlindIndex = room.dealerIndex + 1;
      if (room.smallBlindIndex >= playersLength) {
        room.smallBlindIndex = 0;
      }
      if (room.smallBlindIndex >= playersLength) {
        room.smallBlindIndex -= playersLength;
      }
      room.bigBlindIndex = room.dealerIndex + 2;
      if (room.bigBlindIndex >= playersLength) {
        //room.bigBlindIndex -= playersLength;
        room.bigBlindIndex == room.smallBlindIndex+1;
      }
      if (room.bigBlindIndex >= playersLength) {
        room.bigBlindIndex -= playersLength;
      }
    }

    

    let totalPlayers = 0;
    for (i = 0; i < room.players.length; i++) {
      if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal') {
        totalPlayers++;
      }
    }

  
    if(room.dealer == room.oldDealerIndex){
      console.log("ITS HERE 3")
      room.dealerIndex = room.dealerIndex + 1;
      room.smallBlindIndex = room.smallBlindIndex + 1;
      room.bigBlindIndex = room.bigBlindIndex + 1;

      if (room.dealerIndex >= playersLength) {
        room.dealerIndex = 0;
      }
      if (room.dealerIndex >= playersLength) {
        room.dealerIndex -= playersLength;
      }
      if (room.smallBlindIndex >= playersLength) {
        room.smallBlindIndex = 0;
      }
      if (room.smallBlindIndex >= playersLength) {
        room.smallBlindIndex -= playersLength;
      } 
      if (room.bigBlindIndex >= playersLength) {
        room.bigBlindIndex == room.smallBlindIndex+1;
      }
      if (room.bigBlindIndex >= playersLength) {
        room.bigBlindIndex -= playersLength;
      }
    }
   
    room.dealer = room.players[room.dealerIndex].seatIndex;

    console.log("ROOM PLAYERS LENGTH",room.players.length)
    console.log("DEALER INDEX",room.dealerIndex)
    console.log("SMALL BLIND INDEX",room.smallBlindIndex)
    console.log("BIG BLIND INDEX",room.bigBlindIndex)
    console.log("UPDATED DEALAR",room.dealer)
    console.log("-------------------")
    console.log("ROOM OLD DEALER INDEX",room.oldDealerIndex)
    console.log("ROOM OLD SB INDEX",room.oldSmallBlindIndex)
    console.log("ROOM OLD BB INDEX",room.oldBigBlindIndex)
    console.log("--------------------After SB and BB assign----------------------------------");
    console.log("---Dealer :::", room.players[room.dealerIndex].playerName);
    console.log("--- SB    :::", room.players[room.smallBlindIndex].playerName);
    //console.log("--- BB    :::", room.players[room.bigBlindIndex].playerName);
    console.log("-- current player",room.players[room.currentPlayer])
    console.log("----------------------------------------------------------------------");
    return room;
  }

}

module.exports = Room
