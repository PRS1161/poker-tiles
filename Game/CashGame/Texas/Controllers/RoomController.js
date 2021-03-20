var Sys = require('../../../../Boot/Sys');
var moment = require('moment-timezone');

module.exports = {

	roomInfo: async function (socket, data){
		try {
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room || room.length == 0) {
				return {
					status: 'fail',
					result: null,
					message: "Table not found",
					statusCode: 404
				};
			}
			let result = {
				"id": room.id,
				"tableNumber": room.tableNumber,
				"smallBlind": parseFloat(room.smallBlind),
				"bigBlind": parseFloat(room.bigBlind),
				"minPlayers": parseFloat(room.minPlayers),
				"maxPlayers": parseFloat(room.maxPlayers),
				"minBuyIn": parseFloat(room.minBuyIn),
				"maxBuyIn": parseFloat(room.maxBuyIn),
				"joinedPlayer": []
			}
			room.players.forEach(function (player) {
				if (player.status != 'Left') {
					result.joinedPlayer.push(player.id)
				}
			});
			console.log(result)
			return {
				status: 'success',
				message: "table detail",
				result: result
			};
		}
		catch (e) {
			console.log("Error in roomInfo : ", e);
			return new Error(e);
		}
	},

	subscribeRoom: async function (socket, data){
		try {
			// let checkDistance = await Sys.Game.Common.Controllers.RoomController.LocationTableValidation(socket,data);
		  
			// if(checkDistance.status == 'fail'){
			//   return{
			// 	status: 'fail',
			// 	message: 'Someone playing nearby to you',
			// 	result: null,
			// 	statusCode: 401
			//   }
			// }
			console.log("Subscribe Room is called");
			var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			let room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.checkRoomSeatAvilability(socket,data);
			
		
			if (!room || room == undefined) {
				return {
					status: 'fail',
					result: null,
					message: "Data not found",
					statusCode: 404
				};
			}
			socket.join(room.id); // Subscribe Room.
			let result = {}
			let gameNumber = '';
			let gameId = '';
			//START: Old code before 16-08-2019
				//if (room.game && room.game.status == 'Running') {
			//END: Old code before 16-08-2019
			console.log("check, subsctibe", room.status, room.game)
			if (room.game && room.status == 'Running') {
				//let sidePot = await room.game.getSidePotAmount(room);
				let sidePot = room.game.gamePot;
				console.log("sidepot and gamepot updates", sidePot);
				  /** Start ::: Custom code for Side Pot Two Player (code is Petch) */

				  let playersLength = 0;
				  for (let i = 0; i < room.players.length; i += 1) {
				    if(room.players[i].status != 'Ideal' && room.players[i].status != 'Left'){
				      playersLength += 1;
				    }
				  }
				  console.log("::: SidePot Length :",sidePot.length )
				  if(playersLength == 2 && sidePot.length > 0 ){
				    console.log("/************************************/")
				    console.log("::: SidePot :",sidePot)
				    console.log(":::  sidePot[0].sidePotAmount  :", sidePot[0].sidePotAmount )
				    console.log("::: room.game.gameMainPot :",room.game.gameMainPot)

				    //room.game.gameMainPot = + parseFloat( parseFloat(room.game.gameMainPot) + parseFloat(sidePot[0].sidePotAmount) );
				    //sidePot = [];
				    console.log("::: SidePot :",sidePot)

				    console.log("::: room.game.gameMainPot :",room.game.gameMainPot)
				    console.log("/************************************/")

				  }
				/** End ::: Custom code for Side Pot Two Player (code is Petch) */
				result.history = room.game.history
				result.currentRound = room.game.roundName
				result.cards = room.game.board
				result.potAmount = room.game.pot
				result.PlayerSidePot = {
					sidePot : sidePot,
					mainPot : room.game.gameMainPot
				}
				
				result.totalTablePotAmount = room.game.gameMainPot;
				if( (sidePot != undefined || sidePot != null) && sidePot.length > 0 ){console.log("inside sidepot", sidePot)
					result.totalTablePotAmount = + parseFloat( sidePot.reduce((partial_sum, a) => parseFloat(partial_sum) + parseFloat(a.sidePotAmount) , 0 ) + room.game.gameMainPot ).toFixed(4);
				}
				console.log("result.totalTablePotAmount", result.totalTablePotAmount)
				/*result.totalTablePotAmount = 0;
				if( (room.game.otherData.tempBets != undefined || room.game.otherData.tempBets != null) && room.game.otherData.tempBets.length > 0 ){
					result.totalTablePotAmount = room.game.otherData.tempBets.reduce((partial_sum, a) => partial_sum + a);
				}*/
				//result.totalTablePotAmount = room.game.bets.reduce((partial_sum, a) => partial_sum + a) + room.game.pot;
				gameNumber = room.game.gameNumber;
				gameId = room.game.id;

			} else {
				result.history = []
				result.currentRound = ''
				result.cards = []
				result.potAmount = 0
				result.PlayerSidePot = { sidepot:[], mainPot: 0 }
				result.totalTablePotAmount = 0
			}
			socket.myData = {};

			room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);

			if(room.game){
				let playersCards = [];
					for(let i=0; i < room.players.length; i++){
						if(room.players[i].status == 'Playing' && room.players[i].folded == false){
							playersCards.push({
								playerId : room.players[i].id,
								cards : ['BC','BC']
							});
						}
					}
					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnSubscribePlayersCards', { playersCards : playersCards, roomId:room.id });
	
	
					// Send Player Cards in his Socket.
					for(let i=0; i < room.players.length; i++){
						console.log("####################3Socket ID ################:-",socket.id);
						console.log("####################room.players[i].status :-",room.players[i].status);
						console.log("#################### cards:-",room.players[i].cards);
						if(room.players[i].id == data.playerId && room.players[i].status == 'Playing' && room.players[i].cards.length == 2 && room.players[i].folded == false){
							
							await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnPlayerCards',{
								playerId : room.players[i].id,
								cards : room.players[i].cards,
								roomId : room.id,
							})
	
						}
					}
				

			}

			//check if player alredy in array
			let oldPlayer = null;
			let oldPlayerLeftTimeDiff = null;
			if(room){
				if (room.players.length > 0) {
					for (let i = 0; i < room.players.length; i++) {
						if (room.players[i].id == player.id && room.players[i].status == 'Left') { // && room.players[i].status == 'Left' Remove by Me
							oldPlayer = room.players[i];
						    console.log("Old Player Calculated 1");
							break;
						}
					}
				}

				//var oldPlayerIdArr = [];
				//console.log("olddd",oldPlayer)
				//console.log("room.oldPlayers: ",room.oldPlayers)
				if(oldPlayer == null){
					if (room.oldPlayers.length > 0) {
						for (let i = 0; i < room.oldPlayers.length; i++) {console.log("olddplayer", room.oldPlayers[i].id, player.id)
							//oldPlayerIdArr.push(room.oldPlayers[i].id)
							if (room.oldPlayers[i].id == player.id && room.oldPlayers[i].status == 'Left') { // && room.players[i].status == 'Left' Remove by Me
								oldPlayer = room.oldPlayers[i];
								console.log("Old Player Calculated 2 in subscribe room");
								break;
							}
						}
					}
				}
			}
			//console.log("oldplayer", oldPlayer)

			//
			/*let minBuyIn = 0;
			let maxBuyIn = 0;*/
			let oldPlayerBuyIn = 0;
			
			let minBuyIn = room.minBuyIn;
			let maxBuyIn = room.maxBuyIn;
			// check for old player joiningchips
			if(oldPlayer){
				let oldPlayerLeftTime=moment(new Date(oldPlayer.oldPlayerLeftTime)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format();
				oldPlayerLeftTimeDiff = moment.duration(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).diff(moment(new Date(oldPlayer.oldPlayerLeftTime)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone))).asMinutes();
				console.log("oldPlayerLeftTime", oldPlayerLeftTime)
				console.log("Current time", moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format())
				console.log("oldPlayerLeftTimeDiff", oldPlayerLeftTimeDiff)
				if( oldPlayer.chips > minBuyIn && player.chips >= oldPlayer.chips && (Sys.Config.Texas.oldPlayerLeftTimeInMin) >= oldPlayerLeftTimeDiff){
					oldPlayerBuyIn = oldPlayer.chips;
				}
			}
			console.log("subscribe player min and max buyin", minBuyIn, maxBuyIn,oldPlayerBuyIn)
			
			// check for low chips player	
			/*let isLowChipsCheck = true;
			if (room.players.length > 0) {
				for (let i = 0; i < room.players.length; i++) {
					if (room.players[i].id == player.id ) { // && room.players[i].status == 'Left' Remove by Me
						if(room.players[i].status != 'Left' || (room.players[i].status == 'Left' && room.players[i].isAllinPlayersChipsAssigned == false) ){
							console.log("check low chispss", isLowChipsCheck, room.players[i])
							isLowChipsCheck = false
						}
					}					
				}
			}
			console.log("check low chispss", isLowChipsCheck)
				
			if(isLowChipsCheck){
			 	if(player.chips < minBuyIn){
					return {
						status: 'fail',
						result: null,
						message: 'You do not have enough chips to play in this table.'
					};
			 	}
			}*/
		
			// prebet options
			let defaultButtons = {
				playerId : data.playerId,
				sitOutNextHand : false ,
				sitOutNextBigBlind :  false,
				isFold :  false,
				isCheck :  false,
				isCall :  false,
			};
			for (let i = 0; i < room.players.length; i++) {
				if (room.players[i].id == player.id && room.players[i].status != 'Left' && room.players[i].status != 'Ideal') { // && room.players[i].status == 'Left' Remove by Me
					defaultButtons = {
					  playerId : room.players[i].id,
					  sitOutNextHand :  room.players[i].sitOutNextHand,
					  sitOutNextBigBlind :  room.players[i].sitOutNextBigBlind,
					  isFold :  room.players[i].isFold,
					  isCheck :  room.players[i].isCheck,
					  isCall :  room.players[i].isCall,
					};
					break;
				}
			}
			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnSubscribeRoom', {
				roomId : room.id,
				tableNumber : gameNumber,
				gameHistory: result,
				turnTime: parseFloat(room.otherData.gameSpeed),
				minBuyIn : minBuyIn,
				maxBuyIn : maxBuyIn,
				smallBlindChips: parseFloat(room.smallBlind),
				bigBlindChips: parseFloat(room.bigBlind),
				oldPlayerBuyIn: parseFloat(oldPlayerBuyIn),
				gameId: gameId,
				defaultButtons: defaultButtons
			});
						
			// End
			return {
				status: 'success',
				result: {
					roomId : room.id,
					tableNumber : gameNumber,
					gameHistory: result,
					turnTime: parseFloat(room.otherData.gameSpeed),
					minBuyIn : minBuyIn,
					maxBuyIn : maxBuyIn,
					smallBlindChips: parseFloat(room.smallBlind),
					bigBlindChips: parseFloat(room.bigBlind),
					oldPlayerBuyIn: parseFloat(oldPlayerBuyIn),
					gameId: gameId,
					defaultButtons: defaultButtons,
					//previousGameNumber : room.previousGameNumber,
					//previousGameId : room.previousGameId,
				},
				message: 'Player subscribed successfuly.'
			};
			
		}
		catch (e) {
			console.log("Error in subscribeRoom : ", e);
			return new Error(e);
		}
	},

	playerOnline: async function (socket, data){
		try {
			console.log("PlayerOnline Room is called");
	 
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {status: 'fail',	result: null,	message: "Room not found",statusCode: 401	};
			}

			let totalPlayers = 0;
			let dontStarttGameIfLowChips=false;

			let totalWaitingPlayers = 0;
			for(let i = 0; i < room.waitingPlayers.length; i++){
				if(room.waitingPlayers[i].waitForBigBlindCheckbox == true){
					totalWaitingPlayers++;
				}
			}

			if(totalWaitingPlayers > 0 && room.players.length == 1){
				room.players.push(room.waitingPlayers[0]);
				room.waitingPlayers.splice(0,1);
			}

			let playingPlayers = 0;
			for(let j = 0; j < room.players.length; j++){
				if(room.players[j].status == 'Playing'){
					playingPlayers++;
				}
			}
			console.log("PLAYING PLAYERS",playingPlayers)
			for(let i = 0; i< room.players.length; i++){
				console.log("ROOM PLAYERS",room.players[i].playerName,room.players[i].status)
				if(room.players[i].id == data.playerId && room.players[i].status != 'Left'){
					//check player has enough chips to play
					if(room.players[i].chips < room.smallBlind && room.players[i].extraChips == 0){
						let playerChips = await Sys.App.Services.PlayerServices.getSinglePlayerData({_id: room.players[i].id});
						console.log("playerchips in playerOnline", playerChips.chips, room.smallBlind);
						if( playerChips && playerChips.chips < room.minBuyIn ){
							console.log("Player don't have enough chips to get Online");
							return {
								status: 'fail',
								result: null,
								message: 'Player Have Low Chips, please add chips to play.'
							};
						}	
					}
					room.players[i].defaultActionCount = 0;
					room.players[i].status = 'Waiting';
					room.players[i].oldPlayerLeftTime = null;
					room.players[i].subscribeTime = new Date();
					room.players[i].idealTime = null;
					room.players[i].sitOutNextHand = false;
					room.players[i].sitOutNextBigBlind = false;
					if(playingPlayers >= 2){
						room.players[i].waitForBigBlindCheckbox = true;
						room.players[i].waitForBigBlindCheckboxValue = true;
					}
					/*room.players[i].defaultActionCount = 0;
					room.players[i].oldPlayerLeftTime = new Date();*/
					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnIdealPlayer', { 'playerId': room.players[i].id,status : false, roomId:room.id });
					if(room.players[i].chips <= 0){
						console.log("popup open for player from playerOnline", room.players[i].id);
						room.players[i].status = 'Ideal';
						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.players[i].socketId).emit('OnOpenBuyInPanel', { 'playerId': room.players[i].id, roomId:room.id });
						dontStarttGameIfLowChips = true;
					}
				}
				console.log("ROOM PLAYERS AFTER",room.players[i].playerName,room.players[i].status)
				if(room.players[i].status != 'Left' && room.players[i].status != 'Ideal'){
					totalPlayers++;
				}
			}

			room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);
			

			// Start Room if not running
			console.log("player onlinr room status", room.status);

			//Sys.Timers[room.id] = setTimeout(function () {
			if(room.game){
				console.log("room.game is present in playeronline", room.game.status)
				if(room.status != 'Running' && room.game.status == 'Finished' && totalPlayers >= room.minPlayers && room.timerStart == false && dontStarttGameIfLowChips == false && room.tempStatus != "inTransit"){	
					console.log('<===============================>');
					console.log('<=> New Game Starting After Player Online <=>');
					console.log("**************************************");
					console.log("game started from PlayeroNLINE")
					console.log("**************************************");
					console.log('<===============================>');
					room.timerStart =true;
					room.StartGame();
				}
			}else{
				if(room.status != 'Running'  && totalPlayers >= room.minPlayers && room.timerStart == false && dontStarttGameIfLowChips == false && room.tempStatus != "inTransit"){	
					console.log('<===============================>');
					console.log('<=> New Game Starting After Player Online <=>');
					console.log("**************************************");
					console.log("game started from PlayeroNLINE")
					console.log("**************************************");
					console.log('<===============================>');
					room.timerStart =true;
					room.StartGame();
				}
			}	
				
				
			//}, Sys.Config.Texas.waitBeforeGameStart)

			

			return {
				status: 'success',
				result: data.playerId,
				message: 'Player Live now'
			};
		 
		}
		catch (e) {
			console.log("Error in playerOnline : ", e);
			return new Error(e);
		}
	},

	playerMuckAction: async function (socket, data){
		try {
			console.log("playerMuckAction Room is called");

			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {status: 'fail',	result: null,	message: "Room not found",statusCode: 401	};
			}

			for(let i=0; i< room.players.length; i++){
				if(room.players[i].id == data.playerId && room.players[i].status != 'Left'){
					room.players[i].muck = data.action;
				}
			}

			return {
				status: 'success',
				result: data.playerId,
				message: 'Player Muck Option Done'
			};

		}
		catch (e) {
			console.log("Error in playerMuckAction : ", e);
			return new Error(e);
		}
	},

	playersCards: async function (socket, data){
		try {
			console.log("reconnectGame Room is called");

			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {status: 'fail',	result: null,	message: "Room not found",statusCode: 401	};
			}

			// Check Player Found!
			let cards = [];
			for(let i=0; i< room.players.length; i++){
				if(room.players[i].id == data.playerId && room.players[i].status == 'Playing'){
					cards = room.players[i].cards;
				}
			}

			return {
				status: 'success',
				result: {
					 cards : cards
				},
				message: 'Player Cards.'
			};
		}
		catch (e) {
			console.log("Error in playersCards : ", e);
			return new Error(e);
		}
	},

	reconnectGame: async function (socket, data){
		try {
			console.log("Reconnect Room socket ID ############################: ",socket.id);
			console.log("reconnectGame Room is called");
			// var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {status: 'fail',	result: null,	message: "Room not found",statusCode: 401	};
			}

			// Check Player Found!
			let playerFound = false;
			for(let i=0; i< room.players.length; i++){
				if(room.players[i].id == data.playerId && room.players[i].status != 'Left'){
					playerFound = true;
					room.players[i].socketId = socket.id; // Update Player Socket.
				}
			}

			if(!playerFound){
				return {
					status: 'fail',
					result: null,
					message: 'Opps Game Not Running!'
				};
			}

			room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
			socket.join(room.id); // Subscribe Room.

			let result = {}
			if (room.game && room.status == 'Running') {
				let sidePot = room.game.gamePot;
				console.log("sidepot and gamepot updates in reconnect", sidePot);

				result.history = room.game.history
				result.currentRound = room.game.roundName
				result.cards = room.game.board
				result.potAmount = room.game.pot
				result.PlayerSidePot = {
					sidePot : sidePot,
					mainPot : room.game.gameMainPot
				}
				result.totalTablePotAmount = room.game.gameMainPot;
				if( (sidePot != undefined || sidePot != null) && sidePot.length > 0 ){console.log("inside sidepot", sidePot)
					result.totalTablePotAmount = + parseFloat( sidePot.reduce((partial_sum, a) => parseFloat(partial_sum) + parseFloat(a.sidePotAmount) , 0 ) + room.game.gameMainPot ).toFixed(4);
				}
				console.log("result.totalTablePotAmount", result.totalTablePotAmount)
			} else {
				result.history = []
				result.currentRound = ''
				result.cards = []
				result.potAmount = 0
				result.PlayerSidePot = { sidepot:[], mainPot: 0 }
				result.totalTablePotAmount = 0
			}
			socket.myData = {};

			console.log("Reconnect Game ........ Reset Game ContentBrodcast Send.")
			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(socket.id).emit('ResetGame', {roomId: room.id});

			room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);

			if(room.game){
				let playersCards = [];
				
					for(let i=0; i < room.players.length; i++){
						if(room.players[i].status == 'Playing' && room.players[i].folded == false){
							playersCards.push({
								playerId : room.players[i].id,
								cards : ['BC','BC']
							});
						}
					}
					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnSubscribePlayersCards', { playersCards : playersCards, roomId:room.id });
	
	
					// Send Player Cards in his Socket.
					for(let i=0; i < room.players.length; i++){
						console.log("####################3Socket ID ################:-",socket.id);
						console.log("####################room.players[i].status :-",room.players[i].status);
						console.log("#################### cards:-",room.players[i].cards);
						if(room.players[i].id == data.playerId && room.players[i].status == 'Playing'  && room.players[i].folded == false){
							await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnPlayerCards',{
								playerId : room.players[i].id,
								cards : room.players[i].cards,
								roomId: room.id
							})
						}
					}
				
			}
			
			let minBuyIn = room.minBuyIn;
			let maxBuyIn = room.maxBuyIn;

			 
			 await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnSubscribeRoom', {
				roomId : room.id,
				tableNumber : room.game ? room.game.gameNumber : '',
				gameHistory: result,
				turnTime: parseFloat(room.otherData.gameSpeed),
				minBuyIn : minBuyIn,
				maxBuyIn : maxBuyIn,
				smallBlindChips: parseFloat(room.smallBlind),
				bigBlindChips: parseFloat(room.bigBlind),
				gameId: room.game ? room.game.id : ''
			});
			// End
			return {
				status: 'success',
				result: {
					roomId : room.id,
					tableNumber : room.game ? room.game.gameNumber : '',
					gameHistory: result,
					turnTime: parseFloat(room.otherData.gameSpeed),
					minBuyIn : minBuyIn,
					maxBuyIn : maxBuyIn,
					smallBlindChips: parseFloat(room.smallBlind),
					bigBlindChips: parseFloat(room.bigBlind),
					gameId: room.game ? room.game.id : '',
					//previousGameNumber : room.previousGameNumber,
					//previousGameId : room.previousGameId,
				},
				message: 'Player subscribed successfuly.'
			};
		}
		catch (e) {
			console.log("Error in subscribeRoom : ", e);
			return new Error(e);
		}
	},

	unSubscribeRoom: async function (socket, data) {
		try {
			console.log("unSubscribeRoom data : ", socket.id, data);
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return {
					status: 'fail',
					result: null,
					message: 'Room not found',
					statusCode: 401
				};
			}
			
			
			socket.leave(data.roomId);
			return {
				status: 'success',
				message: 'Player unsubscribed successfuly.',
				result: null
			};
		}
		catch (e) {
			console.log("Error in unSubscribeRoom : ", e);
			return new Error(e);
		}
	},

	joinRoom: async function (socket, data){
		try {
			// let checkDistance =	await Sys.Game.Common.Controllers.RoomController.LocationTableValidation(socket,data);
			
			// if(checkDistance.status == 'fail'){
			// 	return{
			// 	  status: 'fail',
			// 	  message: 'Someone playing nearby to you',
			// 	  result: null,
			// 	  statusCode: 401
			// 	}
			//   }

			console.log("1 controller Join Room:",data);

			

			var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			data.socketId = socket.id;
			//Shiv!@# Add PlAYER check

			if (player.chips < data.chips) {
				return {
					status: 'fail',
					message: 'Insufficient chips.'
				};
			}
			var room = null;
			let testRoomPlayers = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
				
		
			let playersLength = 0;
			if(testRoomPlayers.players){
				for(let i=0; i < testRoomPlayers.players.length; i++){

				  if (testRoomPlayers.players[i].status != 'Left') {
				    playersLength++;
				  }

				  if(testRoomPlayers.players[i].id == player.id && testRoomPlayers.players[i].status != 'Left') {
					return {
						status: 'fail',
						result: null,
						message: "You are already join this room",
						statusCode: 401
					};
				  }
				}
			}
			playersLength = testRoomPlayers.waitingPlayers.reduce(
				(accumulator, plr) =>
				  plr.status != 'Left' ? accumulator + 1 : accumulator,
				playersLength
			  );
			if(playersLength >= testRoomPlayers.maxPlayers ){console.log("**********maximum players*************");
				return {
					status: 'fail',
					result: null,
					message: "Maximum " + testRoomPlayers.maxPlayers + " Players are allowed.",
					statusCode: 401
				};
			}

			console.log("joinRoom player: ", player);
			console.log("joinRoom data: ", data);

			room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.joinRoom(player, data);

			console.log("RoomProcess.joinRoom room: ", room);

			if(room.status && room.status == "fail"){console.log("room status fail in room controller")
				return {
					status: 'fail',
					message: room.message,
				};
			}

			if(room instanceof Error){
				return { status: 'fail', result: null, message: room.message, statusCode: 401 }
			}
						
			// Add roomID and playerID to Player Socket Data
			socket.myData = {};
			socket.myData.playerID = data.playerId;
			socket.myData.roomID = room.id;
			console.log("Socket While join room : ", socket.id, socket.myData);


			if(room.game){
				let playersCards = [];
				for(let i=0; i < room.players.length; i++){
					if(room.players[i].status == 'Playing'){
						playersCards.push({
							playerId : room.players[i].id,
							cards : ['BC','BC']
						});
					}
				}
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnSubscribePlayersCards', { playersCards : playersCards, roomId:room.id })
			}

		//START: Chirag 31-08-2019 code add to check if system under maintenance if not so game continue running and if under maintenance show game not running
			let m_start_date = moment(new Date(Sys.Setting.maintenance.maintenance_start_date)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
			let m_end_date = moment(new Date(Sys.Setting.maintenance.maintenance_end_date)).tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
			let current_date = moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format("YYYY-MM-DD HH:mm");
		//END: Chirag 31-08-2019 code add to check if system under maintenance if not so game continue running and if under maintenance show game not running

			if(current_date >= m_start_date && current_date <= m_end_date && Sys.Setting.maintenance.status =='active'){
				Sys.Game.Common.Controllers.RoomController.playerRemoveBySystem(room);
				return { status: 'fail', result: null, message: 'System under maintenance, please login after sometimes', statusCode: 401 }
			}else{
				return {
					status: 'success',
					message: "Player Room Joind successfuly.",
					result: {
						roomId: room.id,
						turnTime: parseFloat(parseFloat(Sys.Config.Texas.Regular) / 1000)
					}
				};
			}
		}
		catch (error) {
			console.log('Error in JoinRoom : ', error);
			return new Error('Error in JoinRoom', error);
		}
	},

	leaveRoom: async function (socket, data) {
		try {
			let responce = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.leftRoom(data);

			if(!responce){
				return { status: 'fail', result: null, message: "Something Went Wrong", statusCode: 401 }
			}

			if(responce instanceof Error){
				return { status: 'fail', result: null, message: "Something Went Wrong", statusCode: 401 }
			}

			if(responce.status == 'success'){
				console.log("DATA STANDUP",data.standUp)
				if(data.standUp == 0){
					console.log("Player ID", data.playerId, "Is Going To Leave The Socket Room", data.roomId);
					socket.leave(data.roomId);
				}
				// socket.leave(data.roomId); // Unsubsribe
				let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
				//console.log("room data on leaving room", room);
				/*console.log("room data on leaving room", room);
				if(room && room.status == 'Running'){
					let	totalPlayers = 0;
					for (i = 0; i < room.players.length; i++) {
						if(room.players[i].status != 'Left'){
							totalPlayers++;
						}
					}
					console.log("totalplayers", totalPlayers)
					if(totalPlayers <= 1){
						clearTimeout(Sys.Timers[room.id]);
						room.game.status = 'ForceFinishedAllIn';
						await Sys.Game.CashGame.Texas.Controllers.PlayerProcess.progress(room);
					}
				}*/

				return {
					status: 'success',
					message: 'Player Leave successfuly.',
					result: null
				};
			}
			else{
				return {
					status: 'success',
					message: responce.message,
					result: null
				};
			}
		}
		catch (e) {
			console.log("Error in leaveRoom : ", e);
			return new Error(e);
		}
	},

	sitOutNextHand: async function (socket, data){
		try {
			let responce = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.sitOutNextHand(data);
			return { status: 'success', result: null, message: responce.message, statusCode: 200 }
		}
		catch (e) {
			console.log('Error in JoinRoom : ', e);
			return new Error(e);
		}
	},

	sitOutNextBigBlind: async function (socket, data){
		try {
			let responce = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.sitOutNextBigBlind(data);
			return { status: 'success', result: null, message: responce.message, statusCode: 200 }
		}
		catch (e) {
			console.log('Error in JoinRoom : ', e);
			return new Error(e);
		}
	},

	getPlayerReBuyInChips: async function (socket, data){
		try {
			console.log("getPlayerReBuyInChips Room is called");
			var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			if(!player){
				return { 	status: 'fail',	result: null, message: "Player Not found!",statusCode: 404	};
			}
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room || room == undefined) {
				return { 	status: 'fail',	result: null, message: "Room Not found!",statusCode: 404	};
			}
			let gamePlayer = null;
			for(let i=0; i < room.players.length; i++){
				if(room.players[i].id == data.playerId && room.players[i].status != 'Left'){
					gamePlayer = room.players[i];
				}
			}

			//Add chips for waiting players in SBBB functionality 
			for(let j = 0; j < room.waitingPlayers.length; j++){
				if(room.waitingPlayers[j].id == data.playerId && room.waitingPlayers[j].status != 'Left'){
					gamePlayer = room.waitingPlayers[j];
				}
			}

			if(gamePlayer == null){
				return { status: 'fail', result: null, message: "Player Not found!",statusCode: 404	};
			}

			if(gamePlayer.extraChips){
				return {
					status: 'fail',
					result: null,
					message: 'You have already requested for the chips.'
				};
			}

			
			let minBuyIn = room.minBuyIn;
			let maxBuyIn = room.maxBuyIn;
			console.log("maxbuyin", maxBuyIn);
			console.log("gameplayer", gamePlayer);
			console.log("entrychips", gamePlayer.entryChips);
			console.log("extra chips", gamePlayer.extraChips)
			/*if(maxBuyIn != 0){
				maxBuyIn = (maxBuyIn - parseFloat(parseFloat(gamePlayer.entryChips)+parseFloat(gamePlayer.extraChips)));
			}*/

			/*if(gamePlayer.entryChips <  maxBuyIn){
				maxBuyIn = (maxBuyIn - parseFloat(parseFloat(gamePlayer.entryChips)+parseFloat(gamePlayer.extraChips)));
			}else{
				return {
					status: 'fail',
					result: null,
					message: 'You have already used Maximum Buy in amount.'
				};
			}*/
			//check player adding chips had 0 chips or not
			/*if(gamePlayer.chips <= 0){
				minBuyIn = parseFloat(parseFloat(room.smallBlind) * 80);
				console.log("player had 0 chips so add minbuy in", minBuyIn)
			}*/

			//Check Player Chips Here.
			 if(player.chips < minBuyIn){
				return {
					status: 'fail',
					result: null,
					message: 'Player Have Low Chips'
				};
			 }
			 console.log("can not add more Chip before", gamePlayer.chips, maxBuyIn)
			 if(parseFloat(gamePlayer.chips) >=  parseFloat(maxBuyIn) ){
			 	console.log("can not add more Chip after")
			 	return {
			 		status: 'fail',
			 		result: null,
			 		message: "Can't add more chips"
			 	};
			 }
			 let currentMaxBuyIn = parseFloat(maxBuyIn - gamePlayer.chips).toFixed(4);
			 console.log("currentMaxBuyIn", currentMaxBuyIn);
			 let finalMaxBuyIn = (player.chips < currentMaxBuyIn )? player.chips : currentMaxBuyIn ;
			 console.log("final maxbuyin", finalMaxBuyIn)
			// End
			return {
				status: 'success',
				result: {
					roomId : room.id,
					minBuyIn : minBuyIn,
					maxBuyIn : parseFloat(finalMaxBuyIn),
					playerChips: player.chips
				},
				message: 'Player Re-BuyIn Chips.'
			};
		}
		catch (e) {
			console.log("Error in Re-BuyIn Chips : ", e);
			return new Error(e);
		}
	},

	playerAddChips: async function (socket, data){
		try {
			console.log("playerAddChips Room is called", data);
			var message='Chips will be added at the begining of the next hand';
			var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			if(!player){
				return { 	status: 'fail',	result: null, message: "Player Not found!",statusCode: 404	};
			}
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room || room == undefined) {
				return { 	status: 'fail',	result: null, message: "Room Not found!",statusCode: 404	};
			}
			if(player.chips < parseFloat(data.chips)){
				return {
					status: 'fail',
					result: null,
					message: 'Player Have Low Chips'
				};
			 }

			let gamePlayer = null;
			for(let i=0; i < room.players.length; i++){
				if(room.players[i].id == data.playerId && room.players[i].status != 'Left'){
					gamePlayer = room.players[i];
					let date = new Date()
					let timestamp1 = date.getTime();
					let sessionId= room.players[i].uniqId + "-" + room.tableNumber+"-" +timestamp1
					console.log("room.players[i].status :",room.players[i].status)

					let playingPlayers = 0;
					for(let j = 0; j < room.players.length; j++){
						if(room.players[j].status == 'Playing'){
							playingPlayers++;
						}
					}

					if(room.players[i].status == 'Ideal'){
						room.players[i].status = 'Waiting';
						room.players[i].folded = true;
						room.players[i].defaultActionCount = 0;
						room.players[i].oldPlayerLeftTime = null;
						room.players[i].subscribeTime = new Date();
						room.players[i].idealTime = null;
						room.players[i].sitOutNextHand = false;
						room.players[i].sitOutNextBigBlind = false;
						if(playingPlayers >= 2){
							room.players[i].waitForBigBlindCheckbox = true;
							room.players[i].waitForBigBlindCheckboxValue = true;
						}
					}
					room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);
					console.log("############## room.players[i].status :",room.players[i].status)
					room.players[i].extraChips = parseFloat(room.players[i].extraChips) + parseFloat(data.chips);
					if(room.players[i].status != 'Playing' || (room.players[i].folded == true) || room.status != 'Running' ){
						let traNumber = + new Date()
						let sessionData={
							sessionId:room.players[i].sessionId,
							uniqId:room.players[i].uniqId,
							user_id:room.players[i].id,
							username:room.players[i].playerName,
							chips: room.players[i].chips,
							previousBalance: parseFloat(player.chips),
							afterBalance: parseFloat(player.chips)+parseFloat(room.players[i].chips),
							type:"leftChips",
							remark:"game left by re-Buyin",
							category:"credit",
							transactionNumber: 'DEP-' + traNumber,
						}
						await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData);		
						
						let afterBalance=parseFloat(player.chips)+parseFloat(room.players[i].chips)
						
						room.players[i].chips = parseFloat(room.players[i].chips) + parseFloat(room.players[i].extraChips); // Add Rebuyin Chips to Orignal Account.
						let extraChips= room.players[i].extraChips;
						room.players[i].entryChips = parseFloat(room.players[i].entryChips) + parseFloat(room.players[i].extraChips);
						room.players[i].extraChips = 0;
						room.players[i].sessionId=sessionId;
						 traNumber = + new Date()
						 sessionData={
							sessionId:sessionId,
							uniqId:room.players[i].uniqId,
							username:room.players[i].playerName,
							chips: room.players[i].chips,
							user_id:room.players[i].id,
							previousBalance: parseFloat(afterBalance),
							afterBalance: parseFloat(afterBalance)- parseFloat(room.players[i].chips),
							type:"addChips",
							remark:"re-Buyin add chips",
							transactionNumber: 'DE-' + traNumber,
							category:"debit"
						}
						await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(sessionData);
						
						room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);
						message = ''
						await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnIdealPlayer', { 'playerId': room.players[i].id,status : false, roomId: room.id });
					}
				}

			}
			
			//Add chips for waiting players in SBBB functionality 
			for(let j=0; j < room.waitingPlayers.length; j++){
				if(room.waitingPlayers[j].id == data.playerId && room.waitingPlayers[j].status != 'Left'){
					gamePlayer = room.waitingPlayers[j];

					console.log("room.waitingPlayers[j].status :",room.waitingPlayers[j].status)

					console.log("############## room.waitingPlayers[j].status :",room.waitingPlayers[j].status)
					room.waitingPlayers[j].extraChips = parseFloat(room.waitingPlayers[j].extraChips) + parseFloat(data.chips);
					if(room.status != 'Running'){
						room.waitingPlayers[j].chips = parseFloat(room.waitingPlayers[j].chips) + parseFloat(room.waitingPlayers[j].extraChips); // Add Rebuyin Chips to Orignal Account.
						room.waitingPlayers[j].entryChips = parseFloat(room.waitingPlayers[j].entryChips) + parseFloat(room.waitingPlayers[j].extraChips);
						room.waitingPlayers[j].extraChips = 0;

						room = await Sys.Game.CashGame.Texas.Controllers.RoomProcess.broadcastPlayerInfo(room);
						message = ''
					}
				}

			}

			if(gamePlayer == null){
				return { status: 'fail', result: null, message: "Player Not found!",statusCode: 404	};
			}
				room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);
			let chips = parseFloat(player.chips) - parseFloat(data.chips);
			let playerUpdate = await Sys.Game.CashGame.Texas.Services.PlayerServices.update(player.id, { chips: chips }); // Update Player Chips
			console.log("add more chips", data.chips, player.chips, chips)
			// added by K@Y
			let transactionData = {
				user_id					: player.id,
				username				: player.username,
				chips					: parseFloat(data.chips),
				previousBalance			: parseFloat(player.chips),
				afterBalance			: chips,
				category				: 'debit',
				type					: 'buyIn',
				remark					: 'Chips added by player'
			}
			// await Sys.Game.CashGame.Texas.Services.ChipsServices.createTransaction(transactionData);
			
			let transactionAdminDebitData = {
	            user_id: player.id,
	            username: player.username,
	            chips: parseFloat(data.chips),
	            previousBalance: parseFloat(player.chips),
	            afterBalance: parseFloat(chips),
	            category: 'debit',
	            type: 'entry',
	            remark: 'Chips added by player',
	            isTournament: 'No',
	            isGamePot: 'no'
	      	}

	      	console.log("admin chips debit to player transactionAdminDebitData: ", transactionAdminDebitData);
	      	await Sys.Game.CashGame.Texas.Services.PlayerAllTransectionService.createTransaction(transactionAdminDebitData);
			
			// start game if already not running state @chetan
			let totalPlayers = 0;
			for (i = 0; i < room.players.length; i++) {
				if(room.players[i].status != 'Left' && room.players[i].status != 'Ideal'){
					totalPlayers++;
				}
			}

			if (room.status != 'Running' && totalPlayers >= room.minPlayers) {
				/*if (room.game == null && room.timerStart == false) {
					clearTimeout(Sys.Timers[room.id]); // Clear Room Timer
					room.StartGame();
				}*/
				if (room.game == null && room.timerStart == false) {
					room.timerStart = true; // When 12 Second Countdown Start.
					room = await Sys.Game.CashGame.Texas.Services.RoomServices.update(room);

					await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('OnGameStartWait', { roomId: room.id })
					console.log('Game object not present 2 in add chips');
					Sys.Timers[room.id] = setTimeout(function () {
						room.timerStart = false; // Reset Timer Variable
						clearTimeout(Sys.Timers[room.id]); // Clear Room Timer
						clearInterval(Sys.Timers[room.id]);
						console.log("Game Starting in add chips....");

						totalPlayers = 0;
						for (i = 0; i < room.players.length; i++) {
							if (room.players[i].status != 'Left' && room.players[i].status != 'Ideal') {
								totalPlayers++;
							}
						}
						console.log('<===============================>');
						console.log('<=> Game Starting [] New in add chips <=>', totalPlayers);
						console.log("pgame starting join room room status in add chips", room.status);
						console.log('<===============================>');
						if (totalPlayers >= room.minPlayers && room.status != 'Running') {
							console.log("**************************************");
							console.log("room started by add chips")
							console.log("**************************************");
							room.timerStart = true;
							room.StartGame();
						} else {
							console.log('<=> Some Player Leave So not Start Game. in add chips <=>', totalPlayers);
						}

					}, Sys.Config.Texas.waitBeforeGameStart)
				}
			}
			// End
			return {
				status: 'success',
				result: {
					roomId : room.id
				},
				message: message
			};
		}
		catch (e) {
			console.log("Error in Re-BuyIn Chips : ", e);
			return new Error(e);
		}
	},

	showMyCards: async function (socket, data){
		try {
			if( data.gameId ){
				var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
				console.log("show card player", player);
				if(!player){
					return { 	status: 'fail',	result: null, message: "Player Not found!",statusCode: 404	};
				}
				let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
				if (!room || room == undefined) {
					return { 	status: 'fail',	result: null, message: "Room Not found!",statusCode: 404	};
				}
				/*let game = await Sys.Game.CashGame.Texas.Services.GameServices.getSingleGameData({_id: data.gameId});
				if (!game || game == undefined) {
					return { 	status: 'fail',	result: null, message: "Game Not found!",statusCode: 404	};
				}
				let playerCards = ['BC','BC'];
				for(let g= 0; g < game.players.length; g++){
					if(game.players[g].id == data.playerId){
						playerCards = game.players[g].cards;
						break;
					}
				}
				if(game.players.length == 0){*/
					console.log("show cards players", Sys.Rooms[data.roomId].players )
					for(let g= 0; g < Sys.Rooms[data.roomId].players.length; g++){
						if(Sys.Rooms[data.roomId].players[g].id == data.playerId){
							playerCards = Sys.Rooms[data.roomId].players[g].cards;
							break;
						}
					}
				//}
				console.log("show my cards card", playerCards)
				await Sys.Io.of(Sys.Config.Namespace.CashTexas).to(room.id).emit('ShowCardResult', { playerId : data.playerId, cards:playerCards, roomId: room.id });
				return {
					status: 'success',
					result: {
						gameId : data.gameId ,
						cards: playerCards
					},
				};
			}else{
				console.log("gameID ie empty", data.roomID, data.playerId);
				Sys.Log.info("gameID ie empty", data.roomID, data.playerId);
				return {
					status: 'success',
				};
			}

		}
		catch (e) {
			console.log("Error in showMyCards : ", e);
			return new Error(e);
		}
	},

	defaultActionSelection: async function (socket, data){
		try {
			let room = await Sys.Game.CashGame.Texas.Services.RoomServices.get(data.roomId);
			if (!room) {
				return { status: 'fail',result: null,message: "Table not found", statusCode: 404 };
			}

			for(let i=0; i< room.players.length; i++){
				if(room.players[i].id == data.playerId && room.players[i].status != 'Left' && room.players[i].status != 'Ideal'){

					if(data.option == 'isFold'){
						room.players[i].isFold = true;
						room.players[i].isCheck = false;
						room.players[i].isCall = false;
					}

					if(data.option == 'removeIsFold'){
						room.players[i].isFold 	= false;
						room.players[i].isCheck = false;
						room.players[i].isCall	= false;
					}



					if(data.option == 'isCheck'){
						room.players[i].isFold = false;
						room.players[i].isCheck = true;
						room.players[i].isCall = false;
					}

					if(data.option == 'removeIsCheck'){
						room.players[i].isFold = false;
						room.players[i].isCheck = false;
						room.players[i].isCall = false;
					}


					if(data.option == 'isCall'){
						room.players[i].isFold = false;
						room.players[i].isCheck = false;
						room.players[i].isCall = true;
					}
					if(data.option == 'removeIsCall'){
						room.players[i].isFold = false;
						room.players[i].isCheck = false;
						room.players[i].isCall = false;
					}


				}
			}

			return {
				status: 'success',
				result: data.playerId,
				message: 'Player Default Action  Done'
			};

		}
		catch (error) {
			console.log("Error in defaultActionSelection : ",error);
			return new Error(error);
		}
	},

}
