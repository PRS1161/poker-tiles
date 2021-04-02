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
                                    cards: ['BC', 'BC', 'BC', 'BC', 'BC', 'BC']
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
            
                        },waitForGame,room);
                    
                    } else if (room.game.status == 'ForceFinishedFolded') {
                        console.log('effective ForceFinishedFolded', room.game.gameNumber, room.game.status, room.status);
            
                        let turnBetData = room.getPreviousPlayerAction();
                        await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerAction', {
                            action: turnBetData,
                            playerBuyIn: (turnBetData.playerId) ? parseFloat(room.getPlayerById(turnBetData.playerId).chips) : 0,
                            roomId: room.id,
                            totalTablePotAmount: room.game.pot,
                        
                        });
            
                
                        console.log("round complete sidePot: ", sidePot);
                        console.log("round complete room.game.gameMainPot: ", room.game.gameMainPot);
                        console.log("round complete room.game.pot: ", room.game.pot);
            
                        for (i = 0; i < room.game.bets.length; i += 1) {
                            room.game.bets[i] = 0;
                        }
                        room.game.maxBetOnRaise = 0;
                        room.game.stopReraise = false;
                        room.game.isUnqualifiedRaise = false;
            
                        console.log('<=> Game Finished Round Complete Broadcast in FORCEFINISHFOLDED ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || RoundComplete : ');
            
                        await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
                            potAmount: room.game.pot,
                            roomId: room.id,
                            playerSidePot: {
                                sidePot: sidePot,
                                mainPot: +(room.game.gameMainPot).toFixed(2)
                            }
                        });
                        // await self.checkForWinner(room);
                        Sys.Timers[room.id] = setTimeout(async function (room) {
                            // await self.revertPoint(room, true);
                            room.currentPlayer = undefined;
                            
                            await Sys.Game.CashGame.Texas.newControllers.RoomProcess.gameFinished(room, sidePot)
                        }, 1000, room)
                       
                    } else {
                        console.log("showdown else condition in progress");
                        // await self.revertPoint(room, true);

                        /* COMMENT FOR ONLY TEST PURPOSE START */

                        // room.currentPlayer = undefined;
                        // await Sys.Game.CashGame.Texas.newControllers.RoomProcess.gameFinished(room, sidePot);

                        /* COMMENT FOR ONLY TEST PURPOSE END */

                        /* FOR TEST PURPOSE GAME LOGIC START  */
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
                        await Sys.Game.CashGame.Texas.newControllers.RoomProcess.roundFinished(room, sidePot)
                        /* FOR TEST PURPOSE GAME LOGIC END  */
                    }
                }
                else {
                    console.log("room status turnFinished", room.game.status, room.status);
                    await Sys.Game.CashGame.Texas.newControllers.RoomProcess.turnFinished(room);
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
}