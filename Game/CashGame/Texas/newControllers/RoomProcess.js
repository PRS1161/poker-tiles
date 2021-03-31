var Sys = require('../../../../Boot/Sys');

module.exports = {
	checkRoomSeatAvilability: async function (socket, data) {
		try {
			let self = this
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {
					status: 'fail',
					result: null,
					message: "Room not found",
					statusCode: 401
				};
			}
			console.log("room in check room", room)
			for (let i = 0; i < room.players.length; i++) {
				if (room.players[i].id == data.playerId) {
					room.players[i].socketId = socket.id; // Update Socket Id if Old Player Found!.
				}
			}
			return room;

		} catch (e) {
			console.log("Error: ", e);
		}
	},
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
					room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.broadcastPlayerInfo(room);
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
							cards: ['BC', 'BC', 'BC', 'BC', 'BC', 'BC']
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
								Sys.Game.CashGame.Texas.newControllers.RoomProcess.playerDefaultAction(room.id);
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

	turnFinished: async function (room) {
		try {
			for (let i = 0; i < room.players.length; i++) {
				room.players[i].isAlreadyActed =false;
			}
			console.log("isPreventMultipleTurn", room.otherData.isPreventMultipleTurn);
			if(room.otherData.isPreventMultipleTurn == true){
				console.log("in isPreventMultipleTurn");
				return false;
			}
			room.otherData.isPreventMultipleTurn = true;
			
			if (room.otherData.isCardDistributed == false) {

				clearTimeout(Sys.Timers[room.id]);
				clearInterval(Sys.Timers[room.id]);
				room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
				console.log('TurnFinished in without card distribution', parseFloat(room.otherData.gameSpeed))

				let playersCards = [];
				for (let i = 0; i < room.players.length; i++) {
					console.log("Status  :-", room.players[i].status, room.game.gameNumber);
					console.log("Name  :-", room.players[i].playerName, room.game.gameNumber);

					if (room.players[i].status == 'Playing') {
						console.log("playing player Name card distribute 1: ", room.players[i].playerName)
						playersCards.push({
							playerId: room.players[i].id,
							cards: ['BC', 'BC', 'BC', 'BC', 'BC', 'BC']
						});
					}
				}
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnPlayersCardsDistribution', { playersCards: playersCards, roomId: room.id })

				Sys.Timers[room.id] = setTimeout(async function (room) {
					// Send Player Cards in his Socket.
					for (let i = 0; i < room.players.length; i++) {
						if (room.players[i].status == 'Playing') {
							console.log("playing player Name card distribute 2: ", room.players[i].playerName)
							await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([room.players[i].socketId]).emit('OnPlayerCards', {
								playerId: room.players[i].id,
								cards: room.players[i].cards,
								roomId: room.id
							})
						}

					}
					room.otherData.isCardDistributed = true;

					if (room.getCurrentPlayer()) {
						let turnBetData = room.getPreviousPlayerAction();
						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerAction', {
							action: turnBetData,
							roomId: room.id,
							playerBuyIn: (turnBetData.playerId) ? parseFloat(room.getPlayerById(turnBetData.playerId).chips) : 0,
							totalTablePotAmount: + parseFloat(room.game.bets.reduce((partial_sum, a) => partial_sum + a) + room.game.pot).toFixed(4),
						});


						let timer = parseFloat(room.otherData.gameSpeed);
						let buttonAction = room.getCurrentTurnButtonAction();
					
						let totalPlayingPlayers = 0;
						for (i = 0; i < room.players.length; i++) {
							if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
								totalPlayingPlayers++;
							}
						}
						console.log("totalplaying players", totalPlayingPlayers, room.players, room.game.gameNumber, room.game.status, room.status)
						console.log("Player Timer Send 2 buttonAction: ", buttonAction);
						if (totalPlayingPlayers > 1) {
							Sys.Timers[room.id] = setInterval(async function (room) {
								try {
									console.log("Player Timer Send 2 : ", timer, room.game.gameNumber);

									timer--;
									if (timer < 0) {
										clearTimeout(Sys.Timers[room.id]); // Clear Turn Timer
										clearInterval(Sys.Timers[room.id]);
										room.players[room.currentPlayer].isAlreadyActed = true;
										console.log("room players in turnFinished 1", room.players); 
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerDefaultAction(room.id);
									}else{
										await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnTurnTimer', {
											playerId: room.getCurrentPlayer().id,
											timer: timer,
											roomId: room.id,
											maxTimer: parseFloat(room.otherData.gameSpeed),
											buttonAction: buttonAction,
											defaultButtons: room.getDefaultButtons()
										});
									}	

								} catch (e) {
									console.log("Catched Error in RoomProcss.turnFinished :", e);
								}
							}, 1000, room);
						}

					}

				}, (250), room);  // open players cards quickly
				console.log("isPreventMultipleTurn in turnFinish if", room.otherData.isPreventMultipleTurn)
				room.otherData.isPreventMultipleTurn = false;
			} else {
				clearTimeout(Sys.Timers[room.id]);
				clearInterval(Sys.Timers[room.id]);
				room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
				console.log('TurnFinished', parseFloat(room.otherData.gameSpeed))
				if (room.getCurrentPlayer()) {
					let turnBetData = room.getPreviousPlayerAction();
					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerAction', {
						action: turnBetData,
						roomId: room.id,
						playerBuyIn: (turnBetData.playerId) ? parseFloat(room.getPlayerById(turnBetData.playerId).chips) : 0,
						totalTablePotAmount: + parseFloat(room.game.bets.reduce((partial_sum, a) => partial_sum + a) + room.game.pot).toFixed(4),
					});
					// reset prebet options
					for (let p = 0; p < room.players.length; p++) {
						if (room.players[p].id == turnBetData.playerId) {
							room.players[p].isCheck = false;
							room.players[p].isFold = false;
							room.players[p].isCall = false;
						}
					}
					
					let timer = parseFloat(room.otherData.gameSpeed);
					let buttonAction = room.getCurrentTurnButtonAction();
				
					let totalPlayingPlayers = 0;
					for (i = 0; i < room.players.length; i++) {
						if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
							totalPlayingPlayers++;
						}
					}
					console.log("totalplaying players", totalPlayingPlayers, room.players, room.game.gameNumber, room.game.status, room.status)
					console.log("Player Timer Send 2 buttonAction: ", buttonAction);
					if (totalPlayingPlayers > 1) {
						Sys.Timers[room.id] = setInterval(async function (room) {
							try {
								console.log("Player Timer Send 2 : ", timer, room.game.gameNumber);
								
								timer--;
								// For Player Default Action
								let maxBet = parseFloat(room.getMaxBet(room.game.bets));
								let yourBet = parseFloat(room.game.bets[room.currentPlayer]);
								let playerChips = parseFloat(room.players[room.currentPlayer].chips);

								if (timer < 0) {
									clearTimeout(Sys.Timers[room.id]); // Clear Turn Timer
									clearInterval(Sys.Timers[room.id]);
									room.players[room.currentPlayer].isAlreadyActed = true;
									console.log("room players in turnFinished 2", room.players); 
									Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerDefaultAction(room.id);
								}else if(room.getCurrentPlayer().isCheck == true){
									if (maxBet == yourBet) {
										//room.check(room.getCurrentPlayer().id);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: 0,
										  	action: 2,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									} else {
										//room.fold(room.getCurrentPlayer().id);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: 0,
										  	action: 6,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									}
								}else if(room.getCurrentPlayer().isCall == true){
									if (parseFloat(maxBet - yourBet) == 0) {
										//room.check(room.getCurrentPlayer().id);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: 0,
										  	action: 2,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									}
									else if (playerChips <= parseFloat(maxBet - yourBet)) {
										//room.AllIn(room.getCurrentPlayer().id, false);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: playerChips,
										  	action: 8,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									} else {
										//room.call(room.getCurrentPlayer().id, false);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: (maxBet - yourBet),
										  	action: 4,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									}
								}else if(room.getCurrentPlayer().isFold == true){
									//room.fold(room.getCurrentPlayer().id);
									Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
										playerId: room.getCurrentPlayer().id,
									  	betAmount: 0,
									  	action: 6,
									  	roomId: room.id,
									  	hasRaised: false,
									  	productName: 'Better Poker'
									});
								}else{
									await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnTurnTimer', {
										playerId: room.getCurrentPlayer().id,
										timer: timer,
										roomId: room.id,
										maxTimer: parseFloat(room.otherData.gameSpeed),
										buttonAction: buttonAction,
										defaultButtons: room.getDefaultButtons()
									});
								}

							} catch (e) {
								console.log("Catched Error in RoomProcss.turnFinished :", e);
							}
						}, 1000, room);
					}

				}
				console.log("isPreventMultipleTurn in turnFinish else", room.otherData.isPreventMultipleTurn)
				room.otherData.isPreventMultipleTurn = false;
			}

		} catch (e) {
			console.log("Error:", e);
		}
	},

	roundFinished: async function (room, sidePot) {
		try {
			console.log('<=> Round Finished ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || Player SidePot : ', sidePot);
			//room.timerStart = false;
			clearTimeout(Sys.Timers[room.id]);
			clearInterval(Sys.Timers[room.id]);
			for (let i = 0; i < room.players.length; i++) {
				room.players[i].isAlreadyActed =false;
			}
			console.log("Room Game POT :", room.game.pot, room.game.gameNumber, room.game.status, room.status);
			console.log("Room Game bets :", room.game.roundBets, room.game.gameNumber, room.game.status, room.status);
			room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
			console.log("round finished main pot", room.game.bets.reduce((partial_sum, a) => partial_sum + a))

			let turnBetData = room.getPreviousPlayerAction();
			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerAction', {
				action: turnBetData,
				roomId: room.id,
				playerBuyIn: (turnBetData.playerId) ? parseFloat(room.getPlayerById(turnBetData.playerId).chips) : 0,
				totalTablePotAmount: room.game.pot
			});
			console.log("roundfinished Roundcomplete broadcast", room.game.pot, room.game.gameMainPot, sidePot, room.game.gameNumber, room.game.status, room.status)
			// reset prebet options
			for (let p = 0; p < room.players.length; p++) {
				if (room.players[p].id == turnBetData.playerId) {
					room.players[p].isCheck = false;
					room.players[p].isFold = false;
					room.players[p].isCall = false;
				}
			}
			Sys.Timers[room.id] = setTimeout(async function (room) {
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
					cards: room.game.board,
					potAmount: room.game.pot,
					playerSidePot: {
						sidePot: sidePot,
						mainPot: +(room.game.gameMainPot).toFixed(2)
					},
					roomId: room.id
				});

			
				for (let h = 0; h < room.game.gameRevertPoint.length; h += 1) {
					if (room.game.gameRevertPoint[h].amount > 0) {
						let winplr = room.players[room.game.gameRevertPoint[h].playerIndex];
						let winAmount = room.game.gameRevertPoint[h].amount;
						// rack update
						winplr.chips += winAmount;

						let dataObj = {
							playerId: winplr.id,
							playerName: winplr.playerName,
							amount: winAmount,
							chips: winplr.chips,
							winnerSeatIndex: winplr.seatIndex,
							sidePotPlayerIndex: -1, // main Port index,
							roomId: room.id
						};
						console.log("before revertpoint in turnfinish", dataObj, room.game.gameNumber, room.game.status, room.status)
						//Add revertpoint amount into player winningarray  @chetan
						for (let w = 0; w < room.gameWinners.length; w += 1) {
							if (room.game.gameRevertPoint[h].playerID == room.gameWinners[w].playerId) {
								room.gameWinners[w].chips += parseFloat(room.game.gameRevertPoint[h].amount);
							}
						}

						//console.log("revertpoint player", room.game.gameRevertPoint);
						//console.log("room winners", room.gameWinners);
						console.log("revert point win amount", winAmount, room.game.gameNumber);
						console.log("final wining amount sum", winplr.chips, room.game.gameNumber);
						console.log('<=> Game RevertPoint Broadcast || Texas GAME-NUMBER [' + room.game.gameNumber + '] || RevertPoint : ', dataObj);
						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RevertPoint', dataObj);
					}
				}

				if (room.getCurrentPlayer()) {
					Sys.Timers[room.id] = setTimeout(async function (room) {

						// Form New Round Set Turn Bet in Raised Amount is BB
						Sys.Rooms[room.id].turnBet = { action: Sys.Config.Texas.Bet, playerId: room.players[room.currentPlayer].id, betAmount: 0, raisedAmount: room.bigBlind, hasRaised: false }
						console.log("<< New Roud Start.......  >>")
						console.log("<< Turn Bet ::", Sys.Rooms[room.id].turnBet)
						let timer = parseFloat(room.otherData.gameSpeed);
						let buttonAction = room.getCurrentTurnButtonAction();
						console.log(buttonAction);

						let totalPlayingPlayers = 0;
						for (i = 0; i < room.players.length; i++) {
							if (room.players[i].status == 'Playing' && room.players[i].folded == false) {
								totalPlayingPlayers++;
							}
						}
						if (totalPlayingPlayers > 1) {
							console.log("Player Timer Send 3 roundFinish buttonAction: ", buttonAction);
							Sys.Timers[room.id] = setInterval(async function (room) {
								console.log("Player Timer Send 3 roundFinish: ", timer, room.game.gameNumber);
								
								timer--;
								// For Player Default Action
								let maxBet = parseFloat(room.getMaxBet(room.game.bets));
								let yourBet = parseFloat(room.game.bets[room.currentPlayer]);
								let playerChips = parseFloat(room.players[room.currentPlayer].chips);

								if (timer < 0) {
									clearTimeout(Sys.Timers[room.id]); // Clear Turn Timer
									clearInterval(Sys.Timers[room.id]);
									room.players[room.currentPlayer].isAlreadyActed = true;
									console.log("room players in roundFinished", room.players); 
									Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerDefaultAction(room.id);
								}else if(room.getCurrentPlayer().isCheck == true){
									if (maxBet == yourBet) {
										//room.check(room.getCurrentPlayer().id);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: 0,
										  	action: 2,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									} else {
										//room.fold(room.getCurrentPlayer().id);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: 0,
										  	action: 6,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									}
								}else if(room.getCurrentPlayer().isCall == true){
									if (parseFloat(maxBet - yourBet) == 0) {
										//room.check(room.getCurrentPlayer().id);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: 0,
										  	action: 2,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									}
									else if (playerChips <= parseFloat(maxBet - yourBet)) {
										//room.AllIn(room.getCurrentPlayer().id, false);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: playerChips,
										  	action: 8,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									} else {
										//room.call(room.getCurrentPlayer().id, false);
										Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
											playerId: room.getCurrentPlayer().id,
										  	betAmount: (maxBet - yourBet),
										  	action: 4,
										  	roomId: room.id,
										  	hasRaised: false,
										  	productName: 'Better Poker'
										});
									}
								}else if(room.getCurrentPlayer().isFold == true){
									//room.fold(room.getCurrentPlayer().id);
									Sys.Game.CashGame.Texas.Controllers.RoomProcess.playerAction({
										playerId: room.getCurrentPlayer().id,
									  	betAmount: 0,
									  	action: 6,
									  	roomId: room.id,
									  	hasRaised: false,
									  	productName: 'Better Poker'
									});
								}else{
									await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnTurnTimer', {
										playerId: room.getCurrentPlayer().id,
										timer: timer,
										roomId: room.id,
										maxTimer: parseFloat(room.otherData.gameSpeed),
										buttonAction: buttonAction,
										defaultButtons: room.getDefaultButtons()
									});
								}

							}, 1000, room);
						}

					}, (Sys.Config.Texas.waitAfterRoundComplete / 2), room)
				}
			}, 250, room)
		} catch (e) {
			console.log(" Error roundFinished :", e);
		}
	},

	gameFinished: async function (room, sidePot) {
		try {
			clearTimeout(Sys.Timers[room.id]);
			let waitTime = Sys.Config.Texas.waitAfterRoundComplete;

			if (room.game.gameRevertPoint.length > 0) { // Wait For Revert Point Animation Show.
				waitTime += 1000;
			}

			let forceFinishedAllIn = false;
			if (room.game.status == 'Finished AllIn') {
				waitTime += 1000;
				forceFinishedAllIn = true;
			}

			var showCardsPlayerIds = [];
			if (room.players.length > 0) {
				for (var pl = 0; pl < room.players.length; pl++) {

					if (room.players[pl].status == "Playing" && room.players[pl].folded == false) {
						showCardsPlayerIds.push(room.players[pl].id);
					}
				}
			}
			console.log("after push player showCardsPlayerIds: ", showCardsPlayerIds);

			let originalGameStatus = room.game.status;
			if (room.game.status != 'Finished') {
				room.game.status = 'Finished';
				room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
				console.log('<=> Game Finished Called ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] ||');
				let dataObj = {
					cards: room.game.board,
					potAmount: room.game.pot
				};
				console.log('<=> Game Finished Round Complete Broadcast ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] || RoundComplete : ', dataObj);
				console.log("gamefinished Roundcomplete broadcast", room.game.pot, room.game.gameMainPot, sidePot, room.game.status, room.status)
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('RoundComplete', {
					cards: room.game.board,
					potAmount: room.game.pot,
					playerSidePot: {
						sidePot: sidePot,
						mainPot: +(room.game.gameMainPot).toFixed(2)
					},
					roomId: room.id
				});
				
			}

			let extraWaitTime = 1000;
			if (originalGameStatus == 'ForceFinishedFolded') {
				extraWaitTime = 300;
			}
			Sys.Timers[room.id] = setTimeout(async function (room, showCardsPlayerIds) {

				Sys.Timers[room.id] = setTimeout(async function (room, showCardsPlayerIds) {

					let playersCards = [];

					// show player cards after aggressor
					if (originalGameStatus != 'Finished AllIn' && originalGameStatus != 'ForceFinishedFolded') {
						//1) decide aggressor
						console.log("aggressorIdArray", room.game.aggressorIdArray);
						if (room.game.aggressorIdArray.length > 0) {
							for (let a = (room.game.aggressorIdArray.length - 1); a >= 0; a--) {
								console.log("aggressorId", room.getPlayerById(room.game.aggressorIdArray[a]));
								let player = room.getPlayerById(room.game.aggressorIdArray[a]);
								console.log("aggressor player", player);
								if (player.status == "Playing") {
									room.game.aggressorIdArray = [player.id];
									playersCards.push({
										playerId: player.id,
										cards: player.cards
									});
									for (let i = 0; i < room.players.length; i++) {
										if (room.players[i].id == player.id) {
											room.players[i].isDisplayedCard = true;
											break;
										}
									}
									console.log("after aggressor assign", room.players)
									break;
								}
							}
							console.log("Afterr deciding aggressor", room.game.aggressorIdArray, room.game.aggressorIdArray.length);
						}


						if (room.game.aggressorIdArray.length <= 0) {
							//2) decide left of the dealer
							let playerFound = false;
							for (let i = room.smallBlindIndex; i < room.players.length; i += 1) {
								console.log("room.players in deciding left of the dealer", room.players[i].playerName, room.players[i].id, room.players[i].folded, room.players[i].allIn, room.players[i].status)
								if (room.players[i].folded === false && room.players[i].status === 'Playing') {
									room.players[i].isDisplayedCard = true;
									playersCards.push({
										playerId: room.players[i].id,
										cards: room.players[i].cards
									});
									console.log("left of the dealer", room.players[i].id);
									playerFound = true;
									break;
								}
							}
							if (playerFound == false) {
								console.log("player not found so search again ")
								console.log("dealer index", room.dealerIndex)
								for (let i = 0; i < room.dealerIndex; i += 1) {
									console.log("room.players in deciding left of the dealer", room.players[i].playerName, room.players[i].id, room.players[i].folded, room.players[i].allIn, room.players[i].status)
									if (room.players[i].folded === false && room.players[i].status === 'Playing') {
										room.players[i].isDisplayedCard = true;
										playersCards.push({
											playerId: room.players[i].id,
											cards: room.players[i].cards
										});
										console.log("left of the dealer", room.players[i].id);
										playerFound = true;
										break;
									}
								}
							}
						}
						console.log("playersCards before gameWinner", playersCards)

						//3) check for winnerarray
						console.log("gameWinners-----", room.gameWinners);
						for (let i = 0; i < room.players.length; i++) {
							console.log("game status", originalGameStatus);
							if (originalGameStatus != 'Finished AllIn') {
								for (let w = 0; w < room.gameWinners.length; w++) {
									if (room.players[i].status == 'Playing' && room.players[i].folded != true && room.gameWinners[w].playerId == room.players[i].id && playersCards.findIndex(k => k.playerId === room.players[i].id) == -1) {
										console.log("inside the gameWinners", room.players[i].id, room.players[i].playerName)
										room.players[i].isDisplayedCard = true;
										playersCards.push({
											playerId: room.players[i].id,
											cards: room.players[i].cards
										});
									}
								}

							}
						}

						console.log("GameFinishedPlayersCards", playersCards);
					}

					if (originalGameStatus != 'Finished AllIn') {
						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('GameFinishedPlayersCards', { playersCards: playersCards, roomId: room.id })
					}

					for (var gw = 0; gw < room.gameWinners.length; gw++) {
						if (showCardsPlayerIds.indexOf(room.gameWinners[gw].playerId) > -1) {
							var indexOfWinner = showCardsPlayerIds.indexOf(room.gameWinners[gw].playerId);
							showCardsPlayerIds.splice(indexOfWinner, 1);
						}
					}

					for (var ag = 0; ag < room.game.aggressorIdArray.length; ag++) {
						if (showCardsPlayerIds.indexOf(room.game.aggressorIdArray[ag]) > -1) {
							var indexOfWinner = showCardsPlayerIds.indexOf(room.game.aggressorIdArray[ag]);
							showCardsPlayerIds.splice(indexOfWinner, 1);
						}
					}

					console.log("final showcard array showCardsPlayerIds: ", showCardsPlayerIds);				
					console.log("gameFinished showCardsPlayerIds: ", showCardsPlayerIds);
					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('DisplayShowCardButton', { playerIdList: showCardsPlayerIds, gameId: room.game.id, roomId: room.id , buttonActiveTime: 8});
					
					let showCardTime = 8000;
					// timeout condition for folded players

					if (originalGameStatus == 'ForceFinishedFolded') {
						waitTime = 1000;
					}
					Sys.Timers[room.id] = setTimeout(async function (room) {
						
						var winnerPlayerIds = [];
						var winnerPlayerAmount = [];
						for (var c = 0; c < room.gameWinners.length; c++) {
							winnerPlayerIds.push(room.gameWinners[c].playerId);
							winnerPlayerAmount.push(room.gameWinners[c].amount);
						}

						console.log("winnerPlayerIds: ", winnerPlayerIds);
						console.log("winnerPlayerAmount: ", winnerPlayerAmount);
						
						for (var rp = 0; rp<room.players.length; rp++){

							var transactionData = await Sys.Game.CashGame.Texas.Services.ChipsServices.getSingleData({user_id: room.players[rp].id,gameId: room.game.id});
							var winPlayerDetail = await Sys.App.Services.PlayerServices.getSinglePlayerData({_id:room.players[rp].id});
							var totalBetAmount = room.game.roundBets[rp];
							console.log("room.players.id: ", room.players[rp].id);

							if(winnerPlayerIds.indexOf(room.players[rp].id) > -1 && parseFloat(totalBetAmount) > 0){
								var winnerIndex = winnerPlayerIds.indexOf(room.players[rp].id);
								
								var winnerAmount = 0;
								for(var wp=0; wp<winnerPlayerIds.length; wp++){
									if(winnerPlayerIds[wp] == room.players[rp].id){
										winnerAmount += winnerPlayerAmount[wp]
									}
								}

								console.log("winner Amount new: ", winnerAmount);
								console.log("parseFloat(totalBetAmount): ", parseFloat(totalBetAmount));
								console.log("parseFloat(winnerAmount): ", parseFloat(winnerAmount));

								var transactionDetail = await Sys.Game.CashGame.Texas.Services.ChipsServices.getSingleData({user_id : room.players[rp].id, gameId : room.game.id});
								console.log("transactionDetail: ", transactionDetail);

								if(transactionDetail == null){

									let traNumber = + new Date()
									let transactionDataWinData = {									
										user_id: room.players[rp].id,
										transactionNumber: 'DEP-' + traNumber,
										username: room.players[rp].playerName,
										gameId: room.game.id,
										gameNumber: room.game.gameNumber,
										chips: parseFloat(winnerAmount),
										bet_amount: parseFloat(totalBetAmount),
										afterBalance:  parseFloat(room.players[rp].chips),
										previousBalance: (parseFloat(room.players[rp].chips) +  parseFloat(totalBetAmount))- parseFloat(winnerAmount),
										category: 'credit',
										type: 'winner',
										remark: 'Winner for game finished',
										uniqId:room.players[rp].uniqId,
										sessionId:room.players[rp].sessionId
									}
									await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionDataWinData);

									let transactionData = {
										user_id:room.players[rp].id,
										username: room.players[rp].playerName,
										gameId: room.game.id,
										gameNumber: room.game.gameNumber,
										tableId: room.id,
										tableName: room.tableNumber,
										chips: parseFloat(winnerAmount),
										previousBalance: (parseFloat(room.players[rp].chips) - parseFloat(winnerAmount)),
										afterBalance:  parseFloat(room.players[rp].chips),
										category: 'credit',
										type: 'winner',
										remark: 'winner for game',
										isTournament: 'No',
										isGamePot: 'no'
									}
									console.log("Winner for game: ", transactionData);
									await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionData);
									
									
									//await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionDataWinData);
								}else{
									var newChips = parseFloat(transactionDetail.chips) + parseFloat(winnerAmount);
									let previousBalance = parseFloat(transactionDetail.previousBalance) - parseFloat(winnerAmount);
									console.log("transactionDetail exist newChips: ", newChips);
									console.log("transactionDetail exist previousBalance: ", previousBalance);
									await Sys.Game.CashGame.Texas.Services.ChipsServices.updateTransactionData({_id :transactionDetail._id},{ previousBalance:parseFloat(previousBalance), chips:parseFloat(newChips).toFixed(2)});
								}

								let winnerDetails={
									user_id: room.players[rp].id,
									username: room.players[rp].playerName,
									bet_amount: parseFloat(totalBetAmount),
									chips: parseFloat(winnerAmount),
								}

								room.game.winnerDetails.push(winnerDetails);
								
							}else if(winnerPlayerIds.indexOf(room.players[rp].id) == -1 && parseFloat(totalBetAmount) > 0){
								if(transactionData == null){
									let traNumber = + new Date()										
									let transactionDataWinData = {									
										user_id: room.players[rp].id,
										username: room.players[rp].playerName,
										gameId: room.game.id,
										gameNumber: room.game.gameNumber,
										chips: parseFloat(totalBetAmount),
										bet_amount: parseFloat(totalBetAmount),
										afterBalance: parseFloat(room.players[rp].chips),
										previousBalance:parseFloat(room.players[rp].chips) +  parseFloat(totalBetAmount),
										category: 'debit',
										type: 'lose',
										remark: 'Lose for game',
										transactionNumber: 'DE-' + traNumber,
										uniqId:room.players[rp].uniqId,
										sessionId:room.players[rp].sessionId
									};
									
									await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionDataWinData);

									let transactionData = {
										user_id:room.players[rp].id,
										username: room.players[rp].playerName,
										gameId: room.game.id,
										gameNumber: room.game.gameNumber,
										tableId: room.id,
										tableName: room.tableNumber,
										chips:  parseFloat(0),
										previousBalance:parseFloat(room.players[rp].chips),
										afterBalance: parseFloat(room.players[rp].chips),
										category: 'debit',
										type: 'lose',
										remark: 'Lose for game',
										isTournament: 'No',
										isGamePot: 'no'
									}
									console.log("lose for game: ", transactionData);
									await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionData);
								}
							}
						}
 						
						console.log("Log before wining Game room.game.gameTotalChips",room.game.gameTotalChips);
						for (var c = 0; c < room.gameWinners.length; c++) {	
							console.log("rackAmount",room.gameWinners[c].rackAmount);
							let actualWinamountPlr= parseFloat(room.gameWinners[c].amount) - parseFloat(room.gameWinners[c].rackAmount)
							room.game.gameTotalChips = parseFloat(parseFloat(room.game.gameTotalChips) - parseFloat(actualWinamountPlr)).toFixed(4)
						}
						if(room.game.gameTotalChips <= -0.01 || room.game.gameTotalChips >= 0.01){
							let errorLog={
								gameNumber:room.game.gameNumber,
								gameTotalChips:room.game.gameTotalChips,
								winners:room.game.winners,
								pot:room.game.pot,
								roomId:room.game.roomId,
								rakePercenage:room.game.rakePercenage,
								gameId:room.game.id,
							}
							console.log("error on game",errorLog);
							
							await Sys.Game.CashGame.Texas.Services.ChipsServices.createErrorLog(errorLog);
						}
						console.log("Log after wining Game room.game.gameTotalChips",room.game.gameTotalChips);
						
						dataObj = {
							winners: room.gameWinners
						};
						console.log('<=> Game Finished Broadcast || Texas GAME-NUMBER [' + room.game.gameNumber + '] || GameFinished : ', dataObj);

						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('GameFinished', { winners: room.gameWinners, roomId: room.id });
						console.log('<=> Game Start Saving Histry ||  Texas GAME-NUMBER [' + room.game.gameNumber + '] ||');

						let history = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.saveGameToHistry(room);

						// timeout condition for folded players
						let gameWinningTime = (room.gameWinners.length * 300) + parseFloat(Sys.Config.Texas.waitBeforeGameReset)
						if (originalGameStatus == 'ForceFinishedFolded') {
							gameWinningTime = 500;
						}
						console.log("gameWinningTime", gameWinningTime);
						Sys.Timers[room.id] = setTimeout(async function (room) {

							console.log('<=> Game ResetGame Broadcast ||  Texas GAME-NUMBER [] || ResetGame : ');
							await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('ResetGame', { roomId: room.id });

							// Check For Sit Out Next Hand. & Remove Player & Check For Bankcrupt
							for (let i = 0; i < room.players.length; i++) {
								if (room.players[i].sitOutNextHand == true) {
									room.gameLosers.push(room.players[i]);
									room.players[i].status = 'Ideal';
									await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnIdealPlayer', { 'playerId': room.players[i].id, status: true, roomId: room.id });
									room.players[i].defaultActionCount = 3;
									room.players[i].idealTime = (room.players[i].idealTime == null) ? new Date().getTime() : room.players[i].idealTime;
								}

								// Check For Bankcrupt
								if (room.players[i].extraChips == 0 && room.players[i].chips == 0 && room.players[i].status != 'Left') {
									room.players[i].status = 'Ideal';
									room.players[i].idealTime = (room.players[i].idealTime == null) ? new Date().getTime() : room.players[i].idealTime;										
								}		
							}
							
							for (let i = room.players.length - 1; i >= 0; i--) {
							
								if (room.players[i].status == 'Left' || room.players[i].isAllInLefted == true) {
									if (room.players[i].isAllInLefted == true) {
										room.players[i].status = 'Left';
										//room.players[i].isAllInLefted = false;
										await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('PlayerLeft', { 'playerId': room.players[i].id, roomId: room.id });
									}
									room.players[i].sitOutNextHand = false;
									room.players[i].sitOutNextBigBlind = false;
									room.players[i].defaultActionCount = 0;
									room.players[i].isDisplayedCard = false;
									room.players[i].roundRaisedAmount = 0;
									room.players[i].considerLeftedPlayer = false;
									room.players[i].isAlreadyActed =false;
									console.log("Removed Name  : ", room.players[i].playerName, room.players[i].id)

									let dataPlayer = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(room.players[i].id);
									console.log("room.players[i].isAllinPlayersChipsAssigned in game finish", room.players[i].isAllinPlayersChipsAssigned)

									if (dataPlayer && room.players[i].isAllinPlayersChipsAssigned == false && room.players[i].status == 'Left') {
										console.log("Chips", dataPlayer.chips, room.players[i].chips);
										let chips = 0;
										if(room.players[i].extraChips > 0) {console.log("extra chips of lefted player", room.players[i].id, room.players[i].extraChips);
											chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips);
											let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[i].id, { chips: chips, extraChips: 0 });
											room.players[i].extraChips = 0;
										}else{
											chips = parseFloat(dataPlayer.chips) + parseFloat(room.players[i].chips);
											let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(room.players[i].id, { chips: chips });
										}
										room.players[i].isAllinPlayersChipsAssigned = true;
										
										// added by K@Y
										let transactionData = {
											user_id: room.players[i].id,
											username: room.players[i].playerName,
											gameId: room.game.id,
											chips: parseFloat(dataPlayer.chips),
											previousBalance: parseFloat(room.players[i].chips),
											afterBalance: chips,
											category: 'credit',
											type: 'leave room',
											remark: 'Old player left game'
										}
										
										//await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);

										let transactionDataLeft = {
											user_id: room.players[i].id,
											username: room.players[i].playerName,
											gameId: room.game.id,
											gameNumber: room.game.gameNumber,
											tableId: room.id,
											tableName: room.tableNumber,
											chips: parseFloat(room.players[i].chips),
											previousBalance: parseFloat(dataPlayer.chips),
											afterBalance: parseFloat(chips),
											category: 'credit',
											type: 'entry',
											remark: 'Left',
											isTournament: 'No',
											isGamePot: 'no'
										}
										let traNumber = + new Date()
										let sessionData={
											sessionId:room.players[i].sessionId,
											uniqId:room.players[i].uniqId,
											user_id:room.players[i].id,
											username:room.players[i].playerName,
											chips: room.players[i].chips,
											previousBalance: parseFloat(dataPlayer.chips),
											afterBalance: parseFloat(chips),
											type:"leftChips",
											remark:"game left",
											transactionNumber: 'DEP-' + traNumber,
											category:"credit"
										}
										await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData);	
										console.log("Player Left for game: ", transactionDataLeft);
										
										await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionDataLeft);
										
									}
								}
							
								console.log(room.players.length,i)
									
							}

							console.log("room.groupId",room.groupId, room.game.pot,typeof room.game.pot);
							

							// remove lefted player also
							room.status = 'Finished';
							room.tempStatus = "inTransit";
							room.game = null;
							// Game Finished update fold/allin/talked value.
							for (var i = 0; i < room.players.length; i++) {
								room.players[i].folded = false;
								room.players[i].allIn = false;
								room.players[i].talked = false;
								room.players[i].muck = false; 
								room.players[i].isSidepot = false;
								//room.otherData.lastFoldedPlayerId = '';
								room.lastFoldedPlayerIdArray = [];
								room.otherData.isCardDistributed = false;
								room.otherData.isPreventMultipleTurn == false;
								room.players[i].isDisplayedCard = false;
								room.players[i].roundRaisedAmount = 0;
								room.players[i].cards.splice(0, room.players[i].cards.length);
								room.players[i].subscribeTime = new Date();

								room.players[i].isFold = false;
								room.players[i].isCheck = false;
								room.players[i].isCall = false;
								room.players[i].considerLeftedPlayer = false;
								room.players[i].isAlreadyActed =false;
							}
							room.timerStart = false;
							room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);

							// timeout condition for folded players
							let waitAfterGameReset = parseFloat(Sys.Config.Texas.waitAfterGameReset);
							if (originalGameStatus == 'ForceFinishedFolded') {
								waitAfterGameReset = 1000;
							}
							console.log("waitAfterGameReset", waitAfterGameReset)
							Sys.Timers[room.id] = setTimeout(async function (room) {
								room.status = "Finished";
								room.tempStatus = "inTransit";
								//room.game = null;

								// open add chips popup if player has chips== 0 @chetan
								// for (i = 0; i < room.players.length; i++) {
								// 	if (room.players[i].status == 'Ideal' && room.players[i].chips == 0) {
										
								// 		let minBuyIn = room.minBuyIn;
								// 		let maxBuyIn = room.maxBuyIn;

								// 		console.log("popup open for player ", room.players[i].id)
								// 		if(room.players[i].extraChips == 0){
								// 			let playerChips = await Sys.App.Services.PlayerServices.getSinglePlayerData({_id: room.players[i].id});
								// 			console.log("playerchips in buyin panel check", playerChips.chips, room.smallBlind);
								// 			if(playerChips && playerChips.chips < room.minBuyIn){
								// 			room.players[i].status = 'Ideal';
								// 			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnIdealPlayer', { 'playerId': room.players[i].id, status: true, roomId: room.id });
								// 			room.players[i].idealTime = (room.players[i].idealTime == null) ? new Date().getTime() : room.players[i].idealTime;
								// 			}else{
								// 			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.players[i].socketId).emit('OnOpenBuyInPanel', { 'playerId': room.players[i].id, roomId: room.id });
								// 			}
								// 			}
								// 		//await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnOpenBuyInPanel', { 'playerId': room.players[i].id, roomId:room.id });
								// 		// await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.players[i].socketId).emit('OnOpenBuyInPanel', { 'playerId': room.players[i].id, roomId: room.id });

								// 	}
								// }

								// console.log('<===============================>');
								// console.log('<=> Ramain Player : <=>', totalPlayers);
								// console.log('<===============================>');

								// //Chirag 30-08-2019 code add to check if system under maintenance if not so game continue running and if under maintenance show game not running
								// let m_start_date = moment(new Date(Sys.Setting.maintenance.maintenance_start_date)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
								// let m_end_date = moment(new Date(Sys.Setting.maintenance.maintenance_end_date)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
								// let current_date = moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
								// //Chirag 30-08-2019 code add to check if system under maintenance if not so game continue running and if under maintenance show game not running

								// console.log("m_start_date: ", m_start_date);
								// console.log("m_end_date: ", m_end_date);
								// console.log("current_date: ", current_date);

								// if (current_date >= m_start_date && current_date <= m_end_date && Sys.Setting.maintenance.status == 'active') {
								// 	room.tempStatus = "Waiting";
								// 	Sys.Game.Common.Controllers.RoomController.playerRemoveBySystem(room);
								// } else {
								// 	if (totalPlayers >= room.minPlayers && room.status != 'Running' && room.timerStart == false) {
								// 		console.log('<===============================>');
								// 		console.log('<=> New Game Starting [] <=>');
								// 		console.log("pgame starting gameFinish room status", room.status);
								// 		console.log("**************************************");
								// 		console.log("game started from gameFinish")
								// 		console.log("**************************************");
								// 		console.log('<===============================>');
								// 		room.tempStatus = "Waiting";
								// 		room.timerStart = true;
									
								// 		room.StartGame();
										
								// 	} else {
								// 		room.tempStatus = "Waiting";
								// 		console.log('<===============================>');
								// 		console.log('<=> Not Minimum Player Found So Game not Starting ');
								// 		console.log('<===============================>');
								// 	}

								// }

							}, waitAfterGameReset, room)

						}, gameWinningTime, room)

					}, waitTime + showCardTime, room)

				}, extraWaitTime, room, showCardsPlayerIds);

			}, extraWaitTime, room, showCardsPlayerIds);

		} catch (e) {
			console.log("Error:", e);
		}
	},

	playerDefaultAction: async function (id) {
		try {
			console.log('playerDefaultAction called');
			clearTimeout(await Sys.Timers[id]);
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(id);
			if (room.getCurrentPlayer()) {
				let currentPlayer = room.getCurrentPlayer()
				let maxBet, i;
				maxBet = 0;
				console.log("room.game.bets :", room.game.bets);
				for (i = 0; i < room.game.bets.length; i += 1) {
					if (room.game.bets[i] > maxBet) {
						maxBet = room.game.bets[i];
					}
				}


				// first check for check action and then for fold or lefting the player
				if (room.game.bets[room.currentPlayer] == maxBet) {
					room.check(currentPlayer.id);
				} else {
					currentPlayer.defaultActionCount += 1;
					
					let bigBlindPlayer = room.getBigBliendPlayer();
					console.log("BIG BLIND PLAYER",bigBlindPlayer.id,currentPlayer.id)
					if(bigBlindPlayer.id == currentPlayer.id){
						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnIdealPlayer', { 'playerId': currentPlayer.id, status: true, roomId: room.id });
						currentPlayer.idealTime = (currentPlayer.idealTime == null) ? new Date().getTime() : currentPlayer.idealTime;
						currentPlayer.status = 'Ideal';
						room.fold(currentPlayer.id);
					}else{
						room.fold(currentPlayer.id);
					}
				}
			}
		} catch (e) {
			console.log("Error", e);
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

async function getRandomIntInclusive(min, max) {
	try {
	  min = Math.ceil(min);
	  max = Math.floor(max);
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	catch (e) {
	  console.log("Catched error in getRandomIntInclusive :", e);
	  return 0;
	}
}