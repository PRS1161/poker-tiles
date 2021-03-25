var Sys = require('../../../../Boot/Sys');

module.exports = {
	joinRoom: async function (player, data) {
		try {
			var room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			console.log("1111 joinRoom room: ", room);

			if (!room || !room.players) {
				return {
					status: 'fail',
					result: null,
					message: "Room not found",
					statusCode: 401
				};
			}
			
			let seats = [];
			for (let i = 0; i < room.maxPlayers; i++) {
			  seats.push(i);
			}

			for (let i = 0; i < room.players.length; i++) {
				const player = room.players[i];
				if (player.status != 'Left') {
				  seats.splice(seats.indexOf(player.seatIndex), 1);
				}
			}

			data.seatIndex = seats[await getRandomIntInclusive(0, seats.length - 1)];
			console.log("DATA SEAT INDEX", data.seatIndex)
			// chek seat in players array
			let seatAvailable = true;
			if (room.players.length > 0) {
				for (let i = 0; i < room.players.length; i++) {
					if (room.players[i].seatIndex == data.seatIndex && room.players[i].status != 'Left' && room.players[i].status != 'Ideal') {
						seatAvailable = false
						break;
					}
				}
			}
			
			console.log("------------------------------------------------------------")
			console.log("----------seatAvailable :", seatAvailable)
			console.log("----------profilePicId :", parseFloat(player.profilePic),player.avatar)
			console.log("------------------------------------------------------------")
		
			if (seatAvailable) {

				let updatedPlayerChips = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);

				let chips = parseFloat(updatedPlayerChips.chips) - parseFloat(data.chips); // Shiv!@#
				
				let transactionData = {
					user_id: player.id,
					username: player.username,
					tableId: room.id,
					tableName: room.tableNumber,
					chips: data.chips,
					previousBalance: parseFloat(updatedPlayerChips.chips),
					afterBalance: chips,
					category: 'debit',
					type: 'entry',
					remark: 'Joined',
					isTournament: 'No',
					isGamePot: 'no'
				}
				let allPlayingPlayers = 0;
				for(let i = 0; i < room.players.length; i++){
					if(room.players[i].status == 'Playing'){
						allPlayingPlayers++;
					}
				}
				console.log("join player transactionData: ", transactionData);
				let date = new Date()
				let timestamp1 = date.getTime();
				let sessionId= player.uniqId + "-" + room.tableNumber+"-" +timestamp1
				await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionData);
				
				console.log("Added Player ->>>>>>>>>>.");
				console.log("Added Player data.chips: ", data.chips, player.username);

				let totalPlayingPlayers = 0;
				for (i = 0; i < room.players.length; i++) {
					if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
						totalPlayingPlayers++;
					}
				}
					
				let plr = await room.AddPlayer(player.id, data.socketId, player.username,player.profilePic, 0, parseFloat(data.chips), data.seatIndex, data.autoBuyin, new Date(),player.longitude,player.latitude,player.uniqId,sessionId,player.avatar);
					
				let traNumber = + new Date()
				let sessionData={
					sessionId:sessionId,
					uniqId:player.uniqId,
					username:player.username,
					user_id:player.id,
					chips: data.chips,
					previousBalance: parseFloat(updatedPlayerChips.chips),
					afterBalance: chips,
					remark:"join game add Chips",
					transactionNumber: 'DE-' + traNumber,
					type:"addChips",
					category:"debit"
				}
				console.log(sessionData);
				await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData)
				room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
				let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(player.id, { chips: chips });
				console.log("Player Updated", room.players.length, updatedPlayerChips.chips);

				if (room.players.length > 0) {
					room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);
					let totalPlayers = 0
					room.players.forEach(function (player) {
						if (player.status != 'Left' && player.status != 'Ideal') {
							totalPlayers += 1;
						}
					})
					console.log('Player Length ->>>>>', totalPlayers);
					console.log('Status :: ', room.status)
					console.log('room.timerStart :: ', room.timerStart)
					console.log("pgame starting join room room status before", room.status);
					if (room.status != 'Running' && totalPlayers >= room.minPlayers) {
						if (room.game == null && room.timerStart == false) {
							room.timerStart = true; // When 12 Second Countdown Start.
							room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
							await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnGameStartWait', { roomId: room.id })
							console.log('Game object not present 2');
							Sys.Timers[room.id] = setTimeout(function () {
								room.timerStart = false; // Reset Timer Variable
								clearTimeout(Sys.Timers[room.id]); // Clear Room Timer
								clearInterval(Sys.Timers[room.id]);
								console.log("Game Starting....");

								totalPlayers = 0;
								for (i = 0; i < room.players.length; i++) {
									if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal') {
										totalPlayers++;
									}
								}
								console.log('<===============================>');
								console.log('<=> Game Starting [] New <=>', totalPlayers);
								console.log("pgame starting join room room status", room.status);
								console.log('<===============================>');
								if (totalPlayers >= room.minPlayers && room.status != 'Running') {
									console.log("**************************************");
									console.log("room started from Join room")
									console.log("**************************************");
									room.timerStart = true;
									room.StartGame();
								} else {
									console.log('<=> Some Player Leave So not Start Game. <=>', totalPlayers);
								}

							}, Sys.Config.Texas.waitBeforeGameStart)
						}
					}
					return room;
				}

			} else {
				console.log('Seat is not available.');
				return new Error('Seat is not available');
			}
		} catch (error) {
			console.log('Error in JoinRoom : ' + error);
			return new Error('Error in JoinRoom Process', error);
		}
	},

	leftRoom: async function (data) {
		try {
			console.log("LeftRoom Data", data);
			if (!data.roomId) {
				return { status: 'fail', result: null, message: "Room Not Found", statusCode: 401 };
			}
			var room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return { status: 'fail', result: null, message: "Room Not Found", statusCode: 401 };
			}

			let player = null;
			let isAllinPlayerWhenLefted = false;
			let leftedPlayerIndexId;
			if (room && room.players && room.players.length > 0) {
				for (let i = 0; i < room.players.length; i++) {
					if (room.players[i].id == data.playerId && room.players[i].allIn == true) {
						room.players[i].isAllInLefted = true;
						room.players[i].idealTime = null;
						isAllinPlayerWhenLefted = true;
						room.players[i].defaultActionCount = 0;

						player = room.players[i];
						leftedPlayerIndexId = room.players[i].id;
					}

					if (room.players[i].id == data.playerId && room.players[i].status != 'Left' && room.players[i].allIn == false) {
						room.players[i].idealTime = null;
						if (room.players[i].allIn == true) {
							isAllinPlayerWhenLefted = true;
						}
						leftedPlayerIndexId = room.players[i].id;
						room.players[i].defaultActionCount = 0;
						room.players[i].considerLeftedPlayer = true;
						player = room.players[i];
						break;
					}
				}
			}
			if (player) {

				if (room.game && room.game.status == 'Running') {
					let totalPlayingPlayers = 0;
					for (i = 0; i < room.players.length; i++) {
						if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
							totalPlayingPlayers++;
						}
					}
					console.log("totalplayers", totalPlayingPlayers)
					if (player.folded === false && player.status == 'Playing') {
						if (totalPlayingPlayers <= 1) {
							console.log("player left less than 1 player")
							clearTimeout(Sys.Timers[room.id]);
							room.removePlayer(player.id);
						} else {
							if (player.isAllInLefted == false) {
								console.log("player left gretaer than 1 player")
								room.removePlayer(player.id);
							}

						}
					}

				}else{
					console.log("player left game stuck issue", room.status)
					if(room.status == 'Running'){
						if (player.folded === false && player.status == 'Playing') {
							console.log("player left game stuck issue, remove player");
							
							for (let i = 0; i < room.players.length; i++) {
								if (room.players[i].id == data.playerId && room.players[i].isAllInLefted != true ) {
									room.players[i].status = "Left";
									room.players[i].folded = true;
									room.players[i].talked = true;
								}
							}
						}		
					}
				}

				if (player.status != 'Left' && player.allIn == false) {
					for (i = 0; i < room.players.length; i++) {
						if (room.players[i].id == leftedPlayerIndexId &&  room.players[i].isAllInLefted != true) {
							room.players[i].status = "Left";
							break;
						}
					}
					
				}

				await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
				console.log("Player Left ", player.id);
				if (player.isAllInLefted == false) {
					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId': player.id, roomId: room.id });
				}
				console.log("----leftedPlayerIndexId-----out", leftedPlayerIndexId);
				
				let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(player.id);
				if (dataPlayer && isAllinPlayerWhenLefted == false) {

					for (t = 0; t < room.players.length; t++) {
						if (room.players[t].id == player.id && room.players[t].isAllinPlayersChipsAssigned ==false ) {
							console.log("Chips", dataPlayer.chips, player.chips, room.players[t].chips, player.extraChips, room.players[t].extraChips);
							let chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[t].chips) + parseFloat(room.players[t].extraChips);
							console.log("Chips", dataPlayer.chips, room.players[t].chips, chips);
							
							var playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(player.id, { chips: chips, extraChips: 0 });
							
							console.log("player update on chips assign", playerUpdate, player.id)
							room.players[t].isAllinPlayersChipsAssigned = true;

							console.log("----leftedPlayerIndexId-----", leftedPlayerIndexId);
							room.players[t].extraChips = 0;

							console.log("room.players[i].isAllinPlayersChipsAssigned in playerleft", room.players[t].isAllinPlayersChipsAssigned, room.players[t].playerName)
							let updatedRoom = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);

							let traNumber = + new Date()
							let sessionData={
								sessionId:player.sessionId,
								uniqId:player.uniqId,
								user_id:player.id,
								username:dataPlayer.username,
								chips: player.chips,
								previousBalance: parseFloat(dataPlayer.chips),
								afterBalance: chips,
								type:"leftChips",
								remark:"game left",
								transactionNumber: 'DEP-' + traNumber,
								category:"credit"
							}
							await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData)
							
							// added by K@Y
							let transactionData = {
								user_id: dataPlayer.id,
								username: dataPlayer.username,
								// gameId						:	room.game.id,
								chips: (parseFloat(player.chips) + parseFloat(player.extraChips)),
								previousBalance: parseFloat(dataPlayer.chips),
								afterBalance: parseFloat(chips),
								category: 'credit',
								type: 'leave',
								remark: 'Credit BuyIn Chips With Main Balance'
							}
							
							var logGameId = "";
							var logGameNum = "";
							if(room.game != null){
								logGameId = room.game.id;
								logGameNum = room.game.gameNumber;
							}

							let transactionDataLeft = {
			                    user_id: dataPlayer.id,
			                    username: dataPlayer.username,
			                    gameId: logGameId,
			                    gameNumber: logGameNum,
			                    tableId: room.id,
			                    tableName: room.tableNumber,
			                    chips: (parseFloat(player.chips) + parseFloat(player.extraChips)),
			                    previousBalance: parseFloat(dataPlayer.chips),
			                    afterBalance: parseFloat(chips),
			                    category: 'credit',
			                    type: 'entry',
			                    remark: 'Left',
			                    isTournament: 'No',
			                    isGamePot: 'no'
			                }

			                console.log("Player left transactionDataLeft: ", transactionDataLeft);
			                await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataLeft);

							break;
						}
					}
					return { status: 'success', result: room.id, message: "Room Left Sccess", statusCode: 200 };
				
				} else {
					return { status: 'success', result: room.id, message: "Room Left Sccess", statusCode: 401 };
				}
			} else {
				console.log(" No Player Found -----#### ");
				return { status: 'fail', result: null, message: "Player not found", statusCode: 401 };
			}
		} catch (error) {
			console.log("Error:", error);
			return new Error("Error in Left Room");
		}
	},

	newRoundStarted: async function (room) {
		try {
			room.otherData.isCardDistributed = false;
			console.log("New round Started", room.players, room.game.gameNumber);
			var room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room)
			if (!room) {
				return {
					status: 'fail',
					result: null,
					message: "Room not found",
					statusCode: 401
				};
			}
	
			if(room.players.length > 1){
				room.oldDealerIndex = room.players[room.dealerIndex].seatIndex;
				room.oldSmallBlindIndex = room.players[room.smallBlindIndex].seatIndex;
				room.oldBigBlindIndex = room.players[room.bigBlindIndex].seatIndex;
			}else{
				room.oldDealerIndex = null;
				room.oldSmallBlindIndex = null;
				room.oldBigBlindIndex = null;
			}

			room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);

			// Send Game Boot Data.

			let bootGameData = {
				smallBlindPlayerId: room.getSmallBliendPlayer().id,
				smallBlindChips: parseFloat(room.game.bets[room.smallBlindIndex]),
				smallBlindPlayerChips: parseFloat(room.getSmallBliendPlayer().chips),
				bigBlindPlayerId: room.getBigBliendPlayer().id,
				bigBlindChips: parseFloat(room.game.bets[room.bigBlindIndex]),
				bigBlindPlayerChips: parseFloat(room.getBigBliendPlayer().chips),
				dealerPlayerId: room.getDealer().id,
				roomId: room.id,
				totalTablePotAmount: + parseFloat(room.game.bets.reduce((partial_sum, a) => partial_sum + a) + room.game.pot).toFixed(4),
			}
			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnGameBoot', bootGameData);



			Sys.Timers[room.id] = setTimeout(async function (room) {
				// Event for Cards Distribution.
				let playersCards = [];
				for (let i = 0; i < room.players.length; i++) {
					console.log("Status  :-", room.players[i].status, room.game.gameNumber);
					console.log("Name  :-", room.players[i].playerName, room.game.gameNumber);

					if (room.players[i].status == 'Playing') {
						console.log("playing player Name card distribute 1: ", room.players[i].playerName)
						playersCards.push({
							playerId: room.players[i].id,
							cards: ['BC', 'BC']
						});
					}
				}
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnPlayersCardsDistribution', { playersCards: playersCards, roomId: room.id })
			
				Sys.Timers[room.id] = setTimeout(async function (room) {
					// Send Player Cards in his Socket.
					for (let i = 0; i < room.players.length; i++) {
						console.log("playing player Name card distribute 2: ", room.players[i].status)
						if (room.players[i].status == 'Playing') {
							console.log("playing player Name card distribute 2: ", room.players[i].playerName)
							console.log("playing player Name card distribute room.players[i].socketId: ", room.players[i].socketId)
							console.log("playing player Name card distribute room.players[i].cards: ", room.players[i].cards)
							await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([room.players[i].socketId]).emit('OnPlayerCards', {
								playerId: room.players[i].id,
								cards: room.players[i].cards,
								roomId: room.id
							})
						}

					}
					room.otherData.isCardDistributed = true;

					let timer = parseFloat(room.otherData.gameSpeed);
					let buttonAction = room.getCurrentTurnButtonAction();
					console.log(buttonAction);
					let totalPlayingPlayers = 0;
					for (i = 0; i < room.players.length; i++) {
						if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
							totalPlayingPlayers++;
						}
					}
					console.log("Player Timer Send 1 buttonAction: ", buttonAction);
					if (totalPlayingPlayers > 1) {
						Sys.Timers[room.id] = setInterval(async function (room) {
							console.log("Player Timer Send 1 : ", timer, room.game.gameNumber);

							timer--;
							if (timer < 0) {
								clearTimeout(Sys.Timers[room.id]); // Clear Turn Timer
								clearInterval(Sys.Timers[room.id]);
								room.players[room.currentPlayer].isAlreadyActed = true;
								console.log("room players in newRoundStarted", room.players); 
								Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerDefaultAction(room.id);
							}else{
								await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnTurnTimer', {
									playerId: room.getCurrentPlayer().id,
									timer: timer,
									maxTimer: parseFloat(room.otherData.gameSpeed),
									buttonAction: buttonAction,
									roomId: room.id
								});
							}

						}, 1000, room);
					}

				}, (250), room);  // open players cards quickly
				//}, (500 * room.players.length) , room);
			}, (1000 * parseFloat(Sys.Config.Texas.waitBeforeCardDistribut)), room);
			return
		} catch (e) {
			console.log("Error:", e);
		}
	},

	newGameStarted: async function (room) {
		try {
				console.log("Game Started Brodcast");
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('GameStarted', {
					message: 'starting first round',
					gameId: room.game.id,
					gameNumber: room.game.gameNumber,
					roomId: room.id
				});
		} catch (e) {
			console.log("Error:", e);
		}
	},

    playerAction: async function (data) {
		try {
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {
					status: 'fail',
					result: null,
					message: "Room not found",
					statusCode: 401
				};
			}
			var currentPlayer = room.getCurrentPlayer();
			console.log("currentPlayer.isAlreadyActed texas", currentPlayer.isAlreadyActed);
			if ( ( currentPlayer && (currentPlayer.id != data.playerId) ) || ( currentPlayer.isAlreadyActed == true ) ) {
				return console.log('Its not your turn or your turn expired');
			}
			if (room.game.status == 'Running') {
				currentPlayer.defaultActionCount = 0;
				currentPlayer.idealTime = null;

				clearTimeout(Sys.Timers[room.id]);
				clearInterval(Sys.Timers[room.id]);
				currentPlayer.isAlreadyActed = true;
				console.log("room players in playerAction texas", room.players); 
				switch (data.action) {
					case Sys.Config.Texas.Check:
						if (room.check(data.playerId, data.hasRaised)) {
							return currentPlayer.turnBet;
						} else {
							return console.log('This is not your turn');
						}
						break
					case Sys.Config.Texas.Fold:
						if (room.fold(data.playerId, data.hasRaised)) {
							return currentPlayer.turnBet;
						} else {
							return console.log('This is not your turn');
						}
						break
					case Sys.Config.Texas.Call:
						if (room.call(data.playerId, data.hasRaised)) {
							return currentPlayer.turnBet;
						} else {
							return console.log('This is not your turn');
						}
						break
					case Sys.Config.Texas.Bet:
						if (room.bet(data.playerId, data.betAmount, data.hasRaised)) {
							return currentPlayer.turnBet;
						} else {
							return console.log('This is not your turn');
						}
						break
					case Sys.Config.Texas.AllIn:
						if (room.AllIn(data.playerId, data.hasRaised)) {
							return currentPlayer.turnBet;
						} else {
							return console.log('This is not your turn');
						}
						break
					default:
						return console.log('Selected action not found');
				}
			} else {
				return console.log('Game is not running');
			}
		}
		catch (e) {
			console.log("Error in playerAction :", e);
			return new Error(e);
		}
	},

	saveGameToHistry: async function (room) {
		try {
			console.log('Save game histry called');
			room.players = [...new Set(room.players)];

			room.players.forEach(function (player) {
				room.game.players.push(player.toJson())
			})
			room.gameLosers.forEach(function (player) {
				room.game.players.push(player.toJson())
			})
			room.game.winners = room.gameWinners; // Just Push Winner.
			return await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
		} catch (e) {
			console.log("Error:", e);
		}
	},

	broadcastPlayerInfo: async function (room) {
		try {
			let playerInfoDummy = [];
			
			for (var i = 0; i < room.players.length; i++) {
				if (room.players[i].status != 'Left') {
					console.log("room.players[i].avatar :", room.players[i].avatar)
					
					let bets = 0;
					if (room.game != null) {
						console.log("player roundbets", room.game.bets[i]);
						bets = room.game.bets[i];
					}
					let playerInfoObj = {
						id: room.players[i].id,
						status: room.players[i].status,
						username: room.players[i].playerName,
						chips: parseFloat(room.players[i].chips),
						appId: room.players[i].appid,
						avatar: room.players[i].avatar,
						fb_avatar: room.players[i].fb_avatar,
						folded: room.players[i].folded,
						allIn: room.players[i].allIn,
						seatIndex: room.players[i].seatIndex,
						idealPlayer: (room.players[i].status == "Ideal") ? true : false,
						betAmount: bets,
						longitude: room.players[i].longitude,
						latitude: room.players[i].latitude,
						profilePicUrl: room.players[i].profilePicUrl
					};
					console.log("plrobj",playerInfoObj)
					if (room.players[i].status != 'Ideal' && (room.players[i].status != 'Playing' || (room.players[i].folded == true) || room.status != 'Running')) {
						playerInfoObj.idealPlayer = false;
					}
					
					playerInfoDummy.push(playerInfoObj);
				}
			}
			
			console.log("while sending broadcast roomdata broadcast", playerInfoDummy);
			let dealerPlayerId = '';
			let sidePot = [];
			let gameMainPot = [];
			
			if (room.status == 'Running') {
				dealerPlayerId = room.getDealer().id;
				sidePot = room.game.gamePot;
				gameMainPot = room.game.gameMainPot;
			}
			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerInfoList', {
				playerInfo: playerInfoDummy,
				dealerPlayerId: dealerPlayerId,
				roomId: room.id,
				playerSidePot: {
					sidePot : sidePot,
					mainPot : gameMainPot
				}
			});
			return room;
		}
		catch (error) {
			console.log('Error in broadcastPlayerInfo : ' + error);
			return new Error('Error in broadcastPlayerInfo');
		}
	},
}