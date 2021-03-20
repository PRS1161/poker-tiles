var Sys = require('../../../../Boot/Sys');

module.exports = {

  progress: async function (room) {
    try {
      let self = this
     
      if (room.game) {
       
        if (await self.checkForEndOfRound(room) === true || room.game.status == 'ForceFinishedFolded' || room.game.status == 'ForceFinishedAllIn') {
          console.log("change player turn", room.game.status, room.status);
          clearTimeout(Sys.Timers[room.id]);
          clearInterval(Sys.Timers[room.id]);
          await self.changePlayerTurn(room); // When Roud Finished Set Player Turn To Big Blind
          //Move all bets to the pot
          console.log("room status", room.game.status, room.game.gameNumber);
          console.log("room.game.bets", room.game.bets, room.game.gameNumber);
          for (i = 0; i < room.game.bets.length; i += 1) {
            room.game.pot += parseFloat(room.game.bets[i], 10);
            room.game.roundBets[i] += parseFloat(room.game.bets[i], 10);
          }
          room.game.pot = + parseFloat(room.game.pot).toFixed(2);
          console.log("************room.game.pot***********", room.game.pot, room.game.status, room.status);
          // Save Sidepot Data;
          let sidePot = await room.game.getSidePotAmount(room); // Save Data
          console.log('<=> Side Pot ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || Player SidePot : ', sidePot);
          console.log("room.game.roundName in progress", room.game.roundName);
          if (room.game.status == 'ForceFinishedAllIn') {
            console.log('----------ForceFinishedAllIn--------------------------', room.game.gameNumber, room.game.status, room.status);

            let turnBetData = room.getPreviousPlayerAction();
            await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerAction', {
              action: turnBetData,
              playerBuyIn: (turnBetData.playerId) ? parseFloat(room.getPlayerById(turnBetData.playerId).chips) : 0,
              roomId: room.id,
              totalTablePotAmount: room.game.pot,
            });

            Sys.Timers[room.id] = setTimeout(async function(room){
              /*Code to display all players cards when forcefinshallin*/
              let playersCards = [];
              for (let i = 0; i < room.players.length; i++) {
                // show cards to all players
                console.log("show all cards to all players")
                if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
                  if (room.players[i].muck == true) {
                    playersCards.push({
                      playerId: room.players[i].id,
                      cards: ['BC', 'BC']
                    });
                  } else {
                    room.players[i].isDisplayedCard = true;
                    playersCards.push({
                      playerId: room.players[i].id,
                      cards: room.players[i].cards
                    });
                  }
                }

              }
              await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('GameFinishedPlayersCards', { playersCards: playersCards, roomId: room.id });

              /*Code to display all players cards when forcefinshallin*/



              /** Start ::: Custom code for Side Pot Two Player (code is Petch) */
              let playersLength = 0;
              for (let i = 0; i < room.players.length; i += 1) {
                if (room.players[i].status != 'Ideal' && room.players[i].status != 'Left') {
                  playersLength += 1;
                }
              }
              console.log("::: SidePot Length :", sidePot.length)
              if (playersLength == 2 && sidePot.length > 0) {
                console.log("/************************************/")
                console.log("::: SidePot :", sidePot)
                console.log("::: sidePot[0].sidePotAmount  :", sidePot[0].sidePotAmount)
                console.log("::: room.game.gameMainPot :", room.game.gameMainPot)
                // room.game.gameMainPot = parseFloat(room.game.gameMainPot) + parseFloat(sidePot[0].sidePotAmount);
                // sidePot = [];
                console.log("::: SidePot :", sidePot)
  
                console.log("::: room.game.gameMainPot :", room.game.gameMainPot)
                console.log("/************************************/")
  
              }
              /** End ::: Custom code for Side Pot Two Player (code is Petch) */
  
              //await self.revertPoint(room);
              let dataObj = {};
                        
              switch (room.game.roundName) {
                case 'Preflop':
                  console.log(":: Preflop ALL IN ---------------", room.game.gameNumber, room.game.status, room.status);
                  room.game.deck.pop();
                  /*room.game.board.push('JC');
                  room.game.board.push('5D');
                  room.game.board.push('QD');
                  room.game.board.push('9C');
                  room.game.board.push('8D');*/
                  for (i = 0; i < 5; i += 1) { // shubh
                    room.game.board.push(room.game.deck.pop());
                  }
                 
                  await self.checkForWinner(room); // shubh
                  await self.revertPoint(room, false); // shubh
                  let tempBoardThree = []; // shubh
                  for (let i = 0; i < 3; i++) { // shubh
                    tempBoardThree.push(room.game.board[i]); // shubh
                  } // shubh
                  room.game.roundName = 'Flop';
                  Sys.Timers[room.id] = setTimeout(async function (room) {
                    let dataObj = {
                      roundStarted: room.game.roundName,
                      // cards: room.game.board, // shubh
                      cards: tempBoardThree, // shubh
                      potAmount: room.game.pot,
                    };
  
                    console.log("Preflop round complete room.game.gameMainPot: ", room.game.gameMainPot);
  
                    console.log('<=> Game Round Complete Broadcast ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || RoundComplete : ', dataObj);
                    
                    room.game.bets.splice(0, room.game.bets.length);
                    Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
                      roundStarted: room.game.roundName,
                      // cards: room.game.board, // shubh
                      extraCards: [],
                      cards: tempBoardThree, // shubh
                      potAmount: room.game.pot,
                      playerSidePot: {
                        sidePot: sidePot,
                        mainPot: +(room.game.gameMainPot).toFixed(2)
                      },
                      roomId: room.id,
                    })
                    // await self.revertPoint(room,false);
  
  
                    Sys.Timers[room.id] = setTimeout(function (room) {
                      // room.game.deck.pop(); // shubh
                      // room.game.board.push(room.game.deck.pop()); // shubh
                      let tempBoardFour = []; // shubh
                      for (let i = 0; i < 4; i++) { // shubh
                        tempBoardFour.push(room.game.board[i]); // shubh
                      } // shubh
                      room.game.roundName = 'Turn';
  
                      Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
                        roundStarted: room.game.roundName,
                        // cards: room.game.board, // shubh
                        extraCards: [],
                        cards: tempBoardFour, // shubh
                        potAmount: room.game.pot,
                        playerSidePot: {
                          sidePot: sidePot,
                          mainPot: +(room.game.gameMainPot).toFixed(2)
                        },
                        roomId: room.id,
                      });
                        Sys.Timers[room.id] = setTimeout(async function (room) {
                          // room.game.deck.pop(); // shubh
                          // room.game.board.push(room.game.deck.pop()); // shubh
                          room.game.roundName = 'Showdown';
                          /*room.game.otherData.tempBets = [...room.game.bets];
                          room.game.bets.splice(0, room.game.bets.length);*/
                          for (j = 0; j < room.players.length; j += 1) {
                            hand = new Sys.Game.CashGame.Texas.Entities.Hand(
                              room.players[j].cards,
                              room.game.board
                            )
                            //  room.players[j].hand = await self.rankHand(hand);
                          }
                          // await self.checkForWinner(room); // shubh
                          // await self.revertPoint(room,false); // shubh
                          //await self.checkForBankrupt(room);
                          room.currentPlayer = undefined;
                          room.game.status = 'Finished AllIn'
                          // depricated
                          // Event.fire("PokerGameFinished", room);
                          await Sys.Game.CashGame.Texas.Controllers.RoomProcess.gameFinished(room, sidePot)
    
                        }, 1000, room)
                      
                    }, 1500, room)
  
                  }, 1000, room)
                  break;
                case 'Flop':
                  console.log(":: Flop ALL IN ---------------", room.game.gameNumber, room.game.status, room.status);
                  // room.game.deck.pop();
                  // room.game.board.push(room.game.deck.pop());
                  for (let i = 0; i < 2; i++) {
                    room.game.board.push(room.game.deck.pop());
                  }
                 
                  /*room.game.board.push('9C');
                  room.game.board.push('8D');*/
                  await self.checkForWinner(room); // shubh
                  await self.revertPoint(room, false); // shubh
                  let tempBoardFour = []; // shubh
                  for (let i = 0; i < 4; i++) { // shubh
                    tempBoardFour.push(room.game.board[i]); // shubh
                  } // shubh
                  room.game.roundName = 'Turn';
                  Sys.Timers[room.id] = setTimeout(async function (room) {
                    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n");
                    console.log("tempBoardFour :", tempBoardFour, "\n");
                    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
  
                    console.log("Flop round complete room.game.gameMainPot: ", room.game.gameMainPot);
                    
                    room.game.bets.splice(0, room.game.bets.length);
                    Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
                      roundStarted: room.game.roundName,
                      // cards: room.game.board, // shubh
                      extraCards: [],
                      cards: tempBoardFour, // shubh
                      potAmount: room.game.pot,
                      playerSidePot: {
                        sidePot: sidePot,
                        mainPot: +(room.game.gameMainPot).toFixed(2)
                      },
                      roomId: room.id,
                    });
                     
                      Sys.Timers[room.id] = setTimeout(async function (room) {
                        // room.game.deck.pop(); // shubh
                        // room.game.board.push(room.game.deck.pop()); // shubh
                        room.game.roundName = 'Showdown';
                        /*room.game.otherData.tempBets = [...room.game.bets];
                        room.game.bets.splice(0, room.game.bets.length);*/
                        for (j = 0; j < room.players.length; j += 1) {
                          hand = new Sys.Game.CashGame.Texas.Entities.Hand(
                            room.players[j].cards,
                            room.game.board
                          );
                          //room.players[j].hand = await self.rankHand(hand);
                        }
                        // await self.checkForWinner(room); // shubh
                        // await self.revertPoint(room, false); // shubh
                        // await self.checkForBankrupt(room);
                        room.currentPlayer = undefined;
                        room.game.status = 'Finished AllIn'
                        await Sys.Game.CashGame.Texas.Controllers.RoomProcess.gameFinished(room, sidePot)
                      }, 1000, room) // shubh
                    
  
                  }, 1000, room)
                  break;
                case 'Turn':
                  console.log(":: Turn ALL IN ---------------", room.game.gameNumber);
                  room.game.deck.pop();
                  room.game.board.push(room.game.deck.pop());
                  //room.game.board.push('8D');
              
                  room.game.roundName = 'Showdown';
                  
                  room.game.bets.splice(0, room.game.bets.length);
                  for (j = 0; j < room.players.length; j += 1) {
                    hand = new Sys.Game.CashGame.Texas.Entities.Hand(
                      room.players[j].cards,
                      room.game.board
                    );
                    //room.players[j].hand = await self.rankHand(hand);
                  }
                  await self.checkForWinner(room);
                  await self.revertPoint(room, false);
                  // await self.checkForBankrupt(room);
                  room.currentPlayer = undefined;
                  room.game.status = 'Finished AllIn'
                  await Sys.Game.CashGame.Texas.Controllers.RoomProcess.gameFinished(room, sidePot)
                  break;
                default:
                  console.log(":: Default ALL IN ---------------", room.game.status, room.status);
                  room.game.roundName = 'Showdown';
                  
                  room.game.bets.splice(0, room.game.bets.length);
                  for (j = 0; j < room.players.length; j += 1) {
                    hand = new Sys.Game.CashGame.Texas.Entities.Hand(
                      room.players[j].cards,
                      room.game.board
                    )
                    // room.players[j].hand = await self.rankHand(hand);
                  }
                  await self.checkForWinner(room);
                  await self.revertPoint(room, false);
                  // await self.checkForBankrupt(room);
                  room.currentPlayer = undefined;
                  room.game.status = 'Finished AllIn'
                  await Sys.Game.CashGame.Texas.Controllers.RoomProcess.gameFinished(room, sidePot);
              }

            },waitForGame,room);
           
          } else if (room.game.roundName === 'River' || room.game.status == 'ForceFinishedFolded') {
            console.log('effective river ForceFinishedFolded', room.game.gameNumber, room.game.status, room.status);

            let turnBetData = room.getPreviousPlayerAction();
            await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerAction', {
              action: turnBetData,
              playerBuyIn: (turnBetData.playerId) ? parseFloat(room.getPlayerById(turnBetData.playerId).chips) : 0,
              roomId: room.id,
              totalTablePotAmount: room.game.pot,
              /*PlayerSidePot : {
                sidePot : sidePot,
                mainPot : room.game.pot
              }*/
            });

            /*if(room.game.status == 'ForceFinishedFolded'){
              console.log("lastplayer folded id", room.otherData.lastFoldedPlayerId)
              if(room.otherData.lastFoldedPlayerId){
                 Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('DisplayShowCardButton', { playerIdList : [room.otherData.lastFoldedPlayerId], gameId: room.game.id, roomId: room.id });
              }
            }*/

            console.log("river round complete sidePot: ", sidePot);
            console.log("river round complete room.game.gameMainPot: ", room.game.gameMainPot);
            console.log("river round complete room.game.pot: ", room.game.pot);

            room.game.roundName = 'Showdown';
            for (i = 0; i < room.game.bets.length; i += 1) {
              room.game.bets[i] = 0;
            }
            room.game.maxBetOnRaise = 0;
            room.game.stopReraise = false;
            room.game.isUnqualifiedRaise = false;

            console.log('<=> Game Finished Round Complete Broadcast in FORCEFINISHFOLDED ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || RoundComplete : ');

            await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
              roundStarted: room.game.roundName,
              cards: room.game.board,
              potAmount: room.game.pot,
              roomId: room.id,
              playerSidePot: {
                sidePot: sidePot,
                //mainPot : room.game.pot
                mainPot: +(room.game.gameMainPot).toFixed(2)
              }
            });
            await self.checkForWinner(room);
            Sys.Timers[room.id] = setTimeout(async function (room) {
              await self.revertPoint(room, true);
              room.currentPlayer = undefined;
              //room.game.status = 'Finished'

              await Sys.Game.CashGame.Texas.Controllers.RoomProcess.gameFinished(room, sidePot)
            }, 1000, room)
            //  await self.checkForBankrupt(room);
          } else if (room.game.roundName === 'Turn') {
            console.log('effective turn', room.game.gameNumber, room.game.status, room.status);
            room.game.roundName = 'River';
            room.game.deck.pop(); //Burn a card
            room.game.board.push(room.game.deck.pop()); //Turn a card
            //room.game.board.push('8D');
            for (i = 0; i < room.game.bets.length; i += 1) {
              room.game.bets[i] = 0;
            }
            for (i = 0; i < room.players.length; i += 1) {
              room.players[i].talked = false;
              room.players[i].isSidepot = false;
              room.players[i].roundRaisedAmount = 0;
            }
            room.game.maxBetOnRaise = 0;
            room.game.stopReraise = false;
            room.game.isUnqualifiedRaise = false;


            await Sys.Game.CashGame.Texas.Controllers.RoomProcess.roundFinished(room, sidePot)

          } else if (room.game.roundName === 'Flop') {
            console.log('effective flop', room.game.gameNumber, room.game.status, room.status);
            room.game.roundName = 'Turn';
            room.game.deck.pop(); //Burn a card
            room.game.board.push(room.game.deck.pop()); //Turn a card
            //room.game.board.push('9C');
            for (i = 0; i < room.game.bets.length; i += 1) {
              room.game.bets[i] = 0;
            }
            for (i = 0; i < room.players.length; i += 1) {
              room.players[i].talked = false;
              room.players[i].isSidepot = false;
              room.players[i].roundRaisedAmount = 0;
            }
            room.game.maxBetOnRaise = 0;
            room.game.stopReraise = false;
            room.game.isUnqualifiedRaise = false;


            console.log("round Finished");
            await Sys.Game.CashGame.Texas.Controllers.RoomProcess.roundFinished(room, sidePot)

          } else if (room.game.roundName === 'Preflop') {
            console.log('effective deal', room.game.gameNumber, room.game.status, room.status);
            room.game.roundName = 'Flop';
            room.game.deck.pop(); //Burn a card
            for (i = 0; i < 3; i += 1) { //Turn three cards
              room.game.board.push(room.game.deck.pop());
            }

            /* room.game.board.push('JC');
             room.game.board.push('5D');
             room.game.board.push('QD');*/

            for (i = 0; i < room.game.bets.length; i += 1) {
              room.game.bets[i] = 0;
            }
            for (i = 0; i < room.players.length; i += 1) {
              room.players[i].talked = false;
              room.players[i].isSidepot = false;
              room.players[i].roundRaisedAmount = 0;
            }
            room.game.maxBetOnRaise = 0;
            room.game.stopReraise = false;
            room.game.isUnqualifiedRaise = false;


            console.log("round Finished 2", room.game.status, room.status);
            await Sys.Game.CashGame.Texas.Controllers.RoomProcess.roundFinished(room, sidePot)
          }  else {
            console.log("showdown else condition in progress");
            await self.revertPoint(room, true);
            room.currentPlayer = undefined;
            await Sys.Game.CashGame.Texas.Controllers.RoomProcess.gameFinished(room, sidePot);
          }
        }
        else {
          console.log("room status turnFinished", room.game.status, room.status);
          await Sys.Game.CashGame.Texas.Controllers.RoomProcess.turnFinished(room);
        }
      }
    } catch (e) {
      console.log("Error: ", e);
    }

  },

  getMaxBet: async function (bets) {
    try {
      var maxBet, i;
      maxBet = 0;
      for (i = 0; i < bets.length; i += 1) {
        if (bets[i] > maxBet) {
          maxBet = bets[i];
        }
      }
      return maxBet;
    } catch (e) {
      console.log("Error: ", e);
    }
  },

  checkForEndOfRound: async function (room) {
    try {
      var maxBet, endOfRound, notFoldedPlayers, notAllInPlayers, currentTurn, maxbetPlayerIndex, notAllInPlayersIndex;
      endOfRound = true;
      maxBet = await this.getMaxBet(room.game.bets);
      notFoldedPlayers = 0;
      notAllInPlayers = 0;
      currentTurn = room.currentPlayer;

      console.log("----------------------------------------------------------");
      console.log('Current Player :', currentTurn, room.game.gameNumber);
      console.log("----------------------------------------------------------");


      //For each player, check
      for (let i = currentTurn; i < room.players.length; i += 1) {
        if (room.players[i].folded === false && room.players[i].status === 'Playing') {
          if (room.players[i].talked === false || room.game.bets[i] != maxBet) {
            if (room.players[i].allIn === false) {
              room.currentPlayer = i;
              endOfRound = false;
              break
            }
          }
        }
      }
      if (currentTurn == room.currentPlayer) {
        for (let i = 0; i < currentTurn; i++) {
          if (room.players[i].folded === false && room.players[i].status === 'Playing') {
            if (room.players[i].talked === false || room.game.bets[i] !== maxBet) {
              if (room.players[i].allIn === false) {
                room.currentPlayer = i;
                endOfRound = false;
                break
              }
            }
          }
        }
      }




      for (let i = 0; i < room.players.length; i += 1) {
        if (room.game.bets[i] == maxBet) { // Get Mabet Player Index
          maxbetPlayerIndex = i;
        }
        if (room.players[i].folded === false && room.players[i].status === 'Playing') {
          notFoldedPlayers += 1;
          if (room.players[i].allIn === false) {
            notAllInPlayers += 1;
            notAllInPlayersIndex = i; // When Single Player is Remain in not All in Then We use this variable. so do not confuse.
          }
        }
      }

      if (notFoldedPlayers == 1) {
        room.game.status = 'ForceFinishedFolded'
        return endOfRound;
      }

      if (notAllInPlayers == 1 && room.turnBet.action != Sys.Config.Texas.AllIn && room.game.bets[notAllInPlayersIndex] == maxBet) { // Shiv!@#
        room.game.status = 'ForceFinishedAllIn'
      }

      if (notAllInPlayers == 0) {
        room.game.status = 'ForceFinishedAllIn'
      }


      if (notAllInPlayers == 1 && room.turnBet.action == Sys.Config.Texas.AllIn) { // when All in Player Turn.
        let currenPlayerBet = room.game.bets[currentTurn];
        if (currenPlayerBet > maxBet) {
          endOfRound = true;
          room.game.status = 'ForceFinishedAllIn';
        }
      }

      if (notAllInPlayers == 1 && room.game.bets[notAllInPlayersIndex] == maxBet) { // When Single Player is Remain & Max Bet Player is not All in Palyer Then Finishe Game.
        endOfRound = true;
        room.game.status = 'ForceFinishedAllIn';
      }




      console.log("----------------------------------------------------------");
      console.log('Checking round', endOfRound, room.currentPlayer, room.game.status, room.status);
      console.log("----------------------------------------------------------");

      return endOfRound;
    } catch (e) {
      console.log("Error: ", e);
    }
  },

  changePlayerTurn: async function (room) {
    try {
      let oldTurn = room.currentPlayer;
      let playerFound = false;
      console.log("all players in room ", room.players)
      console.log("delaer index", room.dealerIndex)
      console.log("oldTurn", oldTurn);
      console.log("smallblent----", room.smallBlindIndex, room.players.length)
      let startingIndex = room.smallBlindIndex;
      if(room.smallBlindIndex == room.dealerIndex ){
        startingIndex = room.bigBlindIndex;
      }
      for (let i = startingIndex; i < room.players.length; i += 1) {
        console.log("room.players status in changeplayerChnage function", room.players[i].playerName, room.players[i].id, room.players[i].folded, room.players[i].allIn, room.players[i].status)
        if (room.players[i].folded === false && room.players[i].allIn === false && room.players[i].status === 'Playing') {
          room.currentPlayer = i;
          playerFound = true;
          break;
        }
      }
      console.log("decided current player", room.currentPlayer, playerFound)
      if (oldTurn == room.currentPlayer && playerFound == false) {
        console.log("yes iam in same turn so change my turn", room.game.status, room.status)
        for (let i = 0; i < room.smallBlindIndex; i += 1) {
          if (i != room.dealerIndex) {
            console.log("room.players status in changeplayerChnage function in samePlayerTurn", room.players[i].playerName, room.players[i].id, room.players[i].folded, room.players[i].allIn, room.players[i].status)
            if (room.players[i].folded === false && room.players[i].allIn === false && room.players[i].status === 'Playing') {
              room.currentPlayer = i;
              break;
            }
          }

        }
      }
      console.log("final current player", room.currentPlayer)
    } catch (e) {
      console.log("Error:", e);
    }
  },

  checkForAllInPlayer: async function (room, winners) {
    try {
      console.log("checkForAllInPlayer Called");
      var i, allInPlayer;
      allInPlayer = [];
      for (i = 0; i < winners.length; i += 1) {
        if (room.players[winners[i]].allIn === true) {
          allInPlayer.push(winners[i]);
        }
      }
      return allInPlayer;
    } catch (e) {
      console.log("Error: ", e);
    }
  },

  checkForWinner: async function (room) {
    try {
      clearTimeout(Sys.Timers[room.id]);  // multiple timer issue
      clearInterval(Sys.Timers[room.id]);
            
      console.log('<=> Game Check For Winner || Texas GAME-NUMBER [' + room.game.gameNumber + '] ');
           
        for (let rp = 0; rp < room.players.length; rp++) {
          var playerRoundBets = room.game.roundBets[rp];
          var playerData = room.players[rp];
  
          if(playerData.status == "Playing"){
            
            let transactionData = {
              user_id           : playerData.id,
              username          : playerData.playerName,
              gameId            : room.game.id,
              gameNumber        : room.game.gameNumber,
              chips             : playerRoundBets,
              afterBalance      : playerData.chips,
              category          : 'debit',
              type              : 'totalbet',
              remark            : 'Player Bets Amount'
            }
           // await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);
          }
  
        }
  
        for (let h = 0; h < room.game.gamePot.length; h += 1) {
  
          let playerIndexes = room.game.gamePot[h].playerIndex;
          console.log("Side POT playerIndexes", playerIndexes);
          let SidePotPlayerIndex = [];
          let PokerWinnnerHands = [];
          for (let r = 0; r < playerIndexes.length; r++) {
            let hand = Sys.Poker.solve(room.game.board.concat(room.players[playerIndexes[r]].cards));
            SidePotPlayerIndex.push({
              index: playerIndexes[r],
              hand: hand
            })
            PokerWinnnerHands.push(hand);
          }
  
          let PokerWinnerResult = Sys.Poker.winners(PokerWinnnerHands);
          console.log("No Of Winners :", PokerWinnerResult.length);
  
          let winplr, winAmount, winAmountPart, winTotalAmount;
          winTotalAmount = parseFloat(room.game.gamePot[h].sidePotAmount);
          winAmountPart = eval(parseFloat(parseFloat(room.game.gamePot[h].sidePotAmount) / parseFloat(PokerWinnerResult.length)).toFixed(4));
          console.log("Win-Total-Amount check for fixed length", winTotalAmount)
          // Save winner
  
  
          for (let s = 0; s < PokerWinnerResult.length; s++) {
            console.log("tempWinner.length", PokerWinnerResult.length)
            if (s == PokerWinnerResult.length - 1) {
              winAmount = winTotalAmount;
            } else {
              winAmount = winAmountPart;
            }
            winTotalAmount = winTotalAmount - winAmountPart;
  
            if (PokerWinnerResult.length == PokerWinnnerHands.length) {
              console.log("ALL Sidepot Player Winners");
              winplr = room.players[SidePotPlayerIndex[s].index];
              winplr.hand = SidePotPlayerIndex[s].hand;
              let bestCards = [];
              for (let f = 0; f < PokerWinnerResult[s].cards.length; f++) {
                if(f < 5){
                  console.log("card length", PokerWinnerResult[s].cards.length, PokerWinnerResult[s].cards[f])
                  if(PokerWinnerResult[s].cards[f].value == '1'){ // If got '1' instead of 'A' 
                    PokerWinnerResult[s].cards[f].value = 'A';
                  }
                  bestCards.push(
                    PokerWinnerResult[s].cards[f].value + PokerWinnerResult[s].cards[f].suit.toUpperCase()
                  );
                }
              }
              if(winplr.hand.name == 'Straight Flush' && winplr.hand.rank == 9){
                if(winplr.hand.descr == 'Royal Flush'){
                  winplr.hand.name = winplr.hand.descr;
                  winplr.hand.rank = parseInt(winplr.hand.rank + 1);
                }
              }
              console.log("BestCards 1->", bestCards)
              winplr.hand.bestCards = bestCards;
            } else {
              //for(let i=0; i< PokerWinnerResult.length; i++){
              for (let k = 0; k < SidePotPlayerIndex.length; k++) {
                if (JSON.stringify(SidePotPlayerIndex[k].hand.cards) == JSON.stringify(PokerWinnerResult[s].cards)) {
                  console.log("POKER WINNER :", SidePotPlayerIndex[k].index);
                  winplr = room.players[SidePotPlayerIndex[k].index];
                  winplr.hand = SidePotPlayerIndex[k].hand;
                  let bestCards = [];
                  for (let f = 0; f < PokerWinnerResult[s].cards.length; f++) {
                    if(f < 5){
                      console.log("card length", PokerWinnerResult[s].cards.length, PokerWinnerResult[s].cards[f])
                      if(PokerWinnerResult[s].cards[f].value == '1'){ // If got '1' instead of 'A' 
                        PokerWinnerResult[s].cards[f].value = 'A';
                      }
                      bestCards.push(
                        PokerWinnerResult[s].cards[f].value + PokerWinnerResult[s].cards[f].suit.toUpperCase()
                      );
                    }
                  }
                  if(winplr.hand.name == 'Straight Flush' && winplr.hand.rank == 9){
                    if(winplr.hand.descr == 'Royal Flush'){
                      winplr.hand.name = winplr.hand.descr;
                      winplr.hand.rank = parseInt(winplr.hand.rank + 1);
                    }
                  }
                  console.log("BestCards 2->", bestCards)
                  winplr.hand.bestCards = bestCards;
                }
              }
              // }
            }
            winplr.chips += parseFloat(winAmount);
            let sidePotPlayerSeatIndex = room.game.gamePot[h].sidePotPlayerSeatIndex
  
            /** Start ::: Custom code for Side Pot Two Player (code is Petch) */
            let playersLength = 0;
            for (let i = 0; i < room.players.length; i += 1) {
              if (room.players[i].status != 'Ideal' && room.players[i].status != 'Left') {
                playersLength += 1;
              }
            }
            console.log("################################### ::: SidePot Length :", playersLength)
            /* if(playersLength == 2 ){
               sidePotPlayerSeatIndex = -1;
             }*/
            /** End ::: Custom code for Side Pot Two Player (code is Petch) */
  
            room.gameWinners.push({
              playerId: winplr.id,
              playerName: winplr.playerName,
              amount: +parseFloat(winAmount).toFixed(2),
              hand: winplr.cards,
              bestCards: winplr.hand.bestCards,
              winningType: winplr.hand.name,
              uniqId:winplr.uniqId,
              rank: winplr.hand.rank,
              chips: parseFloat(winplr.chips),
              winnerSeatIndex: winplr.seatIndex,
              sidePotPlayerIndex: sidePotPlayerSeatIndex,
              sidePotPlayerId: room.game.gamePot[h].sidePotPlayerID, // Add for Testing
              rackAmount: 0
            });
          }
        }
  
        console.log(" room.game.gameMainPot :", room.game.gameMainPot);
        // Check Main Port Winner
        if (room.game.gameMainPot > 0) {
          // let minPotWinner = [];
          let lastPlayerCount = 0;
          let checkWinerPlayerIndex = [];
          let winnerHands = [];
          for (let k = 0; k < room.players.length; k += 1) {
            if (room.players[k].folded === false && room.players[k].allIn === false && room.players[k].status === 'Playing') {
              lastPlayerCount++;
            }
            if (room.players[k].folded === false && room.players[k].allIn === false && room.players[k].status === 'Playing') {
              let hand = Sys.Poker.solve(room.game.board.concat(room.players[k].cards));
              checkWinerPlayerIndex.push({
                index: k,
                hand: hand,
              })
              winnerHands.push(hand);
            }
          }
  
          let PokerWinnerResult = Sys.Poker.winners(winnerHands);
          console.log("No Of Winners :", PokerWinnerResult.length);
          winTotalAmount = + parseFloat(room.game.gameMainPot).toFixed(4);
          winAmountPart = + parseFloat(parseFloat(room.game.gameMainPot) / parseFloat(PokerWinnerResult.length)).toFixed(4);
          console.log("check for fixed float value", winAmountPart)
          console.log('Main Pot Winner : ', PokerWinnerResult.length);
          console.log('lastPlayerCount : ', lastPlayerCount);
  
          if (PokerWinnerResult.length == 1 && lastPlayerCount == 1) {
  
            let index = 0;
            for (let i = 0; i < PokerWinnerResult.length; i++) {
              for (let k = 0; k < checkWinerPlayerIndex.length; k++) {
                if (JSON.stringify(checkWinerPlayerIndex[k].hand.cards) == JSON.stringify(PokerWinnerResult[i].cards)) {
                  console.log("POKER WINNER :", checkWinerPlayerIndex[k].index);
                  winplr = room.players[checkWinerPlayerIndex[k].index];
                  winplr.hand = checkWinerPlayerIndex[k].hand;
                  let bestCards = [];
                  for (let f = 0; f < checkWinerPlayerIndex[k].hand.cards.length; f++) {
                    if(f < 5){
                      if(checkWinerPlayerIndex[k].hand.cards[f].value == '1'){ // If got '1' instead of 'A' 
                        checkWinerPlayerIndex[k].hand.cards[f].value = 'A';
                      }

                      bestCards.push(
                        checkWinerPlayerIndex[k].hand.cards[f].value + checkWinerPlayerIndex[k].hand.cards[f].suit.toUpperCase()
                      );
                    }
                    
                  }
                  if(winplr.hand.name == 'Straight Flush' && winplr.hand.rank == 9){
                    if(winplr.hand.descr == 'Royal Flush'){
                      winplr.hand.name = winplr.hand.descr;
                      winplr.hand.rank = parseInt(winplr.hand.rank + 1);
                    }
                  }
                  console.log("BestCards 3->", bestCards)
                  winplr.hand.bestCards = bestCards;
                  index = checkWinerPlayerIndex[k].index;
                }
              }
            }
  
            if (room.game.status == 'ForceFinishedFolded') {
              room.game.gameRevertPoint.push({
                playerID: winplr.id,
                amount: winTotalAmount,
                playerIndex: index,
                forcefinishfolded: true,
              });
            } else {
              room.game.gameRevertPoint.push({
                playerID: winplr.id,
                amount: winTotalAmount,
                playerIndex: index,
                forcefinishfolded: false,
              });
            }
  
  
          } else {
            // Save winner
            for (let s = 0; s < PokerWinnerResult.length; s += 1) {
              if (PokerWinnerResult.length == winnerHands.length) {
                console.log("ALL Normal Player Winners");
                winplr = room.players[checkWinerPlayerIndex[s].index];
                winplr.hand = checkWinerPlayerIndex[s].hand;
  
                let bestCards = [];
                for (let f = 0; f < checkWinerPlayerIndex[s].hand.cards.length; f++) {
                  if(f < 5){
                    if(checkWinerPlayerIndex[s].hand.cards[f].value == '1'){ // If got '1' instead of 'A' 
                      checkWinerPlayerIndex[s].hand.cards[f].value = 'A';
                    }
                    bestCards.push(
                      checkWinerPlayerIndex[s].hand.cards[f].value + checkWinerPlayerIndex[s].hand.cards[f].suit.toUpperCase()
                    );
                  }
                }
                if(winplr.hand.name == 'Straight Flush' && winplr.hand.rank == 9){
                  if(winplr.hand.descr == 'Royal Flush'){
                    winplr.hand.name = winplr.hand.descr;
                    winplr.hand.rank = parseInt(winplr.hand.rank + 1);
                  }
                }
                winplr.hand.bestCards = bestCards;
  
              } else {
  
                for (let k = 0; k < checkWinerPlayerIndex.length; k++) {
                  if (JSON.stringify(checkWinerPlayerIndex[k].hand.cards) == JSON.stringify(PokerWinnerResult[s].cards)) {
  
                    winplr = room.players[checkWinerPlayerIndex[k].index];
                    winplr.hand = checkWinerPlayerIndex[k].hand;
  
                    let bestCards = [];
                    for (let f = 0; f < checkWinerPlayerIndex[k].hand.cards.length; f++) {
                      if(f < 5){
                        if(checkWinerPlayerIndex[k].hand.cards[f].value == '1'){ // If got '1' instead of 'A' 
                         checkWinerPlayerIndex[k].hand.cards[f].value = 'A';
                        }

                        bestCards.push(
                          checkWinerPlayerIndex[k].hand.cards[f].value + checkWinerPlayerIndex[k].hand.cards[f].suit.toUpperCase()
                        );
                      }
                    }
                    if(winplr.hand.name == 'Straight Flush' && winplr.hand.rank == 9){
                      if(winplr.hand.descr == 'Royal Flush'){
                        winplr.hand.name = winplr.hand.descr;
                        winplr.hand.rank = parseInt(winplr.hand.rank + 1);
                      }
                    }
                    winplr.hand.bestCards = bestCards;
  
                  }
                }
              }
  
              if (s == PokerWinnerResult.length - 1) {
                winAmount = winTotalAmount;
              } else {
                winAmount = winAmountPart;
              }
  
              winTotalAmount = winTotalAmount - winAmountPart;
              winplr.chips += parseFloat(winAmount);
              room.gameWinners.push({
                playerId: winplr.id,
                playerName: winplr.playerName,
                amount: +parseFloat(winAmount).toFixed(2),
                hand: winplr.cards,
                bestCards: winplr.hand.bestCards,
                winningType: winplr.hand.name,
                uniqId:winplr.uniqId,
                rank: winplr.hand.rank,
                chips: parseFloat(winplr.chips),
                winnerSeatIndex: winplr.seatIndex,
                sidePotPlayerIndex: -1, // main Port index,
                rackAmount: 0
              });
            }
          }
        }
  
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        console.log("Game Winner :", room.gameWinners, room.game.gameNumber);
        console.log("Game RevertPoint :", room.game.gameRevertPoint, room.game.gameNumber);
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
      
    }
    catch (e) {
      console.log("Error in checkForWinner :", e);
      return new Error(e);
    }
  },

  validateRevertPoint: async function(room, revertPoint){
    try{
      console.log("validate, game pot", room.game.pot);
      if(revertPoint.length > 0){
        let totalRevertPoint = + parseFloat( revertPoint.reduce((partial_sum, a) => parseFloat(partial_sum) + parseFloat(a.amount) , 0 )  ).toFixed(4);
        let sidePot = room.game.gamePot;
        let totalSidepot = + parseFloat( sidePot.reduce((partial_sum, a) => parseFloat(partial_sum) + parseFloat(a.sidePotAmount) , 0 )  ).toFixed(4);
        console.log("validate, totalRevertPoint", totalRevertPoint, totalSidepot);
        if(totalRevertPoint > ( room.game.pot - totalSidepot) ){
          let tempRevertPoint = [];
          let tempTotalPot = 0;
          for (let h = 0; h < revertPoint.length; h += 1) {
           if(tempTotalPot < ( room.game.pot - totalSidepot) ){
            tempTotalPot += revertPoint[h].amount;
            tempRevertPoint.push(revertPoint[h]);
           }
          }
          room.game.gameRevertPoint = tempRevertPoint;
          console.log("validate, room.game.gameRevertPoint", room.game.gameRevertPoint, tempTotalPot)
        }
      }   
    }catch(e){
      console.log("error in validationg revertpOint", e)
    }
  },

  revertPoint: async function (room, isFolded) {
    console.log("folded----", isFolded)
    let newRevertPoint = await module.exports.validateRevertPoint(room, room.game.gameRevertPoint);
    console.log("after validation room.game.gameRevertPoint", room.game.gameRevertPoint)

    // temp store revertpoint, to consider in rake
    room.game.otherData.gameRevertPoint = [...room.game.gameRevertPoint];
    // Send Revert Point to Player
    for (let h = 0; h < room.game.gameRevertPoint.length; h += 1) {
      if (room.game.gameRevertPoint[h].amount > 0) {
        let winplr = room.players[room.game.gameRevertPoint[h].playerIndex];
        let winAmount = room.game.gameRevertPoint[h].amount;
        for (let w = 0; w < room.players.length; w += 1) {           
          if(room.players[w].id == room.game.gameRevertPoint[h].playerID ){

            var totalBetAmount = room.game.roundBets[w];

            console.log("(room.game.gameRevertPoint[h].amount: ", room.game.gameRevertPoint[h].amount);
            let winnerDetails={
              user_id:  room.game.gameRevertPoint[h].playerID,
              username:room.players[w].playerName,
              bet_amount: parseFloat(totalBetAmount),
              chips:parseFloat(room.game.gameRevertPoint[h].amount),
            }
            room.game.winnerDetails.push(winnerDetails);
            room.game.history.push({
              time: new Date(),
              playerId: room.game.gameRevertPoint[h].playerID,
              playerName: room.players[w].playerName,
              gameRound: "Revert point",
              betAmount: parseFloat(room.game.gameRevertPoint[h].amount) ,
              totalBetAmount:totalBetAmount,
              playerAction: 10,
              totalPot: room.game.pot,
              remaining:room.players[room.game.gameRevertPoint[h].playerIndex].chips,
              boardCard:room.game.board.length ? room.game.board:"",
            })

            let transactionRevert = {
              user_id:room.game.gameRevertPoint[h].playerID,
              username: room.players[w].playerName,
              gameId: room.game.id,
              gameNumber: room.game.gameNumber,
              tableId: room.id,
              tableName: room.tableNumber,
              chips:parseFloat(room.game.gameRevertPoint[h].amount),
              previousBalance:parseFloat(room.players[w].chips),
              afterBalance: (parseFloat(room.players[w].chips) + parseFloat(room.game.gameRevertPoint[h].amount)),
              category: 'credit',
              type: 'revert',
              remark: 'Revert for game',
              isTournament: 'No'
            }

            await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionRevert);
            let traNumber = + new Date()
              let transactionDataWinData = {									
              user_id: room.game.gameRevertPoint[h].playerID,
              username: room.players[w].playerName,
              gameId: room.game.id,
              gameNumber: room.game.gameNumber,
              chips: parseFloat(room.game.gameRevertPoint[h].amount),
              bet_amount: room.game.roundBets[w],
              afterBalance:parseFloat(room.players[room.game.gameRevertPoint[h].playerIndex].chips + room.game.gameRevertPoint[h].amount),
              previousBalance: room.players[room.game.gameRevertPoint[h].playerIndex].chips +  room.game.roundBets[w] ,
              category: 'credit',
              type: 'winner',
              transactionNumber: 'DEP-' + traNumber,

              remark: 'Winner for game  in revert point',
              uniqId:room.players[w].uniqId,
              sessionId:room.players[w].sessionId
            }
              console.log(transactionDataWinData);
             await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionDataWinData);

          }
        }

        // rack update
        winplr.chips += winAmount;
        let dataObj = {
          playerId: winplr.id,
          roomId: room.id,
          playerName: winplr.playerName,
          amount: winAmount,
          chips: winplr.chips,
          winnerSeatIndex: winplr.seatIndex,
          sidePotPlayerIndex: -1, // main Port index,
          forcefinishfolded: room.game.gameRevertPoint[h].forcefinishfolded,
        };
        console.log("revertpoint in playerProcess", dataObj, room.game.gameNumber)
        //Add revertpoint amount into player winningarray  @chetan
        for (let w = 0; w < room.gameWinners.length; w += 1) {
          if (room.game.gameRevertPoint[h].playerID == room.gameWinners[w].playerId) {
            room.gameWinners[w].chips += parseFloat(room.game.gameRevertPoint[h].amount);
          }
        }
        
        //console.log("revertpoint player", room.game.gameRevertPoint);
        //console.log("room winners", room.gameWinners);
        console.log("revert point win amount", winAmount);
        console.log("final wining amount sum", winplr.chips);
        console.log('<=> Game RevertPoint Broadcast || Texas GAME-NUMBER [' + room.game.gameNumber + '] || RevertPoint : ', dataObj);
         // added by K@Y

        if (isFolded == true) {

          console.log("isFolded revertpoint check", dataObj, room.game.gameNumber)

          if (dataObj.forcefinishfolded == true) {

            let totalOfRoundBets = 0;

            let tempRoundBets = room.game.roundBets.slice();
            tempRoundBets.sort(function (a, b) {
              return a - b;
            });

            if (tempRoundBets[(tempRoundBets.length) - 1] > tempRoundBets[(tempRoundBets.length) - 2]) {
              tempRoundBets[(tempRoundBets.length) - 1] = tempRoundBets[(tempRoundBets.length) - 2];
            }
            console.log("roundbetss", room.game.roundBets, room.game.gameNumber);
            totalOfRoundBets = parseFloat((tempRoundBets.reduce((a, b) => a + b, 0)).toFixed(4));
            console.log("total win when forcefinishfolded", totalOfRoundBets, room.game.gameNumber)

            room.gameWinners.push({
              playerId: winplr.id,
              playerName: winplr.playerName,
              amount: +parseFloat(totalOfRoundBets).toFixed(2),
              chips: parseFloat(winplr.chips),
              winnerSeatIndex: winplr.seatIndex,
              sidePotPlayerIndex: -1,
              rackAmount: 0
            });


            console.log("forcefinishfolded gameWinner", room.gameWinners, room.game.gameNumber)

            //START: 12-08-2019 rack deduction response change and win amount minus revert point amount old code
            //room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.rackDeduction(room);
            //dataObj.chips = newRoom.gameWinners[0].chips;
            //END: 12-08-2019 rack deduction response change and win amount minus revert point amount old code

            //START: 12-08-2019 rack deduction response change and win amount minus revert point amount new code
            // newRoom = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.rackDeduction(room);
            newRoom=room
            console.log("RevertPointFolded room: ", newRoom.game);
            dataObj.chips = newRoom.gameWinners[0].chips;
            /*for(var ri = 0; ri<newRoom.game.gameRevertPoint.length; ri++){
              if(room.game.gameRevertPoint[h].playerID == newRoom.game.gameRevertPoint[ri].playerID){
                dataObj.amount = newRoom.game.gameRevertPoint[ri].amount;
              }
            }*/
            //END: 12-08-2019 rack deduction response change and win amount minus revert point amount new code            
           for (let index = 0; index < newRoom.gameWinners.length; index++) {
             console.log(" before game revert room.game.gameTotalChips",room.game.gameTotalChips, newRoom.gameWinners[index].rackAmount);
             let orignalBalanceChips=parseFloat(newRoom.gameWinners[index].amount) - parseFloat(newRoom.gameWinners[index].rackAmount)
             room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips) -parseFloat(orignalBalanceChips)).toFixed(4);
             console.log(" after game revert room.game.gameTotalChips",room.game.gameTotalChips);       
             if(newRoom.gameWinners[index].amount!= dataObj.amount){
              let actualData=dataObj.amount-newRoom.gameWinners[index].amount
              room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips) -parseFloat(actualData)).toFixed(4);
             }
           }
           console.log("Complete game revert room.game.gameTotalChips",room.game.gameTotalChips);       
            console.log("forcefinishfolded gameWinner chipss after rack", newRoom.gameWinners, dataObj, newRoom.game.gameNumber)
            await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(newRoom.id).emit('RevertPointFolded', dataObj);
            newRoom.gameWinners.pop();
            console.log("game winners array after pop", newRoom.gameWinners, newRoom.game.gameNumber);
          } else {
            room.game.gameTotalChips= parseFloat(parseFloat(room.game.gameTotalChips)-parseFloat(dataObj.amount)).toFixed(4);
            await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RevertPointFolded', dataObj);
          }



        } else {
          console.log("reveertpoint in......", room.game.gameNumber)
          room.game.gameTotalChips= eval(parseFloat(room.game.gameTotalChips).toFixed(4)- parseFloat(dataObj.amount).toFixed(4));
          await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RevertPoint', dataObj);
        }

        if (room.game.gameMainPot > 0) {
          room.game.gameMainPot -= parseFloat(parseFloat(room.game.gameRevertPoint[h].amount).toFixed(4));
        }


        
        console.log("revertpoint after assigning through revertpoint function", room.game.gameRevertPoint, room.game.gameNumber);
      }
    }
    room.game.gameRevertPoint = [];
  },

}
