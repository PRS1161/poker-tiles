var Sys = require('../../../../Boot/Sys');

class Game {
  constructor(id, roomId, smallBlind, bigBlind, status, pot, roundName, betName, bets, roundBets, deck, board, players, winners, history, gameNumber, sidePotAmount, playerSidePot, gamePot, gameMainPot, gameRevertPoint,  otherData, maxBetOnRaise, stopReraise, aggressorIdArray, isUnqualifiedRaise, tempSidepot, rakePercenage, rakeDistribution,winnerDetails,rakeCap,gameTotalChips,adminExtraRakePercentage) {

    this.id = id;
    this.roomId = roomId;
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
    this.status = (status) ? status : 'Waiting';
    this.pot = (pot) ? pot : 0;
    this.roundName = (roundName) ? roundName : 'Preflop';
    this.betName = (betName) | 'bet';
    this.bets = (bets) ? bets : [];
    this.roundBets = (roundBets) ? roundBets : [];
    this.deck = (deck) ? deck : [];
    this.board = (board) ? board : [];
    this.players = (players) ? players : [];
    this.winners = (winners) ? winners : [];
    this.history = (history) ? history : [];
    this.gameNumber = gameNumber;
    this.sidePotAmount = sidePotAmount,
      this.playerSidePot = playerSidePot,
      this.gamePot = gamePot,
      this.gameMainPot = gameMainPot,
      this.gameRevertPoint = gameRevertPoint,
      this.otherData = otherData,
      this.maxBetOnRaise = (maxBetOnRaise) ? maxBetOnRaise : 0; // maximum bet value when raised
    this.stopReraise = (stopReraise) ? stopReraise : false;
    this.aggressorIdArray = (aggressorIdArray) ? aggressorIdArray : [];
    this.isUnqualifiedRaise = (isUnqualifiedRaise) ? isUnqualifiedRaise : false;
    this.tempSidepot = (tempSidepot) ? tempSidepot : [];
    this.rakePercenage = rakePercenage;
    this.rakeDistribution=rakeDistribution;
    this.winnerDetails=winnerDetails
    this.rakeCap=rakeCap;
    this.gameTotalChips=gameTotalChips;
    this.adminExtraRakePercentage=adminExtraRakePercentage;
  }

  createObject(game) {
    return new Game(
      game.id,
      game.roomId,
      game.smallBlind,
      game.bigBlind,
      game.status,
      game.pot,
      game.roundName,
      game.betName,
      game.bets,
      game.roundBets,
      game.deck,
      game.board,
      game.players,
      game.winners,
      game.history,
      game.gameNumber,
      game.sidePotAmount,
      game.playerSidePot,
      game.gamePot,
      game.gameMainPot,
      game.gameRevertPoint,
      game.otherData,
      game.maxBetOnRaise,
      game.stopReraise,
      game.aggressorIdArray,
      game.isUnqualifiedRaise,
      game.tempSidepot,
      game.rakePercenage,
      game.rakeDistribution,
      game.winnerDetails,
      game.rakeCap,
      game.gameTotalChips,
      game.adminExtraRakePercentage
    );
  }

  toJson() {
    var game = {
      id: this.id,
      roomId: this.roomId,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      status: this.status,
      pot: this.pot,
      roundName: this.roundName,
      betName: this.betName,
      bets: this.bets,
      roundBets: this.roundBets,
      deck: this.deck,
      board: this.board,
      players: this.players,
      winners: this.winners,
      history: this.history,
      gameNumber: this.gameNumber,
      sidePotAmount: this.sidePotAmount,
      playerSidePot: this.playerSidePot,
      gamePot: this.gamePot,
      gameMainPot: this.gameMainPot,
      gameRevertPoint: this.gameRevertPoint,
      otherData: this.otherData,
      maxBetOnRaise: this.maxBetOnRaise,
      stopReraise: this.stopReraise,
      aggressorIdArray: this.aggressorIdArray,
      isUnqualifiedRaise: this.isUnqualifiedRaise,
      tempSidepot: this.tempSidepot,
      rakePercenage: this.rakePercenage,
      rakeDistribution:this.rakeDistribution,
      winnerDetails:this.winnerDetails,
      rakeCap:this.rakeCap,
      gameTotalChips:this.gameTotalChips,
      adminExtraRakePercentage:this.adminExtraRakePercentage,
    };
    return game;
  }



