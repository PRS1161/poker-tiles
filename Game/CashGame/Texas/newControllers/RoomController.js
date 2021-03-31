var Sys = require('../../../../Boot/Sys');
var moment = require('moment-timezone');
module.exports = {
    subscribeRoom: async function (socket, data){
		try {
			console.log("Subscribe Room is called");
			var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			let room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.checkRoomSeatAvilability(socket,data);
			
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
			console.log("check, subsctibe", room.status, room.game)
			if (room.game && room.status == 'Running') {
				let sidePot = room.game.gamePot;
				console.log("sidepot and gamepot updates", sidePot);
				 
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
                    console.log("::: SidePot :",sidePot)
                    console.log("::: room.game.gameMainPot :",room.game.gameMainPot)
                    console.log("/************************************/")
                }
				/** End ::: Custom code for Side Pot Two Player (code is Petch) */
				result.history = room.game.history
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

			room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.broadcastPlayerInfo(room);

			if(room.game){
				let playersCards = [];
					for(let i=0; i < room.players.length; i++){
						if(room.players[i].status == 'Playing' && room.players[i].folded == false){
							playersCards.push({
								playerId : room.players[i].id,
								cards : ['BC', 'BC', 'BC', 'BC', 'BC', 'BC']
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
		
			// prebet options
			let defaultButtons = {
				playerId : data.playerId,
				isFold :  false,
				isCheck :  false,
				isCall :  false,
			};
			for (let i = 0; i < room.players.length; i++) {
				if (room.players[i].id == player.id && room.players[i].status != 'Left' && room.players[i].status != 'Ideal') { // && room.players[i].status == 'Left' Remove by Me
					defaultButtons = {
                        playerId : room.players[i].id,
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
				minBuyIn : room.minBuyIn,
				maxBuyIn : room.maxBuyIn,
				smallBlindChips: parseFloat(room.smallBlind),
				bigBlindChips: parseFloat(room.bigBlind),
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
					minBuyIn : room.minBuyIn,
					maxBuyIn : room.maxBuyIn,
					smallBlindChips: parseFloat(room.smallBlind),
					bigBlindChips: parseFloat(room.bigBlind),
					gameId: gameId,
					defaultButtons: defaultButtons
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
					room.players[i].subscribeTime = new Date();
					room.players[i].idealTime = null;

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

			room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.broadcastPlayerInfo(room);
			

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

    reconnectGame: async function (socket, data){
		try {
			console.log("Reconnect Room socket ID ############################: ",socket.id);
			console.log("reconnectGame Room is called");
			
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

			room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.broadcastPlayerInfo(room);

			if(room.game){
				let playersCards = [];
				
					for(let i=0; i < room.players.length; i++){
						if(room.players[i].status == 'Playing' && room.players[i].folded == false){
							playersCards.push({
								playerId : room.players[i].id,
								cards : ['BC', 'BC', 'BC', 'BC', 'BC', 'BC']
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
			
			await Sys.Io.of(Sys.Config.Namespace.CashTexas).to([socket.id]).emit('OnSubscribeRoom', {
				roomId : room.id,
				tableNumber : room.game ? room.game.gameNumber : '',
				gameHistory: result,
				turnTime: parseFloat(room.otherData.gameSpeed),
				minBuyIn : room.minBuyIn,
				maxBuyIn : room.maxBuyIn,
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
					minBuyIn : room.minBuyIn,
					maxBuyIn : room.maxBuyIn,
					smallBlindChips: parseFloat(room.smallBlind),
					bigBlindChips: parseFloat(room.bigBlind),
					gameId: room.game ? room.game.id : ''
				},
				message: 'Player subscribed successfuly.'
			};
		}
		catch (e) {
			console.log("Error in reconnectGame : ", e);
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
			console.log("Join Room called")
			var player = await Sys.Game.CashGame.Texas.Services.PlayerServices.getById(data.playerId);
			data.socketId = socket.id;
			
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

			room = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.joinRoom(player, data);

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
							cards : ['BC', 'BC', 'BC', 'BC', 'BC', 'BC']
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
            console.log("leave room called")
			let responce = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.leftRoom(data);

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
				message: 'Player Default Action Done'
			};
		}
		catch (error) {
			console.log("Error in defaultActionSelection : ",error);
			return new Error(error);
		}
	},
}