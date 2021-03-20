var Sys = require('../../../Boot/Sys');

module.exports = function (Socket) {
  try {
    Socket.on("ReconnectPlayer",async function(data,responce) {
      console.log("ReconnectPlayer Called:", data)
      responce(await Sys.Game.Common.Controllers.PlayerController.reconnectPlayer(Socket,data));
    });

    Socket.on("LoginPlayer",async function(data,responce) {
      console.log("LoginPlayer Called:", data);
      responce(await Sys.Game.Common.Controllers.PlayerController.playerLogin(Socket,data));
    });

    Socket.on("RegisterPlayer",async function(data,responce) {
      console.log("RegisterPlayer Called:", data);
      responce(await Sys.Game.Common.Controllers.PlayerController.playerRegister(Socket,data));
    });

    Socket.on("ChangeUsername",async function(data,responce) {
      console.log("ChangeUsername Called:", data);
      responce(await Sys.Game.Common.Controllers.PlayerController.changeUsername(Socket,data));
    });

    Socket.on("LogOutPlayer",async function(data,responce) {
      console.log("LogOutPlayer Called:", data)
      responce(await Sys.Game.Common.Controllers.PlayerController.playerLogout(Socket,data));
    });
    
    Socket.on("PlayerProfile",async function(data,responce) {
      console.log("PlayerProfile Called:", data);
      responce(await Sys.Game.Common.Controllers.PlayerController.playerProfile(Socket,data));
    });
   
    Socket.on("PlayerProfilePic",async function(data,responce) {
      console.log("playerProfilePic Called:", data)
      responce(await Sys.Game.Common.Controllers.PlayerController.playerPicUpdate(Socket,data));
    });

    Socket.on("PlayerForgotPassword",async function(data,responce) {
      console.log("playerForgotPassword Called:", data)
      responce(await Sys.Game.Common.Controllers.PlayerController.playerForgotPassword(Socket,data));
    });

    Socket.on("PlayerChangePassword",async function(data,responce) {
      console.log("playerChangePassword Called:", data)
      responce(await Sys.Game.Common.Controllers.PlayerController.playerChangePassword(Socket,data));
    });

    Socket.on("SearchLobby",async function(data,responce) {
      console.log("SearchLobby  Called :",data);
      responce(await Sys.Game.Common.Controllers.RoomController.listRooms(Socket,data));
    });

    Socket.on("GetBuyinsAndPlayerchips",async function(data,responce) {
      console.log("GetBuyinsAndPlayerchips :",data);
      responce(await Sys.Game.Common.Controllers.RoomController.getBuyinsAndPlayerchips(Socket,data));
    });

    Socket.on("disconnect", async function() {
      console.log("Socket Disconnected");
    });

  } catch (error) {
    console.log("Error In Common Socket Handler : ", error);
  }

}