  /*async getSidePotAmount(room){

    console.log('<=> Save Side Pot Data ||  Texas GAME-NUMBER ['+room.game.gameNumber+'] || Room Round Name : ' , room.game.roundName);
    
    let players = room.players;
    let game = room.game;
    let pot = [];
    let sidepPot = {};
    // let gamePot = [];
    let allInPlayers = [];
    let allInPlayersSidePot = [];
    let playerIndex = [];
    let playerIds = [];

    let gameMainPot = 0;
    let mainPortAddMore = 0; 

    let extraAmount = 0; // Lefted / Folded Player Amount
    console.log("players array before calculation sidepot", players)

    // check for allin polayers and playingplayers
    let totalAllInPlayers= 0;
    let totalPlayingPlayers = 0;
    for (let i = 0; i < room.players.length; i++) {
      if (room.players[i].allIn == true ) {
        totalAllInPlayers++
      }
      if(room.players[i].status == 'Playing' && room.players[i].folded == false){
        totalPlayingPlayers++
      }
    }
    console.log("conditional status", totalPlayingPlayers, totalAllInPlayers)
    if(totalPlayingPlayers == 1 && totalAllInPlayers > 0){
      console.log("in first condition")
      
      let playingPlayerBet;
      let playingPlayerId;
      let totalWinAmountForPlayingPlayer=0;
      let playingPlayerIndex;
      for (let i = 0; i < room.players.length; i++) {
        if(room.players[i].status == 'Playing' && room.players[i].folded == false){
           console.log("Push Playing Player  :",room.players[i].playerName,game.roundBets[i]);
           playingPlayerBet=  game.roundBets[i];
           playingPlayerId = room.players[i].id;
           playingPlayerIndex = i;
           totalWinAmountForPlayingPlayer +=playingPlayerBet;
           break;
        }
      }

      console.log("playing player bets", playingPlayerBet, playingPlayerId)

      for (let i = 0; i < room.players.length; i++) {
        if( (room.players[i].status == 'Left' && room.players[i].talked == true && room.players[i].allIn == true )){
          if( game.roundBets[i]  <  playingPlayerBet ){
            totalWinAmountForPlayingPlayer += game.roundBets[i];
          }
          else{
            totalWinAmountForPlayingPlayer += playingPlayerBet;
            game.gameRevertPoint.push({
              playerID : room.players[i].id,
              amount : (game.roundBets[i] - playingPlayerBet),
              playerIndex : i
            });
          }
        }
       
        if ( (room.players[i].folded == true || room.players[i].status === 'Left') && room.players[i].allIn == false && room.players[i].talked == true) {
          room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;
          console.log("Extrat amont Of Player : ",room.players[i].playerName);
          console.log("Extrat amont  : ",game.roundBets[i]);
          extraAmount += game.roundBets[i];
        }

      }
      totalWinAmountForPlayingPlayer += extraAmount;
      console.log("final ammounttt", totalWinAmountForPlayingPlayer, playingPlayerId, playingPlayerIndex)
      if(totalWinAmountForPlayingPlayer > 0){
        game.gameRevertPoint.push({
          playerID : playingPlayerId,
          amount : totalWinAmountForPlayingPlayer,
          playerIndex : playingPlayerIndex
        });
      }
      
  
    }else{
      for (let i = 0; i < room.players.length; i++) {
        //if (room.players[i].allIn == true && room.players[i].status === 'Playing' ) {
        if (room.players[i].allIn == true && (  (room.players[i].status == 'Playing' ) || (room.players[i].status == 'Left' && room.players[i].talked == true )  ) ) {  
          console.log("Push All in Player  :",room.players[i].playerName);
          allInPlayers.push(i);
          allInPlayersSidePot.push({ id: room.players[i].id, bet: game.roundBets[i] , seatIndex : room.players[i].seatIndex, index : i });
        }
        console.log("sidepot allInPlayersSidePot", allInPlayersSidePot)
        console.log("sidepot allInPlayers", allInPlayers)
       // if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left')) {
        if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left') && room.players[i].allIn == false && room.players[i].talked == true) {
          room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;
          console.log("Extrat amont Of Player : ",room.players[i].playerName);
          console.log("Extrat amont  : ",game.roundBets[i]);
          extraAmount += game.roundBets[i];
        }
      }
      console.log("sidepot extraAmount", extraAmount)    
      if (allInPlayers.length > 0) {

        // Just sort By Bet Amount
        allInPlayersSidePot.sort(function (a, b) {
          return a.bet - b.bet;
        });
        console.log("Game Round Bets : ",game.roundBets);
        console.log("allInPlayers : ",allInPlayers);
        console.log("allInPlayersSidePot : ",allInPlayersSidePot);
        
        let allInValue = 0;
        for (let j = 0; j < allInPlayersSidePot.length; j++) {
          let sumOfBet =  0;
          console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++")
          console.log("sidepot  j", j)
          console.log("sidepot allinplayuersidepot", allInPlayersSidePot[j])
          console.log("sidepot  allinvalue", allInValue)
          console.log("sidepot  sumOfBet", sumOfBet)
          console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++")
          for (let i = 0; i < game.roundBets.length; i++) {
            if (game.roundBets[i] >= allInPlayersSidePot[j].bet) {
              sumOfBet += allInPlayersSidePot[j].bet - allInValue;
            }
          }

          playerIndex = []; 
          playerIds = [];
          for (let i = 0; i < room.players.length; i++) { 
            console.log("------------------------------");
            console.log("Add Player Chips Name ->",room.players[i].playerName)
            console.log("room.players[i].isSidepot ->",room.players[i].isSidepot);
           // if(room.players[i].isSidepot == false && room.players[i].status === 'Playing'){ // chekc Already Side Pot not Calculate.
            if(room.players[i].isSidepot == false && ( room.players[i].status === 'Playing' || (room.players[i].status == 'Left' && room.players[i].talked == true )  )){ // chekc Already Side Pot not Calculate.
              playerIndex.push(i); // Add Aligible Player indexses for this Side pot.
              playerIds.push(room.players[i].id);
            }
          }
          console.log("sidepot  playerIndex", playerIndex)
          console.log("sidepot  playerIds", playerIds)
          console.log("sumOfBet ->",sumOfBet);
          console.log("Final  extraAmount ->",extraAmount);
          sumOfBet += extraAmount;
          extraAmount = 0; // After Assign value to Side Por Set Value 0
          
          console.log("New sumOfBet ->",sumOfBet);
          console.log("playerIndex ->",playerIndex);

        

          if(playerIndex.length == 1 ){ // When Side Pot Palyer is Single One Then We not Add This Amount in side Pot. Just Add this Amount in Main Port
            // Add GameRevertPoint to Players Chips 
           // mainPortAddMore += sumOfBet;
            game.gameRevertPoint.push({
              playerID : allInPlayersSidePot[j].id,
              amount : sumOfBet,
              playerIndex : allInPlayersSidePot[j].index
            });
            console.log("sidepot revertpoint",game.gameRevertPoint )
          } else {
            // Save All in Player Side Pot in Single Variable
            let isNotAvilabel = true;
            for(let h=0;h < game.gamePot.length; h++){
              if(game.gamePot[h].sidePotPlayerID == allInPlayersSidePot[j].id){
                isNotAvilabel = false;
              }
            }

            if(isNotAvilabel && sumOfBet > 0){
              // code for removing lefted player id from playerIds array and playerIndex
                
              for (let i = 0; i < room.players.length; i++) { 
                if(room.players[i].isSidepot == false && (room.players[i].status == 'Left' && room.players[i].talked == true ) ){ // chekc Already Side Pot not Calculate.
                
                  let removePlayerId  = playerIds.indexOf(room.players[i].id);
                  
                  if (removePlayerId > -1) {
                    playerIds.splice(removePlayerId, 1);
                    playerIndex.splice(removePlayerId, 1);
                  }
                 

                }
              }
              console.log("After removing playerIds and index",playerIds, playerIndex)

              // code for removing lefted player id from playerIds array and playerIndex
              game.gamePot.push({
                playerIds : playerIds,
                playerIndex : playerIndex,
                sidePotPlayerID : allInPlayersSidePot[j].id,
                sidePotPlayerSeatIndex : allInPlayersSidePot[j].seatIndex,
                sidePotAmount : sumOfBet
              });

              console.log("sidepot gamepot",game.gamePot)
            }
          }

          allInValue = allInPlayersSidePot[j].bet;
          room.players[allInPlayersSidePot[j].index].isSidepot = true; // When Player side Pot is Calculate then we set variable true.
         // console.log("game.gamePot",game.gamePot);
         console.log("sidepot isSidepot true or false", room.players[allInPlayersSidePot[j].index].isSidepot)
         console.log("sidepot allinValue down", allInValue)

        }

        for (let i = 0; i < game.roundBets.length; i++) {
          if (game.roundBets[i] >= allInValue) {
            gameMainPot += game.roundBets[i] - (allInValue);
          }
        }
        console.log("sidepot gameMAinPot lenght greater zero",gameMainPot)
      } 
      else {
        // Save All Bet Amount in Main Port
        for (let i = 0; i < game.roundBets.length; i++) {
          gameMainPot += game.roundBets[i];
        }
        console.log("sidepot gameMAinPot lenght  zero",gameMainPot)
      }
    }

   

    gameMainPot += mainPortAddMore;  // RefundCoin Add in Main Port
    console.log("------------------------------------------------");
    game.gameMainPot = gameMainPot;
    console.log("gameMainPot :",game.gameMainPot);
    console.log("Game POT :",game.gamePot);
    console.log("Game REvert Point :",game.gameRevertPoint);
    console.log("------------------------------------------------");
    return game.gamePot;
  }*/

