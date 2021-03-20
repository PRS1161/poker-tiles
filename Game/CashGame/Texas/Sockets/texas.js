var Sys = require('../../../../Boot/Sys');

module.exports = function (Socket) {
  try {
    
    Socket.on("RoomInfo",async function(data,responce) {
      console.log("RoomInfo  Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.roomInfo(Socket,data));
    });

    Socket.on("SubscribeRoom",async function(data,responce) {
      console.log("SubscribeRoom  Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.subscribeRoom(Socket,data));
    });
    
    Socket.on("ReconnectGame",async function(data,responce) {
      console.log("ReconnectGame Regualer Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.reconnectGame(Socket,data));
    });

    Socket.on("UnSubscribeRoom",async function(data,responce) {
      console.log("UnSubscribeRoom  Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.unSubscribeRoom(Socket,data));
    });

    Socket.on("JoinRoom",async function(data,responce) {
      console.log("1 JoinRoom  Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.joinRoom(Socket,data));
    });

    Socket.on("LeaveRoom",async function(data,responce) {
      console.log("LeaveRoom  Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.leaveRoom(Socket,data));
    });

    Socket.on("SitOutNextHand",async function(data,responce) {
      console.log("TSitOut Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.sitOutNextHand(Socket,data));
    });

    Socket.on("SitOutNextBigBlind",async function(data,responce) {
      console.log("sitOutNextBigBlind Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.sitOutNextBigBlind(Socket,data));
    });

    // Player Events
    
    Socket.on("PlayerAction",async function(data,responce) {
      console.log("-------------------------------------------------");
      console.log(" PlayerAction  Called ::-> ",data);
      console.log("-------------------------------------------------");
      responce(await Sys.Game.CashGame.Texas.Controllers.PlayerController.playerAction(Socket,data));
    });

    Socket.on("GetPlayerReBuyInChips",async function(data,responce) {
      console.log("GetPlayerReBuyInChips Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.getPlayerReBuyInChips(Socket,data));
    });

    Socket.on("PlayerAddChips",async function(data,responce) {
      console.log("PlayerAddChips Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.playerAddChips(Socket,data));
    });

    Socket.on("PlayerMuckAction",async function(data,responce) {
      console.log("PlayerMuckAction Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.playerMuckAction(Socket,data));
    });

    Socket.on("PlayerOnline",async function(data,responce) {
      console.log("PlayerOnline Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.playerOnline(Socket,data));
    });

    // show cards event
    Socket.on("ShowMyCards",async function(data,responce) {
      console.log("ShowMyCards Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.showMyCards(Socket,data));
    });

    // prebets
    Socket.on("DefaultActionSelection",async function(data,responce) {
      console.log("DefaultActionSelection Called :",data);
      responce(await Sys.Game.CashGame.Texas.Controllers.RoomController.defaultActionSelection(Socket,data));
    });

    Socket.on("disconnect",async function() {
      console.log("disconnect Called");
      if(Socket.myData != undefined){
        if(Socket.myData.playerID != undefined && Socket.myData.roomID != undefined ){
          let data = {
            playerId : Socket.myData.playerID,
            roomId  : Socket.myData.roomID
          }
         // await Sys.Game.CashGame.Texas.Controllers.RoomController.leaveRoom(Socket, data);
          console.log("Socket ID", Socket.id, "Disconnected From Game Play");
        }
        else{
          //console.log("********************************** In Socket Disconnect : Some ID not found **********************************");
        }
      }
      else{
        //console.log("********************************** In Socket Disconnect : myData not found **********************************");
      }
    });

  }
  catch (e) {
    console.log("Error in Cash Game Socket Handler : ", e);
  }

}
