var Sys = require('../../../../Boot/Sys');

module.exports = {
    playerAction: async function(socket, data) {
        try {
            var action = await Sys.Game.CashGame.Texas.newControllers.RoomProcess.playerAction(data);
            return {
              status: 'success',
              result  : null,
              data: action,
              message: 'Player action successful.'
            };
        } catch (error) {
            console.log("Error in playerAction:" ,error);
        }
    }
}