  // async getSidePotAmount(room){

  //   console.log('<=> Save Side Pot Data ||  Texas GAME-NUMBER ['+room.game.gameNumber+'] || Room Round Name : ' , room.game.roundName);

  //   let players = room.players;
  //   let game = room.game;
  //   let pot = [];
  //   let sidepPot = {};
  //   // let gamePot = [];
  //   let allInPlayers = [];
  //   let allInPlayersSidePot = [];
  //   let playerIndex = [];
  //   let playerIds = [];

  //   let gameMainPot = 0;
  //   let mainPortAddMore = 0; 

  //   let extraAmount = 0; // Lefted / Folded Player Amount

  //   for (let i = 0; i < room.players.length; i++) {
  //     if (room.players[i].allIn == true && room.players[i].status === 'Playing' ) {
  //       console.log("Push All in Player  :",room.players[i].playerName, room.game.gameNumber);
  //       allInPlayers.push(i);
  //       allInPlayersSidePot.push({ id: room.players[i].id, bet: game.roundBets[i] , seatIndex : room.players[i].seatIndex, index : i });
  //     }

  //     if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left') && game.roundBets[i] != undefined && game.roundBets[i] != null  ) {
  //       room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;
  //       console.log("Extrat amont Of Player : ",room.players[i].playerName, room.game.gameNumber);
  //       console.log("Extrat amont  : ",game.roundBets[i], room.game.gameNumber);
  //       extraAmount += game.roundBets[i];
  //     }
  //   }

  //   if (allInPlayers.length > 0) {

  //     // Just sort By Bet Amount
  //     allInPlayersSidePot.sort(function (a, b) {
  //       return a.bet - b.bet;
  //     });

  //     console.log("Game Round Bets : ",game.roundBets, room.game.gameNumber);
  //     console.log("allInPlayers : ",allInPlayers, room.game.gameNumber);
  //     console.log("allInPlayersSidePot : ",allInPlayersSidePot, room.game.gameNumber);

  //     let allInValue = 0;
  //     for (let j = 0; j < allInPlayersSidePot.length; j++) {
  //       let sumOfBet =  0;
  //       for (let i = 0; i < game.roundBets.length; i++) {
  //         if (game.roundBets[i] >= allInPlayersSidePot[j].bet) {
  //           sumOfBet += allInPlayersSidePot[j].bet - allInValue;
  //         }
  //       }

  //       playerIndex = []; 
  //       playerIds = [];
  //       for (let i = 0; i < room.players.length; i++) { 
  //         console.log("------------------------------");
  //         console.log("Add Player Chips Name ->",room.players[i].playerName, room.game.gameNumber)
  //         console.log("room.players[i].isSidepot ->",room.players[i].isSidepot, room.game.gameNumber);
  //         if(room.players[i].isSidepot == false && room.players[i].status === 'Playing' && room.players[i].folded == false){ // chekc Already Side Pot not Calculate.
  //           playerIndex.push(i); // Add Aligible Player indexses for this Side pot.
  //           playerIds.push(room.players[i].id);
  //         }
  //       }

  //       console.log("sumOfBet ->",sumOfBet, room.game.gameNumber);
  //       console.log("Final  extraAmount ->",extraAmount, room.game.gameNumber);
  //       sumOfBet += extraAmount;
  //       extraAmount = 0; // After Assign value to Side Por Set Value 0

  //       console.log("New sumOfBet ->",sumOfBet, room.game.gameNumber);
  //       console.log("playerIndex ->",playerIndex, room.game.gameNumber);



  //       if(playerIndex.length == 1 ){ // When Side Pot Palyer is Single One Then We not Add This Amount in side Pot. Just Add this Amount in Main Port
  //         // Add GameRevertPoint to Players Chips 
  //        // mainPortAddMore += sumOfBet;

  //        console.log("When player index array length 1 sumOfBet: ", sumOfBet);

  //        if(room.game.status == 'ForceFinishedFolded'){

  //         console.log("When player index array length 1 and room.game.status forcefinishfolded: ", sumOfBet);

  //         game.gameRevertPoint.push({
  //           playerID : allInPlayersSidePot[j].id,
  //           amount : + parseFloat(sumOfBet).toFixed(4),
  //           playerIndex : allInPlayersSidePot[j].index,
  //           forcefinishfolded : true,
  //         });

  //         console.log("When player index array length 1 and room.game.status forcefinishfolded: after", game.gameRevertPoint);

  //        }else{

  //         console.log("When player index array length 1 and room.game.status not forcefinishfolded: ", sumOfBet);

  //         game.gameRevertPoint.push({
  //           playerID : allInPlayersSidePot[j].id,
  //           amount : + parseFloat(sumOfBet).toFixed(4),
  //           playerIndex : allInPlayersSidePot[j].index,
  //           forcefinishfolded : false,
  //         });

  //         console.log("When player index array length 1 and room.game.status not forcefinishfolded after: ", game.gameRevertPoint);

  //        }

  //       } else {
  //         // Save All in Player Side Pot in Single Variable
  //         let isNotAvilabel = true;
  //         for(let h=0;h < game.gamePot.length; h++){
  //           if(game.gamePot[h].sidePotPlayerID == allInPlayersSidePot[j].id){
  //            /* game.gamePot[h] = {
  //                 playerIds : playerIds,
  //                 playerIndex : playerIndex,
  //                 sidePotPlayerID : allInPlayersSidePot[j].id,
  //                 sidePotPlayerSeatIndex : allInPlayersSidePot[j].seatIndex,
  //                 sidePotAmount : sumOfBet
  //               };*/
  //               game.gamePot[h].playerIds = playerIds;
  //               game.gamePot[h].playerIndex = playerIndex;
  //             isNotAvilabel = false;
  //           }
  //         }

  //         console.log(" sumOfBet before gamePot add: ", parseFloat( sumOfBet ).toFixed(4));

  //         if(isNotAvilabel && sumOfBet > 0){
  //           game.gamePot.push({
  //             playerIds : playerIds,
  //             playerIndex : playerIndex,
  //             sidePotPlayerID : allInPlayersSidePot[j].id,
  //             sidePotPlayerSeatIndex : allInPlayersSidePot[j].seatIndex,
  //             sidePotAmount : parseFloat( sumOfBet ).toFixed(4)
  //           });

  //           console.log("game.gamePot after push into array: ", game.gamePot);

  //         }
  //       }
  //       allInValue = allInPlayersSidePot[j].bet;
  //       room.players[allInPlayersSidePot[j].index].isSidepot = true; // When Player side Pot is Calculate then we set variable true.
  //      // console.log("game.gamePot",game.gamePot);
  //     }

  //     for (let i = 0; i < game.roundBets.length; i++) {
  //       if (game.roundBets[i] >= allInValue) {
  //         gameMainPot += game.roundBets[i] - (allInValue);
  //       }
  //     }
  //   } 
  //   else {
  //     // Save All Bet Amount in Main Port
  //     for (let i = 0; i < game.roundBets.length; i++) {
  //       gameMainPot += game.roundBets[i];
  //     }
  //   }

  //   gameMainPot += mainPortAddMore;  // RefundCoin Add in Main Port
  //   console.log("------------------------------------------------");
  //   game.gameMainPot = + parseFloat( gameMainPot ).toFixed(4);
  //   console.log("gameMainPot :",game.gameMainPot, room.game.gameNumber);
  //   console.log("Game POT :",game.gamePot, room.game.gameNumber);
  //   console.log("Game REvert Point :",game.gameRevertPoint, room.game.gameNumber);
  //   console.log("------------------------------------------------");
  //   return game.gamePot;
  // }

  // async getSidePotAmount(room) {

  //   console.log('<=> Save Side Pot Data ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || Room Round Name : ', room.game.roundName);

  //   let players = room.players;
  //   let game = room.game;
  //   let pot = [];
  //   let sidepPot = {};
  //   // let gamePot = [];
  //   let allInPlayers = [];
  //   let allInPlayersSidePot = [];
  //   let playerIndex = [];
  //   let playerIds = [];

  //   let gameMainPot = 0;
  //   let mainPortAddMore = 0;

  //   let extraAmount = 0; // Lefted / Folded Player Amount

  //   let allFoldedPlayers = [];
  //   if (game.tempSidepot.length > 0) {
  //     allFoldedPlayers = game.tempSidepot[game.tempSidepot.length - 1].foldedPlayerIds.allFoldedPlayers;
  //   }
  //   console.log("allFoldedPlayers statrting", allFoldedPlayers)

  //   for (let i = 0; i < room.players.length; i++) {
  //     if (room.players[i].allIn == true && room.players[i].status === 'Playing') {
  //       console.log("Push All in Player  :", room.players[i].playerName, room.game.gameNumber);
  //       allInPlayers.push(i);
  //       allInPlayersSidePot.push({ id: room.players[i].id, bet: game.roundBets[i], seatIndex: room.players[i].seatIndex, index: i });
  //     }

  //     // add tempSidepot
  //     console.log("tempSidepot:", game.tempSidepot);
  //     if (game.tempSidepot.length > 0) {
  //       console.log("temp sidepot array", game.tempSidepot[game.tempSidepot.length - 1].foldedPlayerIds.allFoldedPlayers)
  //       if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) && game.roundBets[i] != undefined && game.roundBets[i] != null && game.tempSidepot[game.tempSidepot.length - 1].foldedPlayerIds.allFoldedPlayers.indexOf(room.players[i].id) == -1) {
  //         room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;

  //         let sumOfCountedValueInSidepot = 0;
  //         for (let tp = 0; tp < game.tempSidepot.length; tp++) {
  //           if (game.tempSidepot[tp].playerIds.indexOf(room.players[i].id) != -1) {
  //             sumOfCountedValueInSidepot += game.tempSidepot[tp].sidepotPlayerBet;
  //           }
  //         }
  //         console.log("Extrat amont before adding : ", sumOfCountedValueInSidepot, room.game.gameNumber);
  //         let remainingExtraValue = game.roundBets[i] - sumOfCountedValueInSidepot
  //         //extraAmount += game.roundBets[i];

  //         console.log("Extrat amont Of Player : ", room.players[i].playerName, room.game.gameNumber);
  //         console.log("Extrat amont  : ", game.roundBets[i], remainingExtraValue, room.game.gameNumber);

  //         extraAmount += remainingExtraValue;
  //         console.log("Extrat amont before adding : ", extraAmount, room.game.gameNumber);
  //         allFoldedPlayers.push(room.players[i].id);
  //       }
  //     } else {
  //       if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) && game.roundBets[i] != undefined && game.roundBets[i] != null) {
  //         room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;
  //         console.log("Extrat amont Of Player : ", room.players[i].playerName, room.game.gameNumber);
  //         console.log("Extrat amont  : ", game.roundBets[i], room.game.gameNumber);
  //         extraAmount += game.roundBets[i];
  //         allFoldedPlayers.push(room.players[i].id);
  //       }
  //     }
  //   }

  //   console.log("allFoldedPlayer", allFoldedPlayers);

  //   if (allInPlayers.length > 0) {

  //     // Just sort By Bet Amount
  //     allInPlayersSidePot.sort(function (a, b) {
  //       return a.bet - b.bet;
  //     });

  //     console.log("Game Round Bets : ", game.roundBets, room.game.gameNumber);
  //     console.log("allInPlayers : ", allInPlayers, room.game.gameNumber);
  //     console.log("allInPlayersSidePot : ", allInPlayersSidePot, room.game.gameNumber);

  //     let allInValue = 0;
  //     let tempSidepot = [];
  //     for (let j = 0; j < allInPlayersSidePot.length; j++) {
  //       let sumOfBet = 0;
  //       let particularPlayerBetInSidepot = 0;
  //       for (let i = 0; i < game.roundBets.length; i++) {
  //         if (game.roundBets[i] >= allInPlayersSidePot[j].bet) {
  //           sumOfBet += allInPlayersSidePot[j].bet - allInValue;
  //           particularPlayerBetInSidepot = (allInPlayersSidePot[j].bet - allInValue);
  //         }
  //       }
  //       console.log("particular player bet in sidepot", particularPlayerBetInSidepot)

  //       playerIndex = [];
  //       playerIds = [];
  //       for (let i = 0; i < room.players.length; i++) {
  //         console.log("------------------------------");
  //         console.log("Add Player Chips Name ->", room.players[i].playerName, room.game.gameNumber)
  //         console.log("room.players[i].isSidepot ->", room.players[i].isSidepot, room.game.gameNumber);
  //         if (room.players[i].isSidepot == false && room.players[i].status === 'Playing' && room.players[i].folded == false) { // chekc Already Side Pot not Calculate.
  //           playerIndex.push(i); // Add Aligible Player indexses for this Side pot.
  //           playerIds.push(room.players[i].id);
  //         }
  //       }

  //       // add tempSidepot
  //       if (game.tempSidepot.length > 0) {
  //         if (j == game.tempSidepot.length) {
  //           console.log("sumOfBet in tempsidepot");
  //           console.log("sumOfBet ->", sumOfBet, room.game.gameNumber);
  //           console.log("Final  extraAmount ->", extraAmount, room.game.gameNumber);
  //           sumOfBet += extraAmount;
  //           extraAmount = 0; // After Assign value to Side Por Set Value 0

  //           console.log("New sumOfBet ->", sumOfBet, room.game.gameNumber);
  //           console.log("playerIndex ->", playerIndex, room.game.gameNumber);
  //         }
  //       } else {
  //         console.log("sumOfBet in tempsidepot else");
  //         console.log("sumOfBet ->", sumOfBet, room.game.gameNumber);
  //         console.log("Final  extraAmount ->", extraAmount, room.game.gameNumber);
  //         sumOfBet += extraAmount;
  //         extraAmount = 0; // After Assign value to Side Por Set Value 0

  //         console.log("New sumOfBet ->", sumOfBet, room.game.gameNumber);
  //         console.log("playerIndex ->", playerIndex, room.game.gameNumber);
  //       }





  //       if (playerIndex.length == 1) { // When Side Pot Palyer is Single One Then We not Add This Amount in side Pot. Just Add this Amount in Main Port
  //         // Add GameRevertPoint to Players Chips 
  //         // mainPortAddMore += sumOfBet;

  //         console.log("When player index array length 1 sumOfBet: ", sumOfBet);

  //         if (room.game.status == 'ForceFinishedFolded') {

  //           console.log("When player index array length 1 and room.game.status forcefinishfolded: ", sumOfBet);

  //           game.gameRevertPoint.push({
  //             playerID: allInPlayersSidePot[j].id,
  //             amount: + parseFloat(sumOfBet).toFixed(4),
  //             playerIndex: allInPlayersSidePot[j].index,
  //             forcefinishfolded: true,
  //           });

  //           console.log("When player index array length 1 and room.game.status forcefinishfolded: after", game.gameRevertPoint);

  //         } else {

  //           console.log("When player index array length 1 and room.game.status not forcefinishfolded: ", sumOfBet);

  //           game.gameRevertPoint.push({
  //             playerID: allInPlayersSidePot[j].id,
  //             amount: + parseFloat(sumOfBet).toFixed(4),
  //             playerIndex: allInPlayersSidePot[j].index,
  //             forcefinishfolded: false,
  //           });

  //           console.log("When player index array length 1 and room.game.status not forcefinishfolded after: ", game.gameRevertPoint);

  //         }

  //       } else {
  //         // Save All in Player Side Pot in Single Variable
  //         let isNotAvilabel = true;
  //         for (let h = 0; h < game.gamePot.length; h++) {
  //           if (game.gamePot[h].sidePotPlayerID == allInPlayersSidePot[j].id) {
  //             /* game.gamePot[h] = {
  //                  playerIds : playerIds,
  //                  playerIndex : playerIndex,
  //                  sidePotPlayerID : allInPlayersSidePot[j].id,
  //                  sidePotPlayerSeatIndex : allInPlayersSidePot[j].seatIndex,
  //                  sidePotAmount : sumOfBet
  //                };*/
  //             game.gamePot[h].playerIds = playerIds;
  //             game.gamePot[h].playerIndex = playerIndex;
  //             isNotAvilabel = false;
  //           }
  //         }

  //         console.log(" sumOfBet before gamePot add: ", parseFloat(sumOfBet).toFixed(4));

  //         if (isNotAvilabel && sumOfBet > 0) {
  //           game.gamePot.push({
  //             playerIds: playerIds,
  //             playerIndex: playerIndex,
  //             sidePotPlayerID: allInPlayersSidePot[j].id,
  //             sidePotPlayerSeatIndex: allInPlayersSidePot[j].seatIndex,
  //             sidePotAmount: parseFloat(sumOfBet).toFixed(4)
  //           });

  //           // add tempSidepot
  //           /*let foldedPlayersInCurrentSidepot = allFoldedPlayers;
  //           console.log("foldedPlayersInCurrentSidepot before", foldedPlayersInCurrentSidepot, game.tempSidepot);
  //           if(game.tempSidepot.length > 0){
  //             let sidepotFoldedPlayers = game.tempSidepot[j].allFoldedPlayers;
  //             foldedPlayersInCurrentSidepot = allFoldedPlayers.filter(x => !sidepotFoldedPlayers.includes(x));
  //           }*/

  //           //console.log("foldedPlayersInCurrentSidepot", foldedPlayersInCurrentSidepot)
  //           console.log("allFoldedPlayer", allFoldedPlayers)

  //           tempSidepot.push({
  //             playerIds: playerIds,
  //             playerIndex: playerIndex,
  //             sidePotPlayerID: allInPlayersSidePot[j].id,
  //             sidePotPlayerSeatIndex: allInPlayersSidePot[j].seatIndex,
  //             sidePotAmount: parseFloat(sumOfBet).toFixed(4),
  //             sidepotPlayerBet: parseFloat(particularPlayerBetInSidepot),
  //             foldedPlayerIds: { allFoldedPlayers: allFoldedPlayers },
  //           });

  //           console.log("game.gamePot after push into array: ", game.gamePot);

  //         }
  //       }
  //       allInValue = allInPlayersSidePot[j].bet;
  //       room.players[allInPlayersSidePot[j].index].isSidepot = true; // When Player side Pot is Calculate then we set variable true.
  //       // console.log("game.gamePot",game.gamePot);
  //     }

  //     for (let t = 0; t < tempSidepot.length; t++) {
  //       game.tempSidepot.push(tempSidepot[t]);
  //     }

  //     console.log("tempsidepot after adding", game.tempSidepot)

  //     for (let i = 0; i < game.roundBets.length; i++) {
  //       if (game.roundBets[i] >= allInValue) {
  //         gameMainPot += game.roundBets[i] - (allInValue);
  //       }
  //     }
  //   }
  //   else {
  //     // Save All Bet Amount in Main Port
  //     for (let i = 0; i < game.roundBets.length; i++) {
  //       gameMainPot += game.roundBets[i];
  //     }
  //   }

  //   gameMainPot += mainPortAddMore;  // RefundCoin Add in Main Port
  //   console.log("------------------------------------------------");
  //   game.gameMainPot = + parseFloat(gameMainPot).toFixed(4);
  //   console.log("gameMainPot :", game.gameMainPot, room.game.gameNumber);
  //   console.log("Game POT :", game.gamePot, room.game.gameNumber);
  //   console.log("Game REvert Point :", game.gameRevertPoint, room.game.gameNumber);
  //   console.log("------------------------------------------------");
  //   return game.gamePot;
  // }

  //18-12-1019 - fold player issue
  async getSidePotAmount(room) {

    console.log('<=> Save Side Pot Data ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || Room Round Name : ', room.game.roundName);

    let players = room.players;
    let game = room.game;
    let pot = [];
    let sidepPot = {};
    // let gamePot = [];
    let allInPlayers = [];
    let allInPlayersSidePot = [];
    let playerIndex = [];
    let playerIds = [];

    let gameMainPot = 0;
    let mainPortAddMore = 0;

    let extraAmount = 0; // Lefted / Folded Player Amount

    let allFoldedPlayers = [];
    if (game.tempSidepot.length > 0) {
      allFoldedPlayers = game.tempSidepot[game.tempSidepot.length - 1].foldedPlayerIds.allFoldedPlayers;
    }
    console.log("allFoldedPlayers statrting", allFoldedPlayers)

    for (let i = 0; i < room.players.length; i++) {
      if (room.players[i].allIn == true && room.players[i].status === 'Playing') {
        console.log("Push All in Player  :", room.players[i].playerName, room.game.gameNumber);
        allInPlayers.push(i);
        allInPlayersSidePot.push({ id: room.players[i].id, bet: game.roundBets[i], seatIndex: room.players[i].seatIndex, index: i });
      }

      // add tempSidepot
      /*console.log("tempSidepot:", game.tempSidepot);
      if (game.tempSidepot.length > 0) {
        console.log("temp sidepot array", game.tempSidepot[game.tempSidepot.length - 1].foldedPlayerIds.allFoldedPlayers)
        if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) && game.roundBets[i] != undefined && game.roundBets[i] != null && game.tempSidepot[game.tempSidepot.length - 1].foldedPlayerIds.allFoldedPlayers.indexOf(room.players[i].id) == -1) {
          room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;

          let sumOfCountedValueInSidepot = 0;
          for (let tp = 0; tp < game.tempSidepot.length; tp++) {
            if (game.tempSidepot[tp].playerIds.indexOf(room.players[i].id) != -1) {
              sumOfCountedValueInSidepot += game.tempSidepot[tp].sidepotPlayerBet;
            }
          }
          console.log("Extrat amont before adding : ", sumOfCountedValueInSidepot, room.game.gameNumber);
          let remainingExtraValue = game.roundBets[i] - sumOfCountedValueInSidepot
          //extraAmount += game.roundBets[i];

          console.log("Extrat amont Of Player : ", room.players[i].playerName, room.game.gameNumber);
          console.log("Extrat amont  : ", game.roundBets[i], remainingExtraValue, room.game.gameNumber);

          extraAmount += remainingExtraValue;
          console.log("Extrat amont before adding : ", extraAmount, room.game.gameNumber);
          allFoldedPlayers.push(room.players[i].id);
        }
      } else {
        if (room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) && game.roundBets[i] != undefined && game.roundBets[i] != null) {
          room.players[i].isSidepot = true; // Folded / Left Player Amount Save into Main Port;
          console.log("Extrat amont Of Player : ", room.players[i].playerName, room.game.gameNumber);
          console.log("Extrat amont  : ", game.roundBets[i], room.game.gameNumber);
          extraAmount += game.roundBets[i];
          allFoldedPlayers.push(room.players[i].id);
        }
      }*/
    }

    console.log("allFoldedPlayer", allFoldedPlayers);

    if (allInPlayers.length > 0) {

      // Just sort By Bet Amount
      allInPlayersSidePot.sort(function (a, b) {
        return a.bet - b.bet;
      });

      console.log("Game Round Bets : ", game.roundBets, room.game.gameNumber);
      console.log("allInPlayers : ", allInPlayers, room.game.gameNumber);
      console.log("allInPlayersSidePot : ", allInPlayersSidePot, room.game.gameNumber);

      let allInValue = 0;
      let tempSidepot = [];

      for (let i = 0; i < game.roundBets.length; i++) {
        if( (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) ){
          room.players[i].foldedPlayerRemainingCount = game.roundBets[i];
        }
      }

      for (let j = 0; j < allInPlayersSidePot.length; j++) {
        let sumOfBet = 0;
        let particularPlayerBetInSidepot = 0;
        for (let i = 0; i < game.roundBets.length; i++) {
          if (game.roundBets[i] >= allInPlayersSidePot[j].bet) {
            sumOfBet += allInPlayersSidePot[j].bet - allInValue;
            particularPlayerBetInSidepot = (allInPlayersSidePot[j].bet - allInValue);

            if( room.players[i].isSidepot == false && (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) ){
              room.players[i].foldedPlayerRemainingCount = room.players[i].foldedPlayerRemainingCount - (allInPlayersSidePot[j].bet - allInValue);
            }

          }else{
            if(room.players[i].isSidepot == false && room.players[i].foldedPlayerRemainingCount > 0 && (room.players[i].folded == true || room.players[i].status === 'Left' || room.players[i].considerLeftedPlayer == true) ){
              sumOfBet += room.players[i].foldedPlayerRemainingCount;
              room.players[i].foldedPlayerRemainingCount = 0;
              room.players[i].isSidepot = true;
            }
          }
        }
        console.log("particular player bet in sidepot", particularPlayerBetInSidepot)

        playerIndex = [];
        playerIds = [];
        for (let i = 0; i < room.players.length; i++) {
          console.log("------------------------------");
          console.log("Add Player Chips Name ->", room.players[i].playerName, room.game.gameNumber)
          console.log("room.players[i].isSidepot ->", room.players[i].isSidepot, room.game.gameNumber);
          if (room.players[i].isSidepot == false && room.players[i].status === 'Playing' && room.players[i].folded == false) { // chekc Already Side Pot not Calculate.
            playerIndex.push(i); // Add Aligible Player indexses for this Side pot.
            playerIds.push(room.players[i].id);
          }
        }

        // add tempSidepot
        /*if (game.tempSidepot.length > 0) {
          if (j == game.tempSidepot.length) {
            console.log("sumOfBet in tempsidepot");
            console.log("sumOfBet ->", sumOfBet, room.game.gameNumber);
            console.log("Final  extraAmount ->", extraAmount, room.game.gameNumber);
            sumOfBet += extraAmount;
            extraAmount = 0; // After Assign value to Side Por Set Value 0

            console.log("New sumOfBet ->", sumOfBet, room.game.gameNumber);
            console.log("playerIndex ->", playerIndex, room.game.gameNumber);
          }
        } else {
          console.log("sumOfBet in tempsidepot else");
          console.log("sumOfBet ->", sumOfBet, room.game.gameNumber);
          console.log("Final  extraAmount ->", extraAmount, room.game.gameNumber);
          sumOfBet += extraAmount;
          extraAmount = 0; // After Assign value to Side Por Set Value 0

          console.log("New sumOfBet ->", sumOfBet, room.game.gameNumber);
          console.log("playerIndex ->", playerIndex, room.game.gameNumber);
        }*/





        if (playerIndex.length == 1) { // When Side Pot Palyer is Single One Then We not Add This Amount in side Pot. Just Add this Amount in Main Port
          // Add GameRevertPoint to Players Chips 
          // mainPortAddMore += sumOfBet;

          console.log("When player index array length 1 sumOfBet: ", sumOfBet);

          if (room.game.status == 'ForceFinishedFolded') {

            console.log("When player index array length 1 and room.game.status forcefinishfolded: ", sumOfBet);

            game.gameRevertPoint.push({
              playerID: allInPlayersSidePot[j].id,
              amount: + parseFloat(sumOfBet).toFixed(4),
              playerIndex: allInPlayersSidePot[j].index,
              forcefinishfolded: true,
            });

            console.log("When player index array length 1 and room.game.status forcefinishfolded: after", game.gameRevertPoint);

          } else {

            console.log("When player index array length 1 and room.game.status not forcefinishfolded: ", sumOfBet);

            game.gameRevertPoint.push({
              playerID: allInPlayersSidePot[j].id,
              amount: + parseFloat(sumOfBet).toFixed(4),
              playerIndex: allInPlayersSidePot[j].index,
              forcefinishfolded: false,
            });

            console.log("When player index array length 1 and room.game.status not forcefinishfolded after: ", game.gameRevertPoint);

          }

        } else {
          // Save All in Player Side Pot in Single Variable
          let isNotAvilabel = true;
          for (let h = 0; h < game.gamePot.length; h++) {
            if (game.gamePot[h].sidePotPlayerID == allInPlayersSidePot[j].id) {
              /* game.gamePot[h] = {
                   playerIds : playerIds,
                   playerIndex : playerIndex,
                   sidePotPlayerID : allInPlayersSidePot[j].id,
                   sidePotPlayerSeatIndex : allInPlayersSidePot[j].seatIndex,
                   sidePotAmount : sumOfBet
                 };*/
              game.gamePot[h].playerIds = playerIds;
              game.gamePot[h].playerIndex = playerIndex;
              isNotAvilabel = false;
            }
          }

          console.log(" sumOfBet before gamePot add: ", parseFloat(sumOfBet).toFixed(4));

          if (isNotAvilabel && sumOfBet > 0) {
            game.gamePot.push({
              playerIds: playerIds,
              playerIndex: playerIndex,
              sidePotPlayerID: allInPlayersSidePot[j].id,
              sidePotPlayerSeatIndex: allInPlayersSidePot[j].seatIndex,
              sidePotAmount: parseFloat(sumOfBet).toFixed(4)
            });

            // add tempSidepot
            /*let foldedPlayersInCurrentSidepot = allFoldedPlayers;
            console.log("foldedPlayersInCurrentSidepot before", foldedPlayersInCurrentSidepot, game.tempSidepot);
            if(game.tempSidepot.length > 0){
              let sidepotFoldedPlayers = game.tempSidepot[j].allFoldedPlayers;
              foldedPlayersInCurrentSidepot = allFoldedPlayers.filter(x => !sidepotFoldedPlayers.includes(x));
            }*/

            //console.log("foldedPlayersInCurrentSidepot", foldedPlayersInCurrentSidepot)
            console.log("allFoldedPlayer", allFoldedPlayers)

            tempSidepot.push({
              playerIds: playerIds,
              playerIndex: playerIndex,
              sidePotPlayerID: allInPlayersSidePot[j].id,
              sidePotPlayerSeatIndex: allInPlayersSidePot[j].seatIndex,
              sidePotAmount: parseFloat(sumOfBet).toFixed(4),
              sidepotPlayerBet: parseFloat(particularPlayerBetInSidepot),
              foldedPlayerIds: { allFoldedPlayers: allFoldedPlayers },
            });

            console.log("game.gamePot after push into array: ", game.gamePot);

          }
        }
        allInValue = allInPlayersSidePot[j].bet;
        room.players[allInPlayersSidePot[j].index].isSidepot = true; // When Player side Pot is Calculate then we set variable true.
        // console.log("game.gamePot",game.gamePot);
      }

      for (let t = 0; t < tempSidepot.length; t++) {
        game.tempSidepot.push(tempSidepot[t]);
      }

      console.log("tempsidepot after adding", game.tempSidepot)

      for (let i = 0; i < game.roundBets.length; i++) {
        if (game.roundBets[i] >= allInValue) {
          gameMainPot += game.roundBets[i] - (allInValue);
        }
      }
    }
    else {
      // Save All Bet Amount in Main Port
      for (let i = 0; i < game.roundBets.length; i++) {
        gameMainPot += game.roundBets[i];
      }
    }

    gameMainPot += mainPortAddMore;  // RefundCoin Add in Main Port
    console.log("------------------------------------------------");
    game.gameMainPot = + parseFloat(gameMainPot).toFixed(4);
    console.log("gameMainPot :", game.gameMainPot, room.game.gameNumber);
    console.log("Game POT :", game.gamePot, room.game.gameNumber);
    console.log("Game REvert Point :", game.gameRevertPoint, room.game.gameNumber);
    console.log("------------------------------------------------");
    return game.gamePot;
  }

}


module.exports = Game